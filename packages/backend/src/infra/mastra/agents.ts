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
タイトルと日時から、関連するキーワードを5〜8個提案してください。
キーワードは具体的で、検索に使えるものにしてください。

必ずJSON配列形式で返してください。
例: ["キーワード1", "キーワード2", "キーワード3"]

他の説明は不要です。JSON配列のみを返してください。`,
    model: openrouter("google/gemini-2.5-flash"),
  });
};

export const createSearchAgent = (apiKey: string) => {
  const openrouter = createOpenRouterProvider(apiKey);
  return new Agent({
    name: "search-agent",
    instructions: `あなたはユーザーの予定に関連する情報を検索し、わかりやすくまとめるアシスタントです。
検索結果をMarkdown形式で整理して返してください。

以下の形式で回答してください：
- 見出しを使って情報を整理
- 箇条書きで具体的な情報を列挙
- 必要に応じてリンクや評価情報を含める`,
    model: openrouter("google/gemini-2.5-flash:online"),
  });
};
