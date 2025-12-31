import type { Agent } from "@mastra/core/agent";
import type { AiService } from "../../domain/infra/aiService";

export const createAiService = (
  keywordAgent: Agent,
  searchAgent: Agent
): AiService => ({
  suggestKeywords: async (title, startAt) => {
    const result = await keywordAgent.generate([
      {
        role: "user",
        content: `タイトル: ${title}\n日時: ${startAt}`,
      },
    ]);

    try {
      // レスポンスからJSON配列を抽出
      const text = result.text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch {
      // パースに失敗した場合は空配列を返す
      console.error("Failed to parse keywords:", result.text);
      return [];
    }
  },

  searchWithKeywords: async (title, startAt, keywords) => {
    const result = await searchAgent.generate([
      {
        role: "user",
        content: `以下の予定について、選択されたキーワードに関連する情報を検索してまとめてください。

タイトル: ${title}
日時: ${startAt}
調べたいこと: ${keywords.join(", ")}`,
      },
    ]);

    return result.text;
  },
});
