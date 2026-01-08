# Code Review Results - Phase 1 agentTypes Implementation

レビュー日: 2026-01-09
レビュー対象: agentTypes保存機能（Phase 1実装）

## Critical

なし

## High

なし

## Medium

### 1. [両者が指摘] agentTypeSchemaの二重定義
**ファイル**: `packages/frontend/src/lib/api.ts` (行113-114)

```typescript
const agentTypeSchema = z.enum(["search", "plan", "area-info"]);
export type AgentType = z.infer<typeof agentTypeSchema>;
```

**問題**: `@ai-scheduler/shared`に同じ定義があるにも関わらず、frontendで独自に定義している。
新しいagent typeを追加した際に同期漏れのリスクがある。

**対応**: sharedからインポートするよう修正 → **修正する**

### 2. [両者が指摘] 空配列のフォールバック問題
**ファイル**:
- `packages/backend/src/feature/ai/route.ts` (行203, 263)
- `packages/backend/src/feature/ai/usecase/searchWithKeywords.ts` (行37)

```typescript
agentTypes ?? ["search"]
```

**問題**: `??`演算子は`null`/`undefined`のみフォールバックし、空配列`[]`には適用されない。
frontendのuseAI.tsで初期値が`[]`のため、エッジケースで空配列が送信される可能性がある。

**対応**: `agentTypes?.length ? agentTypes : ["search"]`パターンに修正 → **修正する**

## Low

### 3. [サブエージェントのみ] nullable/optionalの混在
**ファイル**: `packages/shared/src/schemas/supplement.ts`

**検証結果**:
- `saveSupplementInputSchema`の`optional()`は「入力時に省略可能」の意味
- `supplementSchema`の`nullable()`は「DBから取得時にnullの可能性」の意味
- これは意図的な設計であり、問題なし → **対応不要**

### 4. [サブエージェントのみ] parseAgentTypesが無効データを黙って削除
**検証結果**:
- 部分的に無効なデータがあった場合、有効なもののみ残すのは合理的
- パース失敗時にはlogger.warnでログ出力している
- DBの不整合データに対する防御的処理 → **対応不要**

### 5. [サブエージェントのみ] toRowでJSON.stringifyのエラーハンドリングなし
**検証結果**:
- agentTypesは単純な文字列配列であり、JSON.stringifyが失敗することは実質ない
- ShopオブジェクトとはHリスクが異なる → **対応不要**

### 6. [サブエージェントのみ] 関数シグネチャが冗長
**検証結果**:
- リファクタリングの提案として妥当だが、Phase 1の範囲外
- Phase 2以降で検討 → **今回は対応不要**

### 7. [Codexのみ] 無効なagent typesのサイレント削除
**検証結果**:
- parseAgentTypes関数でlogger.warnを出力している
- 機密情報ではないのでログに含めても問題なし → **対応不要**

## 修正対象サマリー

| ID | 優先度 | 内容 | 対応 |
|----|--------|------|------|
| 1 | Medium | agentTypeSchemaの二重定義 | 修正する |
| 2 | Medium | 空配列のフォールバック | 修正する |
| 3-7 | Low | 各種指摘 | 対応不要 |
