# マルチユーザーカレンダー共有 タスクリスト

## 概要

カレンダー共有機能の実装タスクを段階的に整理したリスト。

---

## Phase 1: データベース基盤

### 1.1 スキーマ定義

- [ ] `calendars`テーブルのDrizzleスキーマ定義
- [ ] `calendar_members`テーブルのDrizzleスキーマ定義
- [ ] `calendar_invitations`テーブルのDrizzleスキーマ定義
- [ ] `schedules`テーブルに`calendar_id`カラム追加
- [ ] `categories`テーブルに`calendar_id`カラム追加
- [ ] 型エクスポートの追加

### 1.2 マイグレーション

- [ ] マイグレーションファイル作成（0005_add_calendars.sql）
- [ ] ローカル環境でマイグレーション実行・検証
- [ ] 既存データのマイグレーションスクリプト作成
  - [ ] 各ユーザーにデフォルトカレンダー作成
  - [ ] 既存schedules, categoriesにcalendar_id設定
  - [ ] calendar_membersにownerレコード作成

### 1.3 リポジトリ層

- [ ] `CalendarRepository`の実装
  - [ ] `create`
  - [ ] `findById`
  - [ ] `findByUserId`（アクセス可能なカレンダー一覧）
  - [ ] `update`
  - [ ] `delete`
- [ ] `CalendarMemberRepository`の実装
  - [ ] `create`
  - [ ] `findByCalendarId`
  - [ ] `findByUserIdAndCalendarId`
  - [ ] `updateRole`
  - [ ] `delete`
- [ ] `CalendarInvitationRepository`の実装
  - [ ] `create`
  - [ ] `findByToken`
  - [ ] `findByCalendarId`
  - [ ] `incrementUseCount`
  - [ ] `delete`
- [ ] 既存リポジトリの更新
  - [ ] `ScheduleRepository`に`calendar_id`対応追加
  - [ ] `CategoryRepository`に`calendar_id`対応追加

**推定作業量**: 中

---

## Phase 2: バックエンドAPI - カレンダー管理

### 2.1 Zodスキーマ定義（shared）

- [ ] `calendarInput`スキーマ
- [ ] `calendarResponse`スキーマ
- [ ] `calendarMemberInput`スキーマ
- [ ] `calendarMemberResponse`スキーマ
- [ ] `calendarInvitationInput`スキーマ
- [ ] `calendarInvitationResponse`スキーマ

### 2.2 ユースケース実装

- [ ] `CreateCalendarUseCase`
- [ ] `GetCalendarsUseCase`（アクセス可能なカレンダー一覧）
- [ ] `GetCalendarDetailUseCase`
- [ ] `UpdateCalendarUseCase`
- [ ] `DeleteCalendarUseCase`

### 2.3 APIルート実装

- [ ] `GET /calendars`
- [ ] `POST /calendars`
- [ ] `GET /calendars/:id`
- [ ] `PUT /calendars/:id`
- [ ] `DELETE /calendars/:id`

### 2.4 テスト

- [ ] カレンダーCRUDのユニットテスト
- [ ] カレンダーAPIのE2Eテスト

**推定作業量**: 中

---

## Phase 3: バックエンドAPI - メンバー管理

### 3.1 権限チェックミドルウェア

- [ ] `calendarAuthMiddleware`の実装
  - [ ] カレンダーへのアクセス権確認
  - [ ] ロールに基づく操作権限確認
- [ ] 権限ヘルパー関数
  - [ ] `canEdit(role): boolean`
  - [ ] `canManageMembers(role): boolean`
  - [ ] `isOwner(role): boolean`

### 3.2 ユースケース実装

- [ ] `AddMemberUseCase`
- [ ] `GetMembersUseCase`
- [ ] `UpdateMemberRoleUseCase`
- [ ] `RemoveMemberUseCase`
- [ ] `LeaveCalendarUseCase`
- [ ] `TransferOwnershipUseCase`

### 3.3 APIルート実装

- [ ] `GET /calendars/:id/members`
- [ ] `POST /calendars/:id/members`
- [ ] `PUT /calendars/:id/members/:userId`
- [ ] `DELETE /calendars/:id/members/:userId`
- [ ] `POST /calendars/:id/leave`
- [ ] `PUT /calendars/:id/transfer`（オーナー移譲）

### 3.4 テスト

- [ ] メンバー管理のユニットテスト
- [ ] 権限チェックのテスト
- [ ] メンバーAPIのE2Eテスト

**推定作業量**: 中

---

## Phase 4: バックエンドAPI - 招待機能

### 4.1 招待リンク機能

- [ ] トークン生成ユーティリティ
- [ ] `CreateInvitationUseCase`
- [ ] `GetInvitationsUseCase`
- [ ] `AcceptInvitationUseCase`
- [ ] `RevokeInvitationUseCase`

### 4.2 APIルート実装

- [ ] `POST /calendars/:id/invitations`（admin以上）
- [ ] `GET /calendars/:id/invitations`（admin以上）
- [ ] `DELETE /calendars/:id/invitations/:id`（admin以上）
- [ ] `GET /invitations/:token`（認証不要）
- [ ] `POST /invitations/:token/accept`（認証必須）

### 4.3 テスト

- [ ] 招待リンクのユニットテスト
- [ ] 招待APIのE2Eテスト

**推定作業量**: 中〜大

---

## Phase 5: 既存API更新

### 5.1 スケジュールAPI更新

- [ ] `POST /schedules`に`calendarId`パラメータ追加
- [ ] `GET /schedules`にカレンダー権限チェック追加
- [ ] `PUT /schedules/:id`に権限チェック追加
- [ ] `DELETE /schedules/:id`に権限チェック追加
- [ ] 繰り返しスケジュールAPIの権限チェック追加

