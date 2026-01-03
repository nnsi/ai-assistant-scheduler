import { useState, useRef } from "react";
import * as api from "@/lib/api";

export const useAI = () => {
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  // 除外済みキーワードの履歴（再生成用）
  const excludedKeywordsRef = useRef<string[]>([]);

  const suggestKeywords = async (
    title: string,
    startAt: string,
    excludeKeywords?: string[]
  ): Promise<string[]> => {
    setIsLoadingKeywords(true);
    setError(null);
    try {
      const result = await api.suggestKeywords(title, startAt, excludeKeywords);
      setKeywords(result);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      return [];
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  // キーワードを再生成（現在のキーワードを除外して新しいものを取得）
  const regenerateKeywords = async (
    title: string,
    startAt: string
  ): Promise<string[]> => {
    // 現在のキーワードを除外リストに追加
    excludedKeywordsRef.current = [...excludedKeywordsRef.current, ...keywords];
    return suggestKeywords(title, startAt, excludedKeywordsRef.current);
  };

  const search = async (
    title: string,
    startAt: string,
    selectedKeywords: string[]
  ): Promise<string> => {
    setIsLoadingSearch(true);
    setError(null);
    try {
      const result = await api.searchWithKeywords(title, startAt, selectedKeywords);
      setSearchResult(result);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      return "";
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const reset = () => {
    setKeywords([]);
    setSearchResult("");
    setError(null);
    excludedKeywordsRef.current = [];
  };

  return {
    isLoadingKeywords,
    isLoadingSearch,
    keywords,
    searchResult,
    error,
    suggestKeywords,
    regenerateKeywords,
    search,
    reset,
  };
};
