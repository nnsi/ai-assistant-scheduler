# Frontend Code Review by Codex

**Date**: 2026-01-18
**Reviewer**: Codex
**Target**: `packages/frontend`

## Findings

### [Medium] 二重のアプリ入口とルーティングが混在

**Location**: `packages/frontend/src/App.tsx`

`packages/frontend/src/App.tsx` が独自に `MainApp` と `window.location` ルーティングを持つ一方、実際の入口は `packages/frontend/src/main.tsx` + `packages/frontend/src/router.tsx` + `packages/frontend/src/components/MainApp.tsx`。

**問題**: 片方が未使用なら削除、使用するなら単一経路に統一しないと挙動/保守が乖離します。

---

### [Medium] 予定更新/削除の失敗がユーザーに伝わらない

**Location**: `packages/frontend/src/components/MainApp.tsx`

`handleScheduleSave`/`handleScheduleDelete` は `await` のみでエラーハンドリングなし。

**問題**: API失敗時に通知もUIも変わらず、状態不整合になり得る。

**推奨**: `try/catch` + 通知/リカバリが必要です。

---

### [Medium] モーダルのフォーカス管理が不足

**Location**: `packages/frontend/src/components/common/Modal.tsx`

ESC とスクロールロックのみで、フォーカストラップ/初期フォーカス/フォーカス復帰がありません。

**問題**: キーボード操作やスクリーンリーダー利用時の操作性が低下します。

---

### [Low] アイコンのみボタンに accessible name がない

**Location**:
- `packages/frontend/src/components/common/Modal.tsx` の閉じるボタン
- `packages/frontend/src/components/MainApp.tsx` の通知クローズボタン

**推奨**: `aria-label` を追加してください。

---

### [Low] `localStorage` 操作に例外対策なし

**Location**: `packages/frontend/src/storage.ts`

プライベートモード等で `setItem` が例外になるケースを未考慮。

**推奨**: `try/catch` でフォールバック（メモリストレージ）を用意すると堅牢です。

---

### [Low] フォーム初期値がプロップ変更に追随しない

**Location**:
- `packages/frontend/src/components/Schedule/ScheduleForm.tsx`
- `packages/frontend/src/components/Auth/ProfileSettingsModal.tsx`

初期値から `useState` を一度だけ生成。編集対象や `user` が変わっても反映されない。

**推奨**: `useEffect` 同期か `key` 付け替えが必要です。

---

### [Low] URLパラメータの `decodeURIComponent` が例外になり得る

**Location**: `packages/frontend/src/components/MainApp.tsx`

通知生成で不正なエンコードの場合にクラッシュする可能性があります。

**推奨**: `try/catch` を入れるのが安全です。

---

## Open Questions / Assumptions

1. `packages/frontend/src/App.tsx` は実運用で使われていない前提で指摘しました。もし使用中ならルーティング統合の方針確認が必要です。

2. 予定の更新/削除失敗時にどのレベルの通知（toast, modal, inline）が望ましいか、UX方針を確認したいです。

---

## Summary

| Severity | Count |
|----------|-------|
| Medium   | 3     |
| Low      | 4     |

主な改善ポイント：
- ルーティング構造の整理
- エラーハンドリングの追加
- アクセシビリティの改善（フォーカス管理、aria-label）
- 例外処理の堅牢化

---

## 再レビュー結果（2026-01-18）

### レビュアー
- **security-reviewer** (サブエージェント)
- **Explore agent** (コードベース探索)

### 検証結果サマリ

| # | 指摘 | Codexの評価 | 検証結果 | 判定 |
|---|------|-------------|----------|------|
| 1 | 二重のアプリ入口とルーティングが混在 | Medium | **Low** | ⚠️ 部分的に正確 |
| 2 | 予定更新/削除の失敗がユーザーに伝わらない | Medium | Medium | ✅ 正確 |
| 3 | モーダルのフォーカス管理が不足 | Medium | Medium | ✅ 正確 |
| 4 | アイコンのみボタンにaccessible nameがない | Low | Low | ✅ 正確 |
| 5 | localStorage操作に例外対策なし | Low | Low | ✅ 正確 |
| 6 | フォーム初期値がプロップ変更に追随しない | Low | Low | ⚠️ 部分的に正確 |
| 7 | URLパラメータのdecodeURIComponentが例外になり得る | Low | Low | ✅ 正確 |

