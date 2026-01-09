# RELUMO

AIアシスタント付きスケジューラーアプリ。予定の作成時にAIがキーワード提案や関連情報の検索をサポートします。

## 主な機能

### スケジュール管理
- カレンダー表示（日/週ビュー切り替え）
- スケジュールのCRUD操作
- 繰り返しスケジュール（日/週/月/年単位）
- カテゴリによる分類・色分け

### AIアシスタント
- スケジュールに関連するキーワードを自動提案
- キーワードに基づく情報検索（お店の候補など）
- 検索結果から候補を選択・保存

### カレンダー共有
- 招待リンクによるカレンダー共有
- メンバー管理（追加/削除/役割変更）
- 役割ベースのアクセス制御（viewer/editor/admin）

### 認証
- Google OAuthによるログイン
- JWTベースのセッション管理

## 技術スタック

### Frontend
- **React 19** - UI構築
- **Vite** - ビルドツール
- **TailwindCSS** - スタイリング
- **TanStack Query** - サーバー状態管理
- **Hono RPC Client** - 型安全なAPIクライアント
- **Storybook** - UIコンポーネント開発
- **Playwright** - E2Eテスト

### Backend
- **Hono** - Webフレームワーク
- **Cloudflare Workers** - エッジランタイム
- **Cloudflare D1** - SQLiteデータベース
- **Drizzle ORM** - データベースアクセス
- **Mastra** - AIエージェントフレームワーク

### Shared
- **Zod** - スキーマバリデーション
- **TypeScript** - 型安全性

## 開発環境のセットアップ

### 必要なもの

- Node.js 20以上
- pnpm 9以上

### 手順

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/nnsi/ai-assistant-scheduler.git
   cd ai-assistant-scheduler
   ```

2. **依存関係をインストール**
   ```bash
   pnpm install
   ```

3. **環境変数を設定**

   `packages/backend/.dev.vars` を作成:
   ```
   JWT_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

   ローカル開発で認証をスキップする場合:
   ```
   ENABLE_DEV_AUTH=true
   ```

4. **データベースをマイグレーション**
   ```bash
   pnpm db:migrate
   ```

5. **開発サーバーを起動**
   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:8787

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動（frontend + backend） |
| `pnpm build` | ビルド |
| `pnpm test` | 全テスト実行 |
| `pnpm --filter backend test` | backendのテストのみ |
| `pnpm --filter frontend test` | frontendのテストのみ |
| `pnpm typecheck` | 型チェック |
| `pnpm db:migrate` | DBマイグレーション（ローカル） |
| `pnpm db:generate` | マイグレーションファイル生成 |

### Frontend固有

| コマンド | 説明 |
|---------|------|
| `pnpm --filter frontend storybook` | Storybook起動 |
| `pnpm --filter frontend test:e2e` | E2Eテスト実行 |
| `pnpm --filter frontend test:e2e:ui` | E2Eテスト（UIモード） |

## プロジェクト構成

```
ai-assistant-scheduler/
├── packages/
│   ├── backend/         # Hono + Cloudflare Workers API
│   │   ├── src/
│   │   │   ├── domain/  # ドメインモデル・リポジトリインターフェース
│   │   │   ├── feature/ # 機能別ルート・ユースケース
│   │   │   └── infra/   # 実装（DB, 認証など）
│   │   └── drizzle/     # マイグレーションファイル
│   ├── frontend/        # React + Vite SPA
│   │   ├── src/
│   │   │   ├── components/  # UIコンポーネント
│   │   │   ├── contexts/    # React Context
│   │   │   └── hooks/       # カスタムフック
│   │   └── e2e/         # Playwrightテスト
│   └── shared/          # 共有Zodスキーマ・型定義
└── docs/                # 設計ドキュメント
```

## 開発のヒント

### CLAUDE.mdを参照

プロジェクト固有のルールや注意点は `CLAUDE.md` にまとめられています。特に以下の点に注意:

- 日時の扱い（UTC変換を避ける）
- React 18 Strict Modeでの二重実行対策
- テストDBスキーマの同期

### モックAIの利用

開発時はデフォルトでモックAIが有効（`USE_MOCK_AI=true`）。実際のAIを使う場合は `wrangler.toml` または環境変数で `USE_MOCK_AI=false` に設定。

### ローカル認証バイパス

開発時に毎回ログインが面倒な場合は `.dev.vars` で `ENABLE_DEV_AUTH=true` を設定し、リクエストに `X-Dev-Auth: true` ヘッダーを付けます。

```bash
# スケジュール一覧を取得
curl http://localhost:8787/api/schedules \
  -H "X-Dev-Auth: true"

# スケジュールを作成
curl http://localhost:8787/api/schedules \
  -H "X-Dev-Auth: true" \
  -H "Content-Type: application/json" \
  -d '{"title": "テスト予定", "startAt": "2026-01-10T10:00:00"}'
```

テストユーザー（`dev-user-001`）として認証されます。
