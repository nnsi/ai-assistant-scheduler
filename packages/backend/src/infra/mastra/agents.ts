import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";

// OpenRouter経由でGeminiを使用するためのカスタムプロバイダー設定
const createOpenRouterProvider = (apiKey: string) => {
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
};

export const createKeywordAgent = (apiKey: string) => {
  const openrouter = createOpenRouterProvider(apiKey);
  return new Agent({
    name: "keyword-agent",
    instructions: `あなたはスケジュールのタイトルから、ユーザーが調べたそうなことを提案するアシスタントです。
タイトルと日時から、関連するキーワードを5〜10個提案してください。

重要: キーワードはタイトルと組み合わせて「{タイトル} {キーワード}」の形式で検索に使われます。
そのため、タイトルの内容を繰り返さないでください。
例えば、タイトルが「横浜 みなとみらい 散策」の場合:
- 良い例: ["ランチ", "カフェ", "観光スポット", "夜景", "お土産"]
- 悪い例: ["横浜みなとみらいランチ", "横浜みなとみらいカフェ"]

**必ずJSON配列形式で返してください。**
例: ["キーワード1", "キーワード2", "キーワード3"]

他の説明は不要です。JSON配列のみを返してください。`,
    model: openrouter("google/gemini-2.5-flash"),
  });
};

export const createSearchAgent = (apiKey: string) => {
  const openrouter = createOpenRouterProvider(apiKey);
  return new Agent({
    name: "search-agent",
    instructions: `あなたはユーザーの予定に関連する情報をGoogle検索で調べ、わかりやすくまとめるアシスタントです。

重要: 必ず指定された日時を考慮して検索してください。
- その日が営業日かどうか（定休日、祝日の営業状況）
- その日に開催されているイベントや限定メニュー
- 季節限定の情報（期間限定イベント、季節メニューなど）
- 混雑状況や予約の必要性

検索結果をMarkdown形式で整理して返してください。

以下の形式で回答してください：
## 基本情報
- 営業時間、定休日、アクセス方法

## その日の状況
- 営業しているか、混雑予想、予約の必要性

## イベント・限定情報
- 開催中のイベント、季節限定メニューや展示

## おすすめスポット
- 具体的な場所の名前、特徴、おすすめポイント

情報が見つからない場合は「情報が見つかりませんでした」と正直に伝えてください。`,
    model: openrouter("google/gemini-2.5-flash:online"),
  });
};
