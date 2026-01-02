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

## 日時の扱い

- `toISOString()`はUTC変換されるため、ローカル日付が必要な場面では使わない
- 日付文字列が必要な場合は`date-fns`の`format(date, "yyyy-MM-dd")`を使う
- Zodの`datetime()`はデフォルトでUTCのみ。JSTを受け付けるなら`{ offset: true }`が必要

## 型安全性

- `as`による型アサーションは使わない
- APIレスポンスはZodスキーマで`safeParse`してから使う
- sharedパッケージにスキーマがあるならそれを再利用する

## 認証機能を追加するとき

- CORSの`allowHeaders`に`Authorization`を追加したか確認
- 既存のリソース系テーブルに`user_id`が必要か検討
- 既存テストへの影響範囲を`grep`で事前調査
