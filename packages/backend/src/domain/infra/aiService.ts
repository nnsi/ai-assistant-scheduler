import type { AgentType, Shop } from "@ai-scheduler/shared";

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

// 検索結果
export type SearchResult = {
  result: string;
  shopCandidates?: Shop[];
};

// ストリーミングイベントの型
export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "done"; shopCandidates?: Shop[] }
  | { type: "error"; message: string };

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
  ) => Promise<SearchResult>;
  searchWithKeywordsStream?: (
    title: string,
    startAt: string,
    keywords: string[],
    agentTypes: AgentType[],
    userConditions?: UserConditions
  ) => AsyncGenerator<StreamEvent>;
};
