# React Native モバイルアプリ化 タスクリスト

## 概要

Webアプリケーションの React Native 化を段階的に進めるタスクリスト。
ビジネスロジックの共通化（coreパッケージ）を優先し、Web/モバイル両対応を実現する。

**推定総工数**: 1.5〜2ヶ月

---

## Phase 0: 準備・環境構築

### 0.1 開発環境セットアップ

- [ ] Expo プロジェクト初期化（`packages/mobile`）
- [ ] pnpm workspace 設定更新
- [ ] TypeScript 設定（パス解決、共有パッケージ参照）
- [ ] ESLint/Prettier 設定（RN対応）
- [ ] NativeWind セットアップ
- [ ] Tailwind config 移植（カラー定義等）

### 0.2 CI/CD 準備

- [ ] EAS プロジェクト作成
- [ ] eas.json 設定（development/preview/production）
- [ ] GitHub Actions ワークフロー追加（ビルド・テスト）
- [ ] Expo Secrets 設定（API keys等）

### 0.3 アプリ基本設定

- [ ] app.json / app.config.ts 設定
- [ ] アプリアイコン作成
- [ ] スプラッシュスクリーン設定
- [ ] Deep Linking scheme 設定

**推定作業量**: 小（3-5日）

---

## Phase 1: core パッケージ切り出し

### 1.1 パッケージ構造作成

- [ ] `packages/core` ディレクトリ作成
- [ ] package.json 設定（dependencies, exports）
- [ ] tsconfig.json 設定

### 1.2 Storage 抽象化

- [ ] Storage インターフェース定義
- [ ] Web 用 localStorage 実装（`packages/web/storage.ts`）
- [ ] RN 用 AsyncStorage 実装（`packages/mobile/storage.ts`）
- [ ] 既存 Context の Storage 依存性注入対応

### 1.3 API クライアント移行

- [ ] `lib/api.ts` → `core/api/` へ移動
- [ ] fetchWithAuth の共通化
- [ ] Cookie依存の除去（RN対応）
- [ ] エラーハンドリング共通化

### 1.4 カスタムフック移行

- [ ] `useSchedules` → core へ移動
- [ ] `useCalendars` → core へ移動
- [ ] `useCategories` → core へ移動
- [ ] `useAuth` → core へ移動
- [ ] `useAI` → core へ移動
- [ ] その他フック精査・移動

### 1.5 Context 移行

- [ ] `AuthContext` → core へ移動（Storage抽象化）
- [ ] `CalendarContext` → core へ移動（Storage抽象化）
- [ ] Provider構成の整理

### 1.6 ユーティリティ移行

- [ ] `lib/date.ts` → core へ移動
- [ ] `lib/utils.ts`（cn関数等）→ core へ移動
- [ ] その他共通ユーティリティ精査

### 1.7 Web側の参照更新

- [ ] import パス更新（frontend → web リネーム検討）
- [ ] 動作確認・既存テスト通過確認

**推定作業量**: 中（1-2週間）

---

## Phase 2: 認証機能

### 2.1 OAuth 実装

- [ ] expo-auth-session セットアップ
- [ ] Google OAuth 設定（iOS/Android Client ID）
- [ ] Google 認証フロー実装
- [ ] バックエンドとの認証連携

### 2.2 トークン管理

- [ ] アクセストークン管理（SecureStore検討）
- [ ] リフレッシュトークン管理
- [ ] 自動トークンリフレッシュ実装
- [ ] ログアウト処理

### 2.3 認証状態管理

- [ ] 認証状態の永続化（AsyncStorage）
- [ ] アプリ起動時の認証復帰
- [ ] 認証エラーハンドリング

### 2.4 Deep Linking（認証関連）

- [ ] OAuth callback URL スキーム設定
- [ ] Universal Links / App Links 設定（将来）

**推定作業量**: 中（1週間）

---

