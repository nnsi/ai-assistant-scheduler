# Code Review Report

**Date**: 2025-12-31
**Reviewer**: Claude (AI)

## Executive Summary

AI Assistant Scheduler プロジェクトの全体的なコードレビューを実施しました。アーキテクチャは概ね適切に設計されていますが、いくつかのセキュリティと堅牢性に関する問題を発見し、修正を行いました。

## Project Structure

```
packages/
├── shared/      # 共有型定義・Zodスキーマ
├── backend/     # Hono + Cloudflare Workers API
└── frontend/    # React + Vite フロントエンド
```

---

## Issues Found & Fixed

### Critical

#### 1. XSS脆弱性 (MarkdownRenderer.tsx)

**問題**: `dangerouslySetInnerHTML` でAI生成コンテンツをサニタイズせずにレンダリングしていた。marked v15 ではデフォルトでHTMLがエスケープされないため、悪意のあるスクリプトが実行される可能性があった。

**ファイル**: `packages/frontend/src/components/common/MarkdownRenderer.tsx:28`

**修正前**:
```typescript
const html = useMemo(() => {
  return marked.parse(content, { async: false }) as string;
}, [content]);
```

**修正後**:
```typescript
import DOMPurify from "dompurify";

const html = useMemo(() => {
  const rawHtml = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}, [content]);
```

---

### High

#### 2. ユースケースのDBエラーハンドリング欠如

**問題**: 複数のユースケースでデータベース操作の例外をキャッチしていなかった。Result型を使用しているにもかかわらず、DBエラーが未処理の例外として投げられていた。

**影響ファイル**:
- `packages/backend/src/feature/schedule/usecase/createSchedule.ts`
- `packages/backend/src/feature/schedule/usecase/updateSchedule.ts`
- `packages/backend/src/feature/schedule/usecase/deleteSchedule.ts`
- `packages/backend/src/feature/schedule/usecase/getScheduleById.ts`
- `packages/backend/src/feature/supplement/usecase/updateMemo.ts`

**修正**: 全ユースケースに try-catch を追加し、DBエラーを Result型 で返すように修正

```typescript
try {
  // DB operations
  return ok(result);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return err(createDatabaseError(message));
}
```

#### 3. JSON.parse のエラーハンドリング欠如

**問題**: `supplementRepo.ts` で keywords の JSON パースにエラーハンドリングがなく、破損データでアプリがクラッシュする可能性があった。

**ファイル**: `packages/backend/src/infra/drizzle/supplementRepo.ts:38`

**修正前**:
```typescript
keywords: row.keywords ? JSON.parse(row.keywords) : [],
```

**修正後**:
```typescript
const safeParseJsonArray = (jsonString: string | null): string[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("Failed to parse keywords JSON:", jsonString);
    return [];
  }
};

// 使用箇所
keywords: safeParseJsonArray(row.keywords),
```

---

### Medium

#### 4. タイムゾーンのハードコード

**問題**: `ScheduleForm.tsx` でタイムゾーンが `+09:00` (日本時間) にハードコードされており、他地域のユーザーに対応できなかった。

**ファイル**: `packages/frontend/src/components/Schedule/ScheduleForm.tsx:30`

**修正前**:
```typescript
const startAt = `${date}T${time}:00+09:00`;
```

**修正後**:
```typescript
// lib/date.ts に追加
export const getTimezoneOffset = (): string => {
  const offset = new Date().getTimezoneOffset();
  const sign = offset <= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, "0");
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
};

// ScheduleForm.tsx
const startAt = `${date}T${time}:00${getTimezoneOffset()}`;
```

---

## Positive Aspects

以下の点は良い設計・実装として評価できます：

### Architecture
- **クリーンアーキテクチャ**: domain/infra/feature の分離が適切
- **依存性注入 (DI)**: Honoミドルウェアでユースケースを解決
- **Result型の活用**: エラーハンドリングに例外ではなくResult型を使用

### Type Safety
- **Zodによる入力バリデーション**: 共有スキーマでフロントエンド/バックエンド間の型安全性を確保
- **Hono RPCクライアント**: 型安全なAPIクライアント

### Code Quality
- **適切な関心の分離**: ルート → ユースケース → リポジトリ
- **一貫したエラー処理パターン**: `createXxxError` ファクトリ関数
- **明確な命名規則**: `createXxxUseCase` パターン

### Security
- **CORS設定**: 環境変数による Origin 制御
- **入力バリデーション**: Zodスキーマによる厳格なバリデーション
- **Drizzle ORM使用**: SQLインジェクション対策

---

## Remaining Considerations (Low Priority)

以下は今回修正していませんが、将来的に検討すべき点です：

1. **テストカバレッジ**: 一部のユースケースのみテストあり、カバレッジ拡大が望ましい
2. **ロギング**: 本番環境向けの構造化ログの導入
3. **レート制限**: AI APIへのリクエストレート制限
4. **キャッシュ**: AI検索結果のキャッシュ戦略

---

## Summary of Changes

| 優先度 | 問題 | ファイル | 状態 |
|--------|------|----------|------|
| Critical | XSS脆弱性 | MarkdownRenderer.tsx | **修正済** |
| High | DBエラーハンドリング | 5ユースケースファイル | **修正済** |
| High | JSON.parseエラー | supplementRepo.ts | **修正済** |
| Medium | タイムゾーンハードコード | ScheduleForm.tsx, date.ts | **修正済** |
