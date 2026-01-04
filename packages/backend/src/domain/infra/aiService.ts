import type { AgentType } from "@ai-scheduler/shared";

// ユーザーのこだわり条件（シンプルな自由テキスト形式）
export type UserConditions = {
  required: string;
  preferred: string;
  subjective: string;
};

// キーワード提案の結果
export type KeywordSuggestion = {
  keywords: string[];
  agentTypes: AgentType[];
};

// AIサービス型定義
export type AiService = {
  suggestKeywords: (
    title: string,
    startAt: string,
    userConditions?: UserConditions,
    excludeKeywords?: string[]
  ) => Promise<KeywordSuggestion>;
  searchWithKeywords: (
    title: string,
    startAt: string,
    keywords: string[],
    agentTypes: AgentType[],
    userConditions?: UserConditions
  ) => Promise<string>;
};
