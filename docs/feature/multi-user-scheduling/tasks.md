# マルチユーザーカレンダー共有 タスクリスト

## 概要

カレンダー共有機能の実装タスクを段階的に整理したリスト。

---

## Phase 1: データベース基盤

### 1.1 スキーマ定義

- [x] `calendars`テーブルのDrizzleスキーマ定義
- [x] `calendar_members`テーブルのDrizzleスキーマ定義
- [x] `calendar_invitations`テーブルのDrizzleスキーマ定義
- [x] `schedules`テーブルに`calendar_id`カラム追加
- [x] `categories`テーブルに`calendar_id`カラム追加
- [x] 型エクスポートの追加

### 1.2 マイグレーション

- [x] マイグレーションファイル作成（0009_add_calendars.sql）
- [x] ローカル環境でマイグレーション実行・検証
- [x] 既存データのマイグレーションスクリプト作成
  - [x] 各ユーザーにデフォルトカレンダー作成
  - [x] 既存schedules, categoriesにcalendar_id設定
  - [x] calendar_membersにownerレコード作成

### 1.3 リポジトリ層

- [x] `CalendarRepository`の実装
  - [x] `create`
  - [x] `findById`
  - [x] `findByUserId`（アクセス可能なカレンダー一覧）
  - [x] `update`
  - [x] `delete`
- [x] `CalendarMemberRepository`の実装
  - [x] `create`
  - [x] `findByCalendarId`
  - [x] `findByUserIdAndCalendarId`
  - [x] `updateRole`
  - [x] `delete`
- [x] `CalendarInvitationRepository`の実装
  - [x] `create`
  - [x] `findByToken`
  - [x] `findByCalendarId`
  - [x] `incrementUseCount`
  - [x] `delete`
- [x] 既存リポジトリの更新
  - [x] `ScheduleRepository`に`calendar_id`対応追加
  - [x] `CategoryRepository`に`calendar_id`対応追加

**推定作業量**: 中

---

## Phase 2: バックエンドAPI - カレンダー管理

### 2.1 Zodスキーマ定義（shared）

- [x] `calendarInput`スキーマ
- [x] `calendarResponse`スキーマ
- [x] `calendarMemberInput`スキーマ
- [x] `calendarMemberResponse`スキーマ
- [x] `calendarInvitationInput`スキーマ
- [x] `calendarInvitationResponse`スキーマ

### 2.2 ユースケース実装

- [x] `CreateCalendarUseCase`
- [x] `GetCalendarsUseCase`（アクセス可能なカレンダー一覧）
- [x] `GetCalendarDetailUseCase`
- [x] `UpdateCalendarUseCase`
- [x] `DeleteCalendarUseCase`

### 2.3 APIルート実装

- [x] `GET /calendars`
- [x] `POST /calendars`
- [x] `GET /calendars/:id`
- [x] `PUT /calendars/:id`
- [x] `DELETE /calendars/:id`

### 2.4 テスト

- [x] カレンダーCRUDのユニットテスト
- [x] カレンダーAPIのE2Eテスト

**推定作業量**: 中

---

## Phase 3: バックエンドAPI - メンバー管理

### 3.1 権限チェックミドルウェア

- [x] `calendarAuthMiddleware`の実装
  - [x] カレンダーへのアクセス権確認
  - [x] ロールに基づく操作権限確認
- [x] 権限ヘルパー関数
  - [x] `canEdit(role): boolean`
  - [x] `canManageMembers(role): boolean`
  - [x] `isOwner(role): boolean`

### 3.2 ユースケース実装

- [x] `AddMemberUseCase`
- [x] `GetMembersUseCase`
- [x] `UpdateMemberRoleUseCase`
- [x] `RemoveMemberUseCase`
- [x] `LeaveCalendarUseCase`
- [x] `TransferOwnershipUseCase`

### 3.3 APIルート実装

- [x] `GET /calendars/:id/members`
- [x] `POST /calendars/:id/members`
- [x] `PUT /calendars/:id/members/:userId`
- [x] `DELETE /calendars/:id/members/:userId`
- [x] `POST /calendars/:id/leave`
- [x] `PUT /calendars/:id/transfer`（オーナー移譲）

### 3.4 テスト

- [x] メンバー管理のユニットテスト
- [x] 権限チェックのテスト
- [x] メンバーAPIのE2Eテスト

**推定作業量**: 中

---

## Phase 4: バックエンドAPI - 招待機能

### 4.1 招待リンク機能

