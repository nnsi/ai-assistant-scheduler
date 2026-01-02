import type { AiService } from "../../domain/infra/aiService";

export const createMockAiService = (): AiService => ({
  suggestKeywords: async (title, _startAt, _userConditions) => {
    // モックの遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));

    // タイトルに基づいてモックキーワードを生成
    const mockKeywords: Record<string, string[]> = {
      default: ["天気", "アクセス", "周辺情報", "口コミ", "営業時間"],
    };

    // タイトルに特定のキーワードが含まれている場合
    if (title.includes("レストラン") || title.includes("食事")) {
      return ["メニュー", "予約方法", "口コミ", "アクセス", "営業時間"];
    }
    if (title.includes("会議") || title.includes("ミーティング")) {
      return ["議題", "参加者", "事前準備", "会議室", "資料"];
    }
    if (title.includes("旅行") || title.includes("観光")) {
      return ["観光スポット", "天気", "交通手段", "ホテル", "グルメ"];
    }

    return mockKeywords.default;
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
