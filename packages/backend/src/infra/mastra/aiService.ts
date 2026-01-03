import type { Agent } from "@mastra/core/agent";
import type { AgentType } from "@ai-scheduler/shared";
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
const buildExclusionPrompt = (
  userConditions?: UserConditions,
  excludeKeywords?: string[]
): string => {
  const parts: string[] = [];

  // こだわり条件からの除外
  if (userConditions) {
    const allConditions = [
      userConditions.required,
      userConditions.preferred,
      userConditions.subjective,
    ]
      .filter((c) => c.trim())
      .join("、");

    if (allConditions) {
      parts.push(
        `以下はユーザーが既に設定済みの「こだわり条件」なので、キーワードとして提案しないこと:\n${allConditions}`
      );
    }
  }

  // 前回提案済みキーワードからの除外（再生成時）
  if (excludeKeywords && excludeKeywords.length > 0) {
    parts.push(
      `以下は既に提案済みのキーワードなので、同じものや類似のものは提案しないこと:\n${excludeKeywords.join("、")}`
    );
  }

  if (parts.length === 0) return "";

  return `\n\n【除外】\n${parts.join("\n\n")}`;
};

// エージェントタイプに応じたセクションタイトル
const getAgentSectionTitle = (agentType: AgentType): string => {
  switch (agentType) {
    case "plan":
      return "プラン提案";
    case "search":
      return "店舗候補";
    case "area-info":
      return "周辺情報";
  }
};

// エージェントタイプの優先順位（plan → search → area-info）
const agentTypePriority: Record<AgentType, number> = {
  plan: 1,
  search: 2,
  "area-info": 3,
};

// 優先順位でソート
const sortAgentTypes = (types: AgentType[]): AgentType[] => {
  return [...types].sort(
    (a, b) => agentTypePriority[a] - agentTypePriority[b]
  );
};

type AgentMap = {
  search: Agent;
  plan: Agent;
  "area-info": Agent;
};

export const createAiService = (
  keywordAgent: Agent,
  agents: AgentMap
): AiService => ({
  suggestKeywords: async (title, startAt, userConditions, excludeKeywords) => {
    const exclusionPrompt = buildExclusionPrompt(userConditions, excludeKeywords);

    const result = await keywordAgent.generate([
      {
        role: "user",
        content: `タイトル: ${title}\n日時: ${startAt}${exclusionPrompt}`,
      },
    ]);

    try {
      // レスポンスからJSONオブジェクトを抽出
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // 型の検証
        if (
          Array.isArray(parsed.keywords) &&
          Array.isArray(parsed.agentTypes) &&
          parsed.agentTypes.every((t: string) =>
            ["search", "plan", "area-info"].includes(t)
          )
        ) {
          return {
            keywords: parsed.keywords,
            agentTypes: parsed.agentTypes,
          };
        }
      }

      // 旧形式（配列のみ）との後方互換性
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return {
          keywords: JSON.parse(arrayMatch[0]),
          agentTypes: ["search"] as AgentType[],
        };
      }

      logger.warn("Failed to parse AI keywords response", {
        category: "ai",
        responseText: result.text,
      });
      return { keywords: [], agentTypes: ["search"] as AgentType[] };
    } catch {
      logger.warn("Failed to parse AI keywords response", {
        category: "ai",
        responseText: result.text,
      });
      return { keywords: [], agentTypes: ["search"] as AgentType[] };
    }
  },

  searchWithKeywords: async (
    title,
    startAt,
    keywords,
    agentTypes,
    userConditions
  ) => {
    const conditionsPrompt = buildConditionsPrompt(userConditions);

    // デフォルトは search
    const typesToUse =
      agentTypes.length > 0 ? sortAgentTypes(agentTypes) : ["search"] as AgentType[];

    // 各エージェントを順番に実行
    const results: { type: AgentType; content: string }[] = [];

    for (const agentType of typesToUse) {
      const agent = agents[agentType];
      if (!agent) continue;

      const result = await agent.generate([
        {
          role: "user",
          content: `以下の予定について、選択されたキーワードに関連する情報を検索してまとめてください。

タイトル: ${title}
日時: ${startAt}
調べたいこと: ${keywords.join(", ")}${conditionsPrompt}`,
        },
      ]);

      results.push({ type: agentType, content: result.text });
    }

    // 複数エージェントの結果をマージ
    if (results.length === 1) {
      return results[0].content;
    }

    // セクションタイトル付きでマージ
    return results
      .map(({ type, content }) => `## ${getAgentSectionTitle(type)}\n\n${content}`)
      .join("\n\n---\n\n");
  },
});
