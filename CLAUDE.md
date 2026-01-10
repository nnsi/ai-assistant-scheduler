# AI Assistant Scheduler

pnpm monorepo project with backend (Hono/Cloudflare Workers) and frontend (React/Vite).

## 基本姿勢

- ユーザーの質問には中立・客観の立場を守って回答すること。ユーザーに迎合しない。
- 開発サーバーを自分で立ち上げないこと（ユーザーが起動する）

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

## テストDBスキーマの同期

**本番スキーマを変更したら、必ず `test/helpers.ts` の `createTestDb` も更新する。**

これは繰り返し発生する問題パターン：
1. 新しいテーブルやカラムを追加
2. 本番は動くがテストが落ちる
3. 原因は `createTestDb` にテーブル/カラムがない

変更するべきファイル：
- `packages/backend/src/infrastructure/db/schema.ts` → 本番スキーマ
- `packages/backend/test/helpers.ts` → テスト用スキーマ（同期必須）

## E2Eテストのモック同期

新しいAPIエンドポイントを追加したら：
1. E2Eテストに対応するモックを追加
2. Zodスキーマの必須フィールドがモックに全て含まれているか確認
3. `nullable`と`optional`の違いに注意（`null` vs `undefined`）

Playwrightでテストが失敗したときのデバッグ：
```typescript
// ブラウザコンソールのエラーを確認
page.on("console", msg => console.log(msg.text()));

// スクリーンショットを撮ってから操作
await page.screenshot({ path: 'debug.png' });
```

## Hono RPC Clientの制限

- 全てのルートで型推論できるわけではない
- パスパラメータを含むルートで型推論が効かない場合がある
- fallbackとして`fetchWithAuth`を直接使う

```typescript
// Hono RPCで型推論できる場合
const res = await client.schedules.$get();

// 型推論できない場合のfallback
const res = await fetchWithAuth(`/api/invitations/${token}`);
```

## Cloudflare Workers固有の制約

- `process`オブジェクトが存在しない（`globalThis`で代替）
- `better-sqlite3`はテスト用のみ。本番はD1を使用
- SSEは100秒間イベントなしで524エラー
- `vitest-pool-workers`はMastraの依存で動かない場合がある

## CI/CDの重複確認

ワークフローを変更したとき：
1. 複数のワークフローが同時にトリガーされないか確認
2. ジョブ間でビルドやテストが重複していないか確認
3. アーティファクトを使い回すか、各ジョブで再ビルドするか明確にする

```yaml
# PRのみでCI実行し、push時はdeploy.ymlに任せる
on:
  pull_request:
    branches: [master, release]
```

## 設計変更時のドキュメント同期

設計を変更したら、全ての関連ドキュメントを更新する：
- `docs/design/` 配下のファイル
- `docs/tasks.md` などのタスクリスト
- 各パッケージのREADME

片方のドキュメントだけ更新して、他を忘れがち。
