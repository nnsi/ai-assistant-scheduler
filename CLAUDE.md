# AI Assistant Scheduler

pnpm monorepo project with backend (Hono/Cloudflare Workers) and frontend (React/Vite).

## 基本姿勢

- ユーザーの質問には中立・客観の立場を守って回答すること。ユーザーに迎合しない。

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

## Skills

開発時は対応するSKILLを参照する：

- `/frontend-dev` - フロントエンド開発ガイド（core/frontendパッケージ構造、React Tips、テスト）
- `/backend-dev` - バックエンドAPI開発ガイド（アーキテクチャ、新規/既存API開発、テスト、デバッグ）
- `/browser-test` - ブラウザで動作確認（Playwrightでページ表示・操作をテスト）

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

## 機能確認は「機能する」まで

UIが「表示される」だけで完了とせず、「機能する」まで確認する。

```typescript
// NG: フォームにフィールドが表示されることだけ確認
// OK: フォーム入力 → 保存 → 詳細画面で保存されていることを確認
```

特にフォーム入力→保存→表示という一連のフローを持つ機能は、エンドツーエンドで確認する。

## 推測で話さない

存在しない機能を「〜だと思う」で話さない。確認してから話す。

```bash
# 「Googleカレンダー同期がある」と推測する前に
grep -r "google" packages/ --include="*.ts"
grep -r "sync" packages/ --include="*.ts"
```

過去の別プロジェクトの記憶や一般的なアプリの知識が混ざって、存在しない機能を想像してしまうことがある。
