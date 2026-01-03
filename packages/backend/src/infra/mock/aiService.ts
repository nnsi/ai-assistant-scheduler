import type { AiService } from "../../domain/infra/aiService";

export const createMockAiService = (): AiService => ({
  suggestKeywords: async (title, _startAt, _userConditions, excludeKeywords) => {
    // モックの遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));

    // タイトルに基づいてモックキーワードを生成
    let candidates: string[];

    // タイトルに特定のキーワードが含まれている場合
    if (title.includes("レストラン") || title.includes("食事")) {
      candidates = ["メニュー", "予約方法", "口コミ", "アクセス", "営業時間", "個室", "価格帯", "雰囲気"];
    } else if (title.includes("会議") || title.includes("ミーティング")) {
      candidates = ["議題", "参加者", "事前準備", "会議室", "資料", "オンライン", "時間配分"];
    } else if (title.includes("旅行") || title.includes("観光")) {
      candidates = ["観光スポット", "天気", "交通手段", "ホテル", "グルメ", "お土産", "穴場"];
    } else {
      candidates = ["天気", "アクセス", "周辺情報", "口コミ", "営業時間", "混雑状況", "駐車場"];
    }

    // 除外キーワードがあればフィルタリング
    if (excludeKeywords && excludeKeywords.length > 0) {
      candidates = candidates.filter((kw) => !excludeKeywords.includes(kw));
    }

    return candidates.slice(0, 5);
  },

  searchWithKeywords: async (title, startAt, keywords) => {
    // モックの遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const keywordList = keywords.join("、");

    return `## ${title} に関する情報

### 検索キーワード
${keywordList}

### 概要
これはモックレスポンスです。実際のAI検索結果はここに表示されます。

### 日時情報
- 予定日時: ${startAt}

### 関連情報
${keywords.map((kw) => `- **${kw}**: ${kw}に関する詳細情報がここに表示されます。`).join("\n")}

---
*このレスポンスはモックデータです。本番環境では実際のAI検索結果が表示されます。*`;
  },
});
