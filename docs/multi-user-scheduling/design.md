# マルチユーザーカレンダー共有 設計書

## 概要

複数のユーザーでカレンダーを共有し、スケジュールの閲覧・編集ができる機能を実装する。

---

## 1. 要件

### 機能要件

1. **カレンダー作成**: ユーザーは複数のカレンダーを作成できる
2. **カレンダー共有**: 他のユーザーにカレンダーを共有できる
3. **権限管理**: 閲覧のみ / 編集可能 / 管理者 の3段階
4. **招待フロー**: リンク招待 / メールアドレス招待
5. **公開カレンダー**: URL共有で誰でも閲覧可能なモード
6. **複数カレンダー表示**: 複数のカレンダーを1画面で表示・切替

### 非機能要件

- 既存のスケジュールは「デフォルトカレンダー」に自動マイグレーション
- 権限チェックはすべてバックエンドで実施
- 共有リンクはトークンベース（推測困難）

---

## 2. データベース設計

### 新規テーブル

```sql
-- カレンダーテーブル
CREATE TABLE calendars (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_public INTEGER NOT NULL DEFAULT 0,  -- 公開カレンダーかどうか
  public_token TEXT UNIQUE,              -- 公開URL用トークン
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- カレンダーメンバー（共有）テーブル
CREATE TABLE calendar_members (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',  -- 'viewer' | 'editor' | 'admin'
  invited_by TEXT REFERENCES users(id),
  accepted_at TEXT,                      -- NULLなら招待中
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(calendar_id, user_id)
);

-- 招待リンクテーブル
CREATE TABLE calendar_invitations (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer',  -- 招待時の権限
  expires_at TEXT NOT NULL,
  max_uses INTEGER,                      -- NULL = 無制限
  use_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
```

### 既存テーブルの変更

```sql
-- schedulesテーブルにcalendar_idを追加
ALTER TABLE schedules ADD COLUMN calendar_id TEXT REFERENCES calendars(id) ON DELETE CASCADE;

-- categoriesテーブルにcalendar_idを追加（カレンダーごとのカテゴリ）
ALTER TABLE categories ADD COLUMN calendar_id TEXT REFERENCES calendars(id) ON DELETE CASCADE;
```

### Drizzleスキーマ

```typescript
// 新規: calendars
export const calendars = sqliteTable("calendars", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  publicToken: text("public_token").unique(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 新規: calendar_members
export const calendarMembers = sqliteTable("calendar_members", {
  id: text("id").primaryKey(),
  calendarId: text("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("viewer"), // 'viewer' | 'editor' | 'admin'
  invitedBy: text("invited_by").references(() => users.id),
  acceptedAt: text("accepted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 新規: calendar_invitations
export const calendarInvitations = sqliteTable("calendar_invitations", {
  id: text("id").primaryKey(),
  calendarId: text("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("viewer"),
  expiresAt: text("expires_at").notNull(),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});
```

### ERダイアグラム

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   users     │       │   calendars     │       │  schedules  │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ owner_id (FK)   │       │ id (PK)     │
│ email       │       │ id (PK)         │◄──────│ calendar_id │
│ name        │       │ name            │       │ user_id     │
│ ...         │       │ color           │       │ title       │
└─────────────┘       │ is_public       │       │ ...         │
      │               │ public_token    │       └─────────────┘
      │               └─────────────────┘
      │                       │
      │               ┌───────┴───────┐
      │               │               │
      ▼               ▼               ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   calendar_members      │   │  calendar_invitations   │
├─────────────────────────┤   ├─────────────────────────┤
│ id (PK)                 │   │ id (PK)                 │
│ calendar_id (FK)        │   │ calendar_id (FK)        │
│ user_id (FK)            │   │ token                   │
│ role                    │   │ role                    │
│ invited_by (FK)         │   │ expires_at              │
│ accepted_at             │   │ max_uses                │
└─────────────────────────┘   │ use_count               │
                              └─────────────────────────┘
