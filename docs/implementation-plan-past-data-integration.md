# 過去データ統合による検索パーソナライズ機能 実装計画

## 背景

### 課題
現在のアプリは「予定登録→AI検索」というフローを持つが、チャットUIと比較して明確な優位性が薄い。チャットUIでも「渋谷 イタリアン 個室」と入力すれば同様の結果が得られる。

### カレンダーアプリならではの強み
カレンダーには「過去の予定・検索履歴」という資産がある。これを活用することで：
- 「前回と違うジャンル」「いつも行くエリア周辺」などの提案が可能
- 毎回同じ条件を説明しなくても、過去の選択傾向から学習
- チャットUIでは再現困難な「文脈を持った検索」を実現

### コンセプト
「予定を登録する際にGoogle検索で調べることを全て代替する」を軸に、過去データを活用したパーソナライズで差別化を図る。

---

## 現状のデータ構造

### schedule_supplements テーブル
```sql
id, schedule_id, keywords(JSON), ai_result(TEXT),
shop_candidates(JSON), selected_shop(JSON), user_memo,
created_at, updated_at
```

### 現状の問題点
1. `shop_candidates`, `selected_shop` がDBにあるが `supplementRepo` でマッピングされていない
2. ユーザーが選択したキーワード（AI提案から選んだもの）が保存されていない
3. 過去データを検索エージェントに渡す仕組みがない

---

## 実装タスク

### Phase 1: データ保存の完備

#### 1.1 supplementRepo のマッピング修正
- **ファイル**: `packages/backend/src/infra/drizzle/supplementRepo.ts`
- **内容**: `toSupplement()` に `shopCandidates`, `selectedShop` のパース処理を追加
- **優先度**: 高（これがないと後続が進まない）

#### 1.2 選択キーワードの保存
- **スキーマ変更**: `schedule_supplements` に `selected_keywords` カラム追加
- **ファイル**:
  - `packages/backend/src/infra/drizzle/schema.ts`
  - `packages/backend/migrations/0006_add_selected_keywords.sql`
  - `packages/shared/src/schemas/supplement.ts`
- **内容**: ユーザーが実際に選択したキーワードを保存

#### 1.3 エージェントタイプの保存
- **スキーマ変更**: `schedule_supplements` に `agent_types` カラム追加
- **内容**: keyword-agent が判定したエージェントタイプ（search/plan/area-info）を保存
- **目的**: 過去にどんな種類の検索をしたか分析に使う

#### 1.4 フロントエンド: 選択データの送信
- **ファイル**: `packages/frontend/src/hooks/useAI.ts`
- **内容**: `searchAndSave()` 呼び出し時に選択キーワードも送信

---

### Phase 2: 過去データ取得API

#### 2.1 関連予定取得API
- **エンドポイント**: `GET /schedules/related`
- **パラメータ**:
  - `title`: 現在の予定タイトル（類似検索用）
  - `startAt`: 日時（季節・曜日の傾向分析用）
  - `limit`: 取得件数（デフォルト10）
- **レスポンス**: 過去の予定 + supplement（選択キーワード、選択店舗含む）

#### 2.2 関連度スコアリングロジック
- **ファイル**: `packages/backend/src/feature/schedule/usecase/getRelatedSchedules.ts`
- **スコアリング要素**:
  - タイトルの類似度（形態素解析 or 単純なキーワードマッチ）
  - 同じエリア名を含むか
  - 同じジャンル（イタリアン、和食など）か
  - 同じ時間帯（ランチ/ディナー）か
  - 季節の近さ（夏→夏の予定を優先）

---

### Phase 3: キーワードエージェントへの過去データ統合

#### 3.1 プロンプト拡張
- **ファイル**: `packages/backend/src/infra/mastra/agents.ts` (`createKeywordAgent`)
- **追加コンテキスト**:
  ```
  ## 過去の関連予定
  - 2024/12/20「新宿 焼肉」→ 選択キーワード: [個室, 食べ放題] → 選択店: ○○
  - 2024/11/15「渋谷 イタリアン」→ 選択キーワード: [ワイン, デート向け] → 選択店: △△
  ```
