# リファクタリング Phase 1 タスクリスト

基づくドキュメント: [extensible-review.md](./extensible-review.md)

---

## Phase 1: 必須（拡張性のボトルネック解消）

### フロントエンド: TanStack Router 導入

- [x] `@tanstack/react-router` のインストール
- [x] `router.tsx` の作成
- [x] App.tsx の手動パスマッチングをルーター定義に移行
  - [x] `/auth/callback` → AuthCallback
  - [x] `/auth/reconnect-callback` → ReconnectCallback
  - [x] `/invite/:token` → InvitationAcceptPage
  - [x] `/` → MainApp（認証必須）
- [x] 認証ガード（beforeLoad）の実装
- [x] main.tsx でルーターをマウント
- [x] E2Eテストの確認・修正

---

## Phase 2: 推奨（保守性向上）

### フロントエンド: App.tsx分割

- [x] モーダル状態の洗い出し（現状13個以上）
- [x] useReducer での状態管理設計
- [x] `useModalManager` フックの作成
- [x] App.tsx からモーダル状態を分離（MainApp.tsx）
- [x] 関連コンポーネントの修正

### バックエンド: グローバルエラーハンドラ

- [x] `app.onError` ハンドラの実装
- [x] エラー種別の定義（AppException クラス）
- [ ] 各ルートの try-catch を削減（段階的に対応）
- [x] Result型との連携確認
- [x] テストの確認・修正

### 共有: スキーマディレクトリ分割

- [x] `packages/shared/schemas/` ディレクトリ構造の確認
  - 現状: ドメイン別（schedule, calendar等）に既に分割済み
  - 判断: 現在の規模ではapi/domain分割は不要
- [x] 既存スキーマの分類確認 → 現状維持

---

## Phase 3: オプション（将来の拡張準備）

### useAIフックのリファクタリング

- [x] 現状の状態（11個のuseState）の整理
  - 判断: 既にストリーミング処理が`executeStream`で共通化されており、十分に整理されている
- [x] リファクタ不要と判断

### テストDBスキーマの自動同期

- [x] schema.ts と test/helpers.ts の差分確認
  - 現状: 同期済み
- [x] 判断: 手動同期で継続（CLAUDE.mdの注意事項を遵守）

### rrule.jsによる繰り返しロジック置換

- [x] rrule.js の調査・評価
- [x] 現在の `recurrence.ts` との機能比較
- [x] 判断: 現在のシンプルなロジック（約130行）で要件を満たしており、導入見送り

---

## 進捗メモ

| Phase | ステータス | 備考 |
|-------|-----------|------|
| Phase 1 | 完了 | TanStack Router導入完了 |
| Phase 2 | 完了 | useModalManager作成、グローバルエラーハンドラ追加 |
| Phase 3 | 完了 | 検討の結果、現状維持で十分と判断 |
