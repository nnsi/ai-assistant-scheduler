// ユーザーのこだわり条件（シンプルな自由テキスト形式）
export type UserConditions = {
  required: string;
  preferred: string;
  subjective: string;
};

// AIサービス型定義
export type AiService = {
  suggestKeywords: (
    title: string,
    startAt: string,
    userConditions?: UserConditions,
    excludeKeywords?: string[]
  ) => Promise<string[]>;
  searchWithKeywords: (
    title: string,
    startAt: string,
    keywords: string[],
    userConditions?: UserConditions
  ) => Promise<string>;
};