- **期待効果**:
  - 過去に選んだキーワードの傾向を考慮した提案
  - 「前回と違う選択肢」の提示

#### 3.2 キーワード提案の差別化
- **ロジック追加**: 過去によく選ばれたキーワードは上位に
- **ロジック追加**: 過去に一度も選ばれなかったキーワードは「新しい発見」として提示

---

### Phase 4: AI検索エージェントへの過去データ統合

#### 4.1 Search Agent プロンプト拡張
- **ファイル**: `packages/backend/src/infra/mastra/agents.ts` (`createSearchAgent`)
- **追加コンテキスト**:
  ```
  ## ユーザーの過去の選択傾向
  - よく選ぶエリア: 渋谷、新宿
  - よく選ぶジャンル: イタリアン、和食
  - 過去に選んだ店: ○○（渋谷）、△△（新宿）
  - 避けた方が良い店: 過去に選ばなかった店（同条件で提示されたが選ばれなかった）
  ```
- **期待効果**:
  - 「いつもと同じ系統」または「いつもと違う提案」の使い分け
  - 過去に行った店の再提案 or 除外

#### 4.2 検索結果の差別化表示
- **フロントエンド変更**:
  - 「前回も候補に挙がった店」にバッジ表示
  - 「新しい発見」にバッジ表示
- **ファイル**: `packages/frontend/src/components/Schedule/SearchResultModal.tsx`

---

### Phase 5: 追加の差別化機能（将来）

#### 5.1 予定の連鎖提案
- ディナー予定登録時に「二次会」「終電情報」を自動提案
- 前後の予定を考慮した移動時間計算

#### 5.2 フィードバックループ
- 予定終了後に「どうでしたか？」通知
- 評価を次回検索に反映

#### 5.3 予約リマインダー
- 予定3日前に「予約しましたか？」通知
- 予約リンクの自動表示

---

## 実装順序（推奨）

```
Phase 1.1 → 1.2 → 1.3 → 1.4  （データ保存の完備）
    ↓
Phase 2.1 → 2.2              （過去データ取得API）
    ↓
Phase 3.1 → 3.2              （キーワードエージェント統合）
    ↓
Phase 4.1 → 4.2              （検索エージェント統合）
```

Phase 1 が完了しないと Phase 2 以降のデータがない。
Phase 2 が完了しないと Phase 3, 4 で渡すデータがない。

---

## ファイル変更一覧

### バックエンド
| ファイル | 変更内容 |
|---------|---------|
| `migrations/0006_add_selected_keywords.sql` | 新規作成 |
| `src/infra/drizzle/schema.ts` | カラム追加 |
| `src/infra/drizzle/supplementRepo.ts` | マッピング修正 |
| `src/feature/schedule/route.ts` | 関連予定API追加 |
| `src/feature/schedule/usecase/getRelatedSchedules.ts` | 新規作成 |
| `src/feature/ai/usecase/suggestKeywords.ts` | 過去データ受け取り |
| `src/feature/ai/usecase/searchWithKeywords.ts` | 過去データ受け取り |
| `src/infra/mastra/agents.ts` | プロンプト拡張 |

### 共有パッケージ
| ファイル | 変更内容 |
|---------|---------|
| `src/schemas/supplement.ts` | 型定義追加 |

### フロントエンド
| ファイル | 変更内容 |
|---------|---------|
| `src/hooks/useAI.ts` | 選択キーワード送信 |
| `src/components/Schedule/SearchResultModal.tsx` | バッジ表示 |

---

## 成功指標

1. **Phase 1 完了**: 選択キーワード・店舗が正しく保存・取得できる
2. **Phase 2 完了**: 関連予定APIが類似度順でデータを返す
3. **Phase 3 完了**: キーワード提案が過去の選択傾向を反映している
4. **Phase 4 完了**: 検索結果に「前回も候補」「新しい発見」バッジが表示される

---

## リスク・注意点

1. **過去データが少ない初期ユーザー**: フォールバック処理が必要
2. **プロンプト肥大化**: 過去データを全部渡すとトークン数が膨らむ → 要約 or 上位N件に制限
3. **プライバシー**: 過去の予定データをAIに渡すことの説明が必要かもしれない