### 5.2 カテゴリAPI更新

- [ ] `POST /categories`に`calendarId`パラメータ追加
- [ ] `GET /categories`にカレンダー別フィルタ追加
- [ ] カテゴリ編集・削除の権限チェック追加

### 5.3 後方互換性

- [ ] `calendarId`省略時はデフォルトカレンダーを使用
- [ ] 既存テストの更新

### 5.4 テスト更新

- [ ] 既存スケジュールテストの更新
- [ ] 権限チェックを含む新規テスト追加

**推定作業量**: 中

---

## Phase 6: フロントエンド - カレンダー管理UI

### 6.1 API クライアント更新

- [ ] カレンダー関連APIの追加
  - [ ] `fetchCalendars`
  - [ ] `createCalendar`
  - [ ] `updateCalendar`
  - [ ] `deleteCalendar`
- [ ] メンバー関連APIの追加
- [ ] 招待関連APIの追加

### 6.2 状態管理

- [ ] `CalendarContext`の実装
- [ ] カレンダー選択状態の永続化（localStorage）
- [ ] React Queryキーの更新

### 6.3 カレンダー選択UI

- [ ] `CalendarSelector`コンポーネント
- [ ] `CalendarColorDot`コンポーネント
- [ ] サイドバーへの統合

### 6.4 カレンダー管理モーダル

- [ ] `CalendarListModal`
- [ ] `CalendarCreateModal`
- [ ] `CalendarSettingsModal`

**推定作業量**: 大

---

## Phase 7: フロントエンド - 共有UI

### 7.1 メンバー管理UI

- [ ] `MemberListModal`
- [ ] `InviteMemberModal`（メールアドレス入力）
- [ ] `InviteLinkModal`（リンク生成・管理）
- [ ] メンバー権限変更UI
- [ ] メンバー削除確認UI

### 7.2 招待受諾フロー

- [ ] `/invite/:token`ルート追加
- [ ] `InvitationAcceptPage`
  - [ ] 未ログイン時: ログイン誘導 → 招待受諾
  - [ ] ログイン済み: 招待内容表示 → 受諾/拒否

### 7.3 共有状態の表示

- [ ] カレンダー一覧に共有アイコン表示
- [ ] メンバー数バッジ
- [ ] 「共有されたカレンダー」セクション

**推定作業量**: 大

---

## Phase 8: フロントエンド - 既存画面更新

### 8.1 スケジュール作成・編集

- [ ] カレンダー選択ドロップダウン追加
- [ ] デフォルトカレンダー自動選択
- [ ] 権限に応じたUI制御（閲覧者は編集不可）

### 8.2 カレンダー表示

- [ ] 複数カレンダーの色分け表示
- [ ] カレンダー別フィルタ適用
- [ ] スケジュールにカレンダー名/色表示

### 8.3 カテゴリ管理

- [ ] カレンダー別カテゴリ表示
- [ ] カテゴリ作成時のカレンダー選択

**推定作業量**: 中

---

## Phase 9: テスト・品質保証

### 9.1 ユニットテスト

- [ ] 権限チェックロジックのテスト
- [ ] ユースケースのテスト
- [ ] リポジトリのテスト

### 9.2 E2Eテスト

- [ ] カレンダー作成〜スケジュール追加フロー
- [ ] メンバー招待〜受諾フロー
- [ ] 権限に応じた操作制限テスト

### 9.3 手動テスト

- [ ] 複数ユーザーでの同時操作確認
- [ ] 招待リンクの有効期限・回数制限テスト
- [ ] エッジケースの確認

**推定作業量**: 中

---

## Phase 10: ドキュメント・リリース

### 10.1 ドキュメント

- [ ] API仕様書の更新
- [ ] ユーザーガイドの作成
- [ ] 開発者向けドキュメント更新

### 10.2 マイグレーション実行

- [ ] 本番環境でのマイグレーション計画
- [ ] ロールバック手順の準備
- [ ] 段階的リリース計画

### 10.3 モニタリング

- [ ] エラー監視設定
- [ ] パフォーマンス監視設定

**推定作業量**: 小〜中

---

## 優先度別サマリー

### P0: 必須（MVP）

1. Phase 1: データベース基盤
2. Phase 2: カレンダー管理API
3. Phase 5: 既存API更新
4. Phase 6: カレンダー管理UI

### P1: 重要

5. Phase 3: メンバー管理API
6. Phase 7: 共有UI
7. Phase 8: 既存画面更新

### P2: あると良い

8. Phase 4: 招待機能
9. Phase 9: テスト・品質保証
10. Phase 10: ドキュメント・リリース

---

## 依存関係

```
Phase 1 (DB)
    ↓
Phase 2 (カレンダーAPI) ←→ Phase 5 (既存API更新)
    ↓
Phase 3 (メンバーAPI)
    ↓
Phase 4 (招待API)

Phase 6 (カレンダーUI) ← Phase 2, 5
    ↓
Phase 7 (共有UI) ← Phase 3, 4
    ↓
Phase 8 (既存画面更新)
    ↓
Phase 9 (テスト) ← すべて
    ↓
Phase 10 (リリース)
```

---

## 更新履歴

- 2026-01-08: 初版作成
- 2026-01-08: 第3回レビュー結果を反映
  - 公開カレンダー関連タスクを削除（4.3, 7.3, E2Eテスト）
  - オーナー移譲API（TransferOwnershipUseCase, PUT /calendars/:id/transfer）を追加
  - 招待リンクAPIの認証要件を明記