```

---

## 3. 権限モデル

### ロール定義

| ロール | 説明 | 権限 |
|--------|------|------|
| `owner` | カレンダー作成者 | すべての操作 + 削除 |
| `admin` | 管理者 | メンバー管理 + 設定変更 + 編集 |
| `editor` | 編集者 | スケジュールの作成・編集・削除 |
| `viewer` | 閲覧者 | スケジュールの閲覧のみ |

### 権限マトリクス

| 操作 | owner | admin | editor | viewer | public |
|------|-------|-------|--------|--------|--------|
| スケジュール閲覧 | ✅ | ✅ | ✅ | ✅ | ✅ |
| スケジュール作成 | ✅ | ✅ | ✅ | ❌ | ❌ |
| スケジュール編集 | ✅ | ✅ | ✅* | ❌ | ❌ |
| スケジュール削除 | ✅ | ✅ | ✅* | ❌ | ❌ |
| カテゴリ管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| メンバー招待 | ✅ | ✅ | ❌ | ❌ | ❌ |
| メンバー削除 | ✅ | ✅ | ❌ | ❌ | ❌ |
| カレンダー設定変更 | ✅ | ✅ | ❌ | ❌ | ❌ |
| カレンダー削除 | ✅ | ❌ | ❌ | ❌ | ❌ |
| カレンダー離脱 | - | ✅ | ✅ | ✅ | - |

*editor は自分が作成したスケジュールのみ編集・削除可能

---

## 4. API設計

### カレンダー管理

```
GET    /calendars                    - カレンダー一覧（自分がアクセス可能なもの）
POST   /calendars                    - カレンダー作成
GET    /calendars/:id                - カレンダー詳細
PUT    /calendars/:id                - カレンダー更新（owner/admin）
DELETE /calendars/:id                - カレンダー削除（ownerのみ）
```

### メンバー管理

```
GET    /calendars/:id/members        - メンバー一覧
POST   /calendars/:id/members        - メンバー追加（メールアドレス指定）
PUT    /calendars/:id/members/:uid   - メンバー権限変更
DELETE /calendars/:id/members/:uid   - メンバー削除
POST   /calendars/:id/leave          - カレンダーから離脱
```

### 招待リンク

```
POST   /calendars/:id/invitations    - 招待リンク生成
GET    /calendars/:id/invitations    - 招待リンク一覧
DELETE /invitations/:token           - 招待リンク無効化
POST   /invitations/:token/accept    - 招待リンクで参加
GET    /invitations/:token           - 招待リンク情報取得（未ログインでも可）
```

### 公開カレンダー

```
PUT    /calendars/:id/public         - 公開設定変更
GET    /public/:token                - 公開カレンダー閲覧（認証不要）
GET    /public/:token/schedules      - 公開カレンダーのスケジュール一覧
```

### 既存APIの変更

```
# スケジュール系
GET    /schedules?calendarId=xxx     - カレンダーIDでフィルタ
POST   /schedules                    - calendarIdを必須に
PUT    /schedules/:id                - 権限チェック追加
DELETE /schedules/:id                - 権限チェック追加

# カテゴリ系
GET    /categories?calendarId=xxx    - カレンダーIDでフィルタ
POST   /categories                   - calendarIdを追加
```

### リクエスト/レスポンススキーマ

```typescript
// カレンダー作成
const createCalendarInput = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// カレンダーレスポンス
const calendarResponse = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  isPublic: z.boolean(),
  publicUrl: z.string().nullable(),
  role: z.enum(["owner", "admin", "editor", "viewer"]),
  memberCount: z.number(),
  owner: z.object({
    id: z.string(),
    name: z.string(),
    picture: z.string().nullable(),
  }),
});

// メンバー追加
const addMemberInput = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

// 招待リンク作成
const createInvitationInput = z.object({
  role: z.enum(["editor", "viewer"]),
  expiresInDays: z.number().min(1).max(30).default(7),
  maxUses: z.number().min(1).max(100).nullable(),
});
```

---

## 5. フロントエンド設計

### 新規コンポーネント

```
components/
├─ Calendar/
│   ├─ CalendarSelector.tsx      - カレンダー選択ドロップダウン
│   └─ CalendarColorDot.tsx      - カレンダー色表示
├─ CalendarManagement/
│   ├─ CalendarListModal.tsx     - カレンダー一覧・管理モーダル
│   ├─ CalendarCreateModal.tsx   - カレンダー作成モーダル
│   ├─ CalendarSettingsModal.tsx - カレンダー設定モーダル
│   ├─ MemberListModal.tsx       - メンバー一覧モーダル
│   ├─ InviteMemberModal.tsx     - メンバー招待モーダル
│   └─ InviteLinkModal.tsx       - 招待リンク管理モーダル
├─ Share/
│   ├─ ShareButton.tsx           - 共有ボタン
│   └─ PublicCalendarView.tsx    - 公開カレンダー表示
└─ Invitation/
    └─ InvitationAcceptPage.tsx  - 招待受諾ページ