## Phase 3: ナビゲーション・基本UI

### 3.1 React Navigation セットアップ

- [ ] @react-navigation 依存関係追加
- [ ] RootNavigator 実装
- [ ] AuthStack 実装（Login, OAuthCallback）
- [ ] MainTabs 実装（Calendar, Search, Settings）
- [ ] 型定義（ParamList）

### 3.2 共通UIコンポーネント

- [ ] Button コンポーネント
- [ ] Input コンポーネント
- [ ] Modal コンポーネント
- [ ] LoadingSpinner コンポーネント
- [ ] ErrorMessage コンポーネント
- [ ] Toast/Notification コンポーネント

### 3.3 レイアウトコンポーネント

- [ ] SafeAreaView ラッパー
- [ ] Header コンポーネント
- [ ] TabBar カスタマイズ
- [ ] スクロールビュー共通化

### 3.4 アイコン対応

- [ ] lucide-react-native または代替ライブラリ選定
- [ ] アイコンコンポーネント作成
- [ ] 既存アイコン使用箇所のマッピング

**推定作業量**: 中（1週間）

---

## Phase 4: カレンダー機能

### 4.1 カレンダービュー

- [ ] MonthView コンポーネント（月表示）
- [ ] WeekView コンポーネント（週表示）
- [ ] DayView コンポーネント（日表示）
- [ ] ビュー切り替えUI
- [ ] 日付ナビゲーション（前月/次月等）

### 4.2 スケジュール表示

- [ ] スケジュールカード コンポーネント
- [ ] カレンダー色分け表示
- [ ] 繰り返しスケジュールアイコン
- [ ] 終日イベント表示

### 4.3 スケジュール詳細

- [ ] ScheduleDetailScreen
- [ ] 編集ボタン（権限に応じて表示）
- [ ] 削除確認ダイアログ

### 4.4 スケジュール作成・編集

- [ ] ScheduleEditScreen
- [ ] 日時ピッカー（DateTimePicker）
- [ ] カレンダー選択
- [ ] カテゴリ選択
- [ ] 繰り返し設定UI
- [ ] バリデーション

### 4.5 カレンダー管理

- [ ] カレンダー一覧表示
- [ ] カレンダー作成モーダル
- [ ] カレンダー設定画面
- [ ] カレンダー選択（表示/非表示）

**推定作業量**: 大（2-3週間）

---

## Phase 5: 共有・メンバー管理

### 5.1 メンバー管理UI

- [ ] MemberManagementScreen
- [ ] メンバー一覧表示
- [ ] 権限バッジ表示
- [ ] 権限変更UI
- [ ] メンバー削除

### 5.2 招待機能

- [ ] 招待リンク生成UI
- [ ] 招待リンク共有（Share API）
- [ ] 招待リンク一覧
- [ ] 招待リンク無効化

### 5.3 招待受諾フロー

- [ ] Deep Link 受信処理（/invite/:token）
- [ ] InviteAcceptScreen
- [ ] 未ログイン時の処理
- [ ] 招待受諾・拒否処理

**推定作業量**: 中（1週間）

---

## Phase 6: AI機能

### 6.1 AI検索

- [ ] SearchScreen UI
- [ ] 検索入力フォーム
- [ ] SSE ストリーミング対応（polyfill検討）
- [ ] 検索結果表示
- [ ] Markdown レンダリング（react-native-markdown）

### 6.2 キーワード提案

- [ ] キーワード提案UI
- [ ] ストリーミング表示
- [ ] 提案からの検索連携

### 6.3 エラーハンドリング

- [ ] ネットワークエラー表示
- [ ] タイムアウト処理
- [ ] リトライUI

**推定作業量**: 中（1週間）

---

## Phase 7: 設定・その他

### 7.1 設定画面

- [ ] SettingsScreen
- [ ] プロファイル表示
- [ ] ログアウトボタン
- [ ] アプリバージョン表示