### 各指摘の詳細検証

#### 1. 二重のアプリ入口とルーティングが混在 → ⚠️ 部分的に正確

**検証結果:**
- `App.tsx` は **どこからもインポートされていない（完全に未使用）**
- `index.html` → `main.tsx` → `router.tsx` → `MainApp.tsx` が実際の入口
- 「混在」ではなく「**未使用ファイルの残存**」が正確な表現

**重要度修正:** Medium → **Low**（動作に影響しないが、開発者の混乱を招く）

**対応:** `App.tsx` は削除推奨

---

#### 2. 予定更新/削除の失敗がユーザーに伝わらない → ✅ 正確

**検証結果:**
```typescript
// MainApp.tsx:134-141
const handleScheduleSave = async (id: string, input: UpdateScheduleInput): Promise<void> => {
  await update(id, input);  // try-catch なし
  refetch();
};
const handleScheduleDelete = async (id: string): Promise<void> => {
  await remove(id);  // try-catch なし
};
```
- `SchedulePopup.tsx` では削除時にログ出力があるが、ユーザーへの通知はない

**追加発見:** `refetch()` は `useSchedules.update` の `onSuccess` でキャッシュ更新済みのため冗長

---

#### 3. モーダルのフォーカス管理が不足 → ✅ 正確

**検証結果:**
- ESCキーとスクロールロック: ✅ 実装済み
- フォーカストラップ: ❌ なし
- 初期フォーカス: ❌ なし
- フォーカス復帰: ❌ なし
- `aria-modal="true"`: ✅ 実装済み

---

#### 4. アイコンのみボタンにaccessible nameがない → ✅ 正確

**検証結果:**
- `Modal.tsx` 閉じるボタン: `aria-label` なし
- `MainApp.tsx` 通知クローズボタン: `aria-label` なし

**追加発見:** `CalendarHeader.tsx` のビューモード切り替えボタンも `title` のみで `aria-label` がない

---

#### 5. localStorage操作に例外対策なし → ✅ 正確

**検証結果:**
- `storage.ts` の全操作に try-catch なし
- プライベートブラウジングや容量超過時に例外発生の可能性

---

#### 6. フォーム初期値がプロップ変更に追随しない → ⚠️ 部分的に正確

**検証結果:**
- `ScheduleForm.tsx`: props変更時の同期なし
  - **ただし:** `ScheduleEditModal` で `key={schedule.id}` を使用して再マウント対応済み
- `ProfileSettingsModal.tsx`: `user?.email` から初期化、**useEffect同期なし（問題あり）**

**結論:** `ScheduleForm` は実用上問題なし、`ProfileSettingsModal` は修正必要

---

#### 7. URLパラメータのdecodeURIComponentが例外になり得る → ✅ 正確

**検証結果:**
- `MainApp.tsx:44, 47`: try-catch なし
- 不正なパーセントエンコーディング（例: `%ZZ`）で `URIError` がスローされる

**追加発見:** `App.tsx` (未使用)、`LoginPage.tsx` にも同様の問題

---

### 追加で発見された問題

| 重要度 | 問題 | 場所 |
|--------|------|------|
| Low | `handleScheduleSave` 成功後の `refetch()` が冗長 | `MainApp.tsx:135-136` |
| Low | `ScheduleEditModal` の `onSave` にtry-catchなし | `ScheduleEditModal.tsx:43-86` |
| Low | `CalendarHeader` ビューモード切り替えボタンに `aria-label` なし | `CalendarHeader.tsx:114-128` |
| Info | `Modal` の `aria-labelledby` が title なしの場合不安定 | `Modal.tsx:55` |

---

### 修正実施状況

| 指摘 | 修正 | 状況 |
|------|------|------|
| App.tsx の削除 | 未使用ファイルを削除 | ✅ 完了 |
| エラーハンドリング追加 | try-catch + 通知表示 | ✅ 完了 |
| aria-label 追加 | Modal, MainApp のボタンに追加 | ✅ 完了 |
| localStorage 例外対策 | try-catch + メモリフォールバック | ✅ 完了 |
| ProfileSettingsModal 初期値同期 | useEffect で user 変更時に同期 | ✅ 完了 |
| decodeURIComponent 例外対策 | try-catch を追加 | ✅ 完了 |
| refetch() 冗長呼び出し削除 | 不要な refetch を削除 | ✅ 完了 |
