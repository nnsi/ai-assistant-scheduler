// AIサービス型定義
export type AiService = {
  suggestKeywords: (title: string, startAt: string) => Promise<string[]>;
  searchWithKeywords: (
    title: string,
    startAt: string,
    keywords: string[]
  ) => Promise<string>;
};