### 7.2 プッシュ通知

- [ ] expo-notifications セットアップ
- [ ] 通知権限リクエスト
- [ ] デバイストークン登録API
- [ ] バックエンド：デバイストークン保存
- [ ] バックエンド：通知送信処理（将来）

### 7.3 OTA アップデート

- [ ] expo-updates セットアップ
- [ ] 起動時の更新チェック実装
- [ ] 更新通知UI（オプション）

### 7.4 オフライン対応（将来）

- [ ] オフライン状態検知
- [ ] キャッシュ戦略検討
- [ ] オフラインUI表示

**推定作業量**: 中（1週間）

---

## Phase 8: テスト・品質保証

### 8.1 ユニットテスト

- [ ] core パッケージのテスト移行
- [ ] hooks テスト
- [ ] utils テスト

### 8.2 コンポーネントテスト

- [ ] React Native Testing Library セットアップ
- [ ] 主要コンポーネントのテスト
- [ ] ナビゲーションテスト

### 8.3 E2Eテスト

- [ ] Detox または Maestro セットアップ
- [ ] 認証フローテスト
- [ ] スケジュール作成フローテスト
- [ ] 招待フローテスト

### 8.4 手動テスト

- [ ] iOS実機テスト
- [ ] Android実機テスト
- [ ] 各種デバイスサイズ確認
- [ ] ダークモード確認（将来）

**推定作業量**: 中（1週間）

---

## Phase 9: リリース準備

### 9.1 App Store準備

- [ ] Apple Developer Program 登録確認
- [ ] App Store Connect アプリ作成
- [ ] スクリーンショット作成
- [ ] アプリ説明文作成
- [ ] プライバシーポリシー準備

### 9.2 Google Play準備

- [ ] Google Play Console アプリ作成
- [ ] スクリーンショット作成
- [ ] アプリ説明文作成
- [ ] コンテンツレーティング設定

### 9.3 ビルド・提出

- [ ] Production ビルド作成（iOS）
- [ ] Production ビルド作成（Android）
- [ ] TestFlight 配布
- [ ] 内部テストトラック配布
- [ ] 審査提出

**推定作業量**: 小〜中（3-5日）

---

## 優先度別サマリー

### P0: 必須（MVP）

1. Phase 0: 準備・環境構築
2. Phase 1: core パッケージ切り出し
3. Phase 2: 認証機能
4. Phase 3: ナビゲーション・基本UI
5. Phase 4: カレンダー機能

### P1: 重要

6. Phase 5: 共有・メンバー管理
7. Phase 7.1-7.2: 設定・プッシュ通知
8. Phase 8: テスト

### P2: あると良い

9. Phase 6: AI機能
10. Phase 7.3: OTA アップデート
11. Phase 9: リリース準備

---

## 依存関係

```
Phase 0 (準備)
    ↓
Phase 1 (core切り出し)
    ↓
Phase 2 (認証) ──→ Phase 3 (ナビゲーション)
                        ↓
                  Phase 4 (カレンダー)
                        ↓
              ┌─────────┼─────────┐
              ↓         ↓         ↓
         Phase 5    Phase 6    Phase 7
         (共有)     (AI)       (設定)
              └─────────┼─────────┘
                        ↓
                  Phase 8 (テスト)
                        ↓
                  Phase 9 (リリース)
```

---

## マイルストーン

| マイルストーン | Phase | 目標 |
|---------------|-------|------|
| **M1: 基盤完成** | 0-1 | core パッケージ動作、Web影響なし |
| **M2: 認証・ナビ** | 2-3 | ログイン〜メイン画面遷移 |
| **M3: MVP** | 4 | カレンダー表示・スケジュールCRUD |
| **M4: フル機能** | 5-7 | 共有、AI、通知 |
| **M5: リリース** | 8-9 | ストア公開 |

---

## 更新履歴

- 2026-01-11: 初版作成
