import type { Agent } from "@mastra/core/agent";
import type { AiService, UserConditions } from "../../domain/infra/aiService";
import { logger } from "../../shared/logger";

// ユーザー条件からプロンプト用の文字列を生成（検索用）
const buildConditionsPrompt = (userConditions?: UserConditions): string => {
  if (!userConditions) return "";

  const parts: string[] = [];

  if (userConditions.required.trim()) {
    parts.push(
      `【必須条件（口コミで違反が見つかれば絶対に除外）】: ${userConditions.required}`
    );
  }

  if (userConditions.preferred.trim()) {
    parts.push(`【優先条件（該当する候補を優先表示）】: ${userConditions.preferred}`);
  }

  if (userConditions.subjective.trim()) {
    parts.push(`【重視するポイント（口コミで確認）】: ${userConditions.subjective}`);
  }

  if (parts.length === 0) return "";

  return `\n\nユーザーのこだわり条件:\n${parts.join("\n")}`;
};

// ユーザー条件から除外キーワードのプロンプトを生成（キーワード提案用）
const buildExclusionPrompt = (userConditions?: UserConditions): string => {
  if (!userConditions) return "";

  const allConditions = [
    userConditions.required,
    userConditions.preferred,
    userConditions.subjective,
  ]
    .filter((c) => c.trim())
    .join("、");

  if (!allConditions) return "";

  return `\n\n【除外】以下はユーザーが既に設定済みの「こだわり条件」なので、キーワードとして提案しないこと:\n${allConditions}`;
};

export const createAiService = (
  keywordAgent: Agent,
  searchAgent: Agent
): AiService => ({
  suggestKeywords: async (title, startAt, userConditions) => {
    const exclusionPrompt = buildExclusionPrompt(userConditions);

    const result = await keywordAgent.generate([
      {
        role: "user",
        content: `タイトル: ${title}\n日時: ${startAt}${exclusionPrompt}`,
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
      logger.warn("Failed to parse AI keywords response", {
        category: "ai",
        responseText: result.text,
      });
      return [];
    }
  },

  searchWithKeywords: async (title, startAt, keywords, userConditions) => {
    const conditionsPrompt = buildConditionsPrompt(userConditions);

    const result = await searchAgent.generate([
      {
        role: "user",
        content: `以下の予定について、選択されたキーワードに関連する情報を検索してまとめてください。

タイトル: ${title}
日時: ${startAt}
調べたいこと: ${keywords.join(", ")}${conditionsPrompt}`,
      },
    ]);

    return result.text;
  },
});