- [x] トークン生成ユーティリティ
- [x] `CreateInvitationUseCase`
- [x] `GetInvitationsUseCase`
- [x] `AcceptInvitationUseCase`
- [x] `RevokeInvitationUseCase`

### 4.2 APIルート実装

- [x] `POST /calendars/:id/invitations`（admin以上）
- [x] `GET /calendars/:id/invitations`（admin以上）
- [x] `DELETE /calendars/:id/invitations/:id`（admin以上）
- [x] `GET /invitations/:token`（認証不要）
- [x] `POST /invitations/:token/accept`（認証必須）

### 4.3 テスト

- [x] 招待リンクのユニットテスト
- [x] 招待APIのE2Eテスト

**推定作業量**: 中〜大

---

## Phase 5: 既存API更新

### 5.1 スケジュールAPI更新

- [x] `POST /schedules`に`calendarId`パラメータ追加
- [x] `GET /schedules`にカレンダー権限チェック追加
- [x] `PUT /schedules/:id`に権限チェック追加
- [x] `DELETE /schedules/:id`に権限チェック追加
- [x] 繰り返しスケジュールAPIの権限チェック追加

### 5.2 カテゴリAPI更新

- [x] `POST /categories`に`calendarId`パラメータ追加
- [x] `GET /categories`にカレンダー別フィルタ追加
- [x] カテゴリ編集・削除の権限チェック追加

### 5.3 後方互換性

- [x] `calendarId`省略時はデフォルトカレンダーを使用
- [x] 既存テストの更新

### 5.4 テスト更新

- [x] 既存スケジュールテストの更新
- [x] 権限チェックを含む新規テスト追加

**推定作業量**: 中

---

## Phase 6: フロントエンド - カレンダー管理UI

### 6.1 API クライアント更新

- [x] カレンダー関連APIの追加
  - [x] `fetchCalendars`
  - [x] `createCalendar`
  - [x] `updateCalendar`
  - [x] `deleteCalendar`
- [x] メンバー関連APIの追加
- [x] 招待関連APIの追加

### 6.2 状態管理

- [x] `CalendarContext`の実装
- [x] カレンダー選択状態の永続化（localStorage）
- [x] React Queryキーの更新

### 6.3 カレンダー選択UI

- [x] `CalendarSelector`コンポーネント
- [x] `CalendarColorDot`コンポーネント
- [x] サイドバーへの統合

### 6.4 カレンダー管理モーダル

- [x] `CalendarListModal`
- [x] `CalendarCreateModal`
- [x] `CalendarSettingsModal`

**推定作業量**: 大

---

## Phase 7: フロントエンド - 共有UI

### 7.1 メンバー管理UI

- [x] `MemberListModal`
- [x] `InviteMemberModal`（メールアドレス入力）
- [x] `InviteLinkModal`（リンク生成・管理）
- [x] メンバー権限変更UI
- [x] メンバー削除確認UI

### 7.2 招待受諾フロー

- [x] `/invite/:token`ルート追加
- [x] `InvitationAcceptPage`
  - [x] 未ログイン時: ログイン誘導 → 招待受諾
  - [x] ログイン済み: 招待内容表示 → 受諾/拒否

### 7.3 共有状態の表示

- [x] カレンダー一覧に共有アイコン表示
- [x] メンバー数バッジ
- [x] 「共有されたカレンダー」セクション

**推定作業量**: 大

---

## Phase 8: フロントエンド - 既存画面更新

### 8.1 スケジュール作成・編集

- [x] カレンダー選択ドロップダウン追加
- [x] デフォルトカレンダー自動選択
- [x] 権限に応じたUI制御（閲覧者は編集不可）

### 8.2 カレンダー表示

- [x] 複数カレンダーの色分け表示
- [x] カレンダー別フィルタ適用
- [x] スケジュールにカレンダー名/色表示

### 8.3 カテゴリ管理

- [x] カレンダー別カテゴリ表示
- [x] カテゴリ作成時のカレンダー選択

**推定作業量**: 中

---

## Phase 9: テスト・品質保証

### 9.1 ユニットテスト

- [x] 権限チェックロジックのテスト
- [x] ユースケースのテスト
- [x] リポジトリのテスト

### 9.2 E2Eテスト

- [x] カレンダー作成〜スケジュール追加フロー
- [x] メンバー招待〜受諾フロー
- [x] 権限に応じた操作制限テスト

### 9.3 手動テスト

- [x] 複数ユーザーでの同時操作確認
- [x] 招待リンクの有効期限・回数制限テスト
- [x] エッジケースの確認

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
- 2026-01-08: Phase 1〜9 実装完了
