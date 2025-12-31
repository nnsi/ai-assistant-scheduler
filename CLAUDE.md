# AI Assistant Scheduler

pnpm monorepo project with backend (Hono/Cloudflare Workers) and frontend (React/Vite).

## Claude Code on the Web

SessionStartフックが非同期モードで実行されます。セッション開始後、テストやリンターが実行可能になるまで**約2分**かかります。

依存関係のインストールが完了するまで以下のコマンドは失敗する可能性があります：
- `pnpm test` - APIテスト
- `pnpm typecheck` - TypeScript型チェック
- `pnpm build` - ビルド

インストール状況は `ps aux | grep pnpm` で確認できます。

## Commands

- `pnpm dev` - Start dev servers (frontend + backend)
- `pnpm test` - Run all tests
- `pnpm --filter backend test` - Run backend API tests only
- `pnpm typecheck` - Type check (backend)
- `pnpm db:migrate` - Run D1 database migrations (local)
