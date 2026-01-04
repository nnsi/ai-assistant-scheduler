import type { AgentType, Shop } from "@ai-scheduler/shared";
import type { AiService, KeywordSuggestion, SearchResult } from "../../domain/infra/aiService";

export const createMockAiService = (): AiService => ({
  suggestKeywords: async (title, _startAt, _userConditions, excludeKeywords) => {
    // モックの遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));

    // タイトルに基づいてモックキーワードとエージェントタイプを生成
    let candidates: string[];
    let agentTypes: AgentType[];

    // タイトルに特定のキーワードが含まれている場合
    if (title.includes("観光") || title.includes("散策") || title.includes("旅行")) {
      candidates = [
        "モデルコース",
        "半日コース",
        "穴場",
        "フォトスポット",
        "効率的な回り方",
        "定番",
        "徒歩圏内",
      ];
      agentTypes = ["plan"];

      // ランチ/食事も含まれていれば search も追加
      if (title.includes("ランチ") || title.includes("食事") || title.includes("グルメ")) {
        candidates.push("個室", "予約不要", "3000円以下", "コスパ");
        agentTypes.push("search");
      }
    } else if (title.includes("レストラン") || title.includes("食事") || title.includes("ランチ") || title.includes("ディナー")) {
      candidates = ["個室", "予約不要", "当日予約OK", "3000円以下", "コスパ", "駅近", "雰囲気"];
      agentTypes = ["search"];
    } else if (title.includes("子連れ") || title.includes("ベビー")) {
      candidates = ["授乳室", "おむつ替え", "ベビーカー可", "キッズスペース", "個室", "静か"];
      agentTypes = ["area-info"];

      // 場所を回る要素があれば plan も追加
      if (title.includes("散策") || title.includes("観光")) {
        agentTypes.unshift("plan");
        candidates.push("モデルコース", "徒歩圏内");
      }
    } else if (title.includes("会議") || title.includes("ミーティング")) {
      candidates = ["議題", "参加者", "事前準備", "会議室", "資料", "オンライン", "時間配分"];
      agentTypes = ["search"];
    } else {
      candidates = ["天気", "アクセス", "周辺情報", "口コミ", "営業時間", "混雑状況", "駐車場"];
      agentTypes = ["search"];
    }

    // 除外キーワードがあればフィルタリング
    if (excludeKeywords && excludeKeywords.length > 0) {
      candidates = candidates.filter((kw) => !excludeKeywords.includes(kw));
    }

    return {
      keywords: candidates.slice(0, agentTypes.length > 1 ? 10 : 5),
      agentTypes,
    } satisfies KeywordSuggestion;
  },

  searchWithKeywords: async (title, _startAt, keywords, agentTypes): Promise<SearchResult> => {
    // モックの遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const keywordList = keywords.join("、");
    const typesToUse = agentTypes.length > 0 ? agentTypes : ["search"];

    // エージェントタイプごとにモックレスポンスを生成
    const responses: string[] = [];
    let shopCandidates: Shop[] | undefined;

    for (const agentType of typesToUse) {
      switch (agentType) {
        case "plan":
          responses.push(`## プラン提案

### おすすめプラン

**テーマ**: ${title}を満喫する半日コース
**所要時間**: 約4時間
**移動手段**: 主に徒歩

### タイムライン

**10:00 スタート地点**（滞在目安: 30分）
- 見どころ: モック情報です
- リンク: [Googleマップ](https://maps.google.com)

↓ 移動: 徒歩で約10分

**10:40 観光スポット1**（滞在目安: 60分）
- 見どころ: モック情報です
- リンク: [Googleマップ](https://maps.google.com)

### ひとこと

これはモックレスポンスです。実際のAI検索結果はここに表示されます。`);
          break;

        case "search":
          responses.push(`## 店舗候補

### 検索キーワード
${keywordList}

**店舗A（モック）**
- 一言: 条件にマッチするモック店舗です
- 指定日の営業: ◯
- 営業時間/定休日: 11:00-22:00（月曜定休）
- 条件判定:
  - 必須条件: ✅
  - 優先条件: ✅
- リンク: [公式](https://example.com) / [食べログ](https://tabelog.com)

**店舗B（モック）**
- 一言: もう一つの候補店舗です
- 指定日の営業: ◯
- 営業時間/定休日: 10:00-21:00（火曜定休）
- 条件判定:
  - 必須条件: ✅
  - 優先条件: △
- リンク: [公式](https://example.com) / [Googleマップ](https://maps.google.com)

### ひとこと

これはモックレスポンスです。実際のAI検索結果はここに表示されます。`);

          // モック用の店舗候補リスト
          shopCandidates = [
            {
              name: "店舗A（モック）",
              summary: "条件にマッチするモック店舗です",
              businessHours: "11:00-22:00",
              closedDays: "月曜定休",
              urls: {
                official: "https://example.com",
                tabelog: "https://tabelog.com",
              },
              conditionChecks: {
                required: "✅ すべて満たしています",
                preferred: "✅ 該当します",
              },
            },
            {
              name: "店舗B（モック）",
              summary: "もう一つの候補店舗です",
              businessHours: "10:00-21:00",
              closedDays: "火曜定休",
              urls: {
                official: "https://example.com",
                googleMap: "https://maps.google.com",
              },
              conditionChecks: {
                required: "✅ すべて満たしています",
                preferred: "△ 一部のみ",
              },
            },
          ];
          break;

        case "area-info":
          responses.push(`## 周辺情報

### ${title} 周辺情報

#### 子連れ向け施設

**授乳室A（モック）**
- 場所: ◯◯駅構内
- 詳細: 個室2室、お湯あり
- リンク: [Googleマップ](https://maps.google.com)

**おむつ替えスペースB（モック）**
- 場所: ◯◯ビル2F
- 詳細: ベビーベッド2台
- リンク: [Googleマップ](https://maps.google.com)

### ひとこと

これはモックレスポンスです。実際のAI検索結果はここに表示されます。`);
          break;
      }
    }

    // 複数の場合はセパレータで結合
    const result = responses.length === 1 ? responses[0] : responses.join("\n\n---\n\n");

    return {
      result,
      shopCandidates,
    };
  },
});
