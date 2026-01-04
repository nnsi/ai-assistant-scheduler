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

## React 18 Strict Mode

- `useEffect`内で直接API通信を行わない（二重実行される）
- データフェッチングには`TanStack Query`（React Query）を使う
- 一度きりの処理（OAuth認証コールバック等）は`useRef`で二重実行を防止

```typescript
// 悪い例
useEffect(() => {
  fetch('/api/data').then(...)
}, []);

// 良い例（React Query）
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });

// 良い例（一度きりの処理）
const isProcessingRef = useRef(false);
useEffect(() => {
  if (isProcessingRef.current) return;
  isProcessingRef.current = true;
  // 処理...
}, []);
```

## サブエージェント・Codexの結果

- 結果を鵜呑みにしない。AIレビュアーは時々間違える
- 「すでに実装済み」の機能を見落としていることがある
- 「ファイルがGitに混入」など致命的な指摘は `git ls-files` で必ず検証
- 両者が同じ問題を指摘していれば信頼性が高い
- 片方だけが指摘している問題は特に慎重に検討する

## AIプロンプトの改善

- 「〜するな」の禁止形より「〜する」の目的志向で書く
- 問題が出たら「このルールを足そう」ではなく「何を達成したいか」から考え直す
- 曖昧なケースの処理方針を決める（例：「不明なら除外」）
- 出力フォーマットを目的に合わせて設計する