```

### 状態管理

```typescript
// CalendarContext
interface CalendarContextValue {
  calendars: Calendar[];              // アクセス可能なカレンダー一覧
  selectedCalendarIds: string[];      // 現在表示中のカレンダーID
  defaultCalendarId: string | null;   // デフォルトカレンダー
  toggleCalendar: (id: string) => void;
  selectAllCalendars: () => void;
  setDefaultCalendar: (id: string) => void;
}

// React Query キー
const queryKeys = {
  calendars: ['calendars'],
  calendarMembers: (id: string) => ['calendars', id, 'members'],
  calendarInvitations: (id: string) => ['calendars', id, 'invitations'],
  schedules: (year: number, month: number, calendarIds: string[]) =>
    ['schedules', year, month, ...calendarIds],
};
```

### UIフロー

#### カレンダー切替UI

```
┌─────────────────────────────────────────┐
│ 🗓️ カレンダー ▼                         │
├─────────────────────────────────────────┤
│ ☑ 🔵 マイカレンダー          [⚙️]      │
│ ☑ 🟢 仕事                    [⚙️]      │
│ ☐ 🟡 家族共有カレンダー       [👥3]    │
│ ─────────────────────────────────────   │
│ [+ 新しいカレンダー]                    │
└─────────────────────────────────────────┘
```

#### 共有フロー

```
1. カレンダー設定 → 共有設定
2. 「メンバーを招待」ボタン
3. 招待方法を選択:
   - メールアドレスで招待
   - 招待リンクを生成
4. 権限を選択（閲覧のみ / 編集可能）
5. 招待送信 / リンクコピー
```

---

## 6. マイグレーション戦略

### Phase 1: スキーマ追加

1. 新規テーブル作成（calendars, calendar_members, calendar_invitations）
2. schedules, categoriesにcalendar_idカラム追加（NULL許可）

### Phase 2: データマイグレーション

1. 既存ユーザーごとに「マイカレンダー」を自動作成
2. 既存schedules, categoriesにcalendar_idを設定
3. calendar_membersにownerレコードを作成

### Phase 3: 制約適用

1. calendar_idをNOT NULL制約に変更
2. 外部キー制約を適用

### マイグレーションスクリプト例

```sql
-- Phase 1
CREATE TABLE calendars (...);
CREATE TABLE calendar_members (...);
CREATE TABLE calendar_invitations (...);
ALTER TABLE schedules ADD COLUMN calendar_id TEXT;
ALTER TABLE categories ADD COLUMN calendar_id TEXT;

-- Phase 2 (アプリケーションコードで実行)
-- 1. 各ユーザーにデフォルトカレンダーを作成
-- 2. 既存データにcalendar_idを設定

-- Phase 3 (確認後)
-- SQLiteはALTER TABLE制約変更が限定的なため、
-- 新テーブル作成 → データコピー → リネームの手順
```

---

## 7. セキュリティ考慮事項

### 認可チェック

- すべてのAPIで権限チェックを実施
- calendar_idとユーザーの関係を必ず検証
- 公開トークンは十分な長さ（32文字以上）のランダム文字列

### レート制限

- 招待リンク生成: 1カレンダーあたり10件/日
- メンバー追加: 1カレンダーあたり50件/日

### 監査ログ（将来実装）

- メンバー追加/削除
- 権限変更
- カレンダー設定変更

---

## 8. 代替案の検討

### Option A: カテゴリ単位の共有（却下）

- メリット: 最小限の変更
- デメリット: カテゴリとカレンダーの概念が混在、拡張性が低い

### Option B: スケジュール単位の共有（却下）

- メリット: 細かい粒度で共有可能
- デメリット: UI複雑化、パフォーマンス懸念

### Option C: カレンダーテーブル追加（採用）

- メリット: Google Calendar等と同じモデル、拡張性が高い
- デメリット: 実装量が多い

---

## 更新履歴

- 2026-01-08: 初版作成
