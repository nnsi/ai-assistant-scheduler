import { useState } from "react";
import * as api from "@/lib/api";

export const useAI = () => {
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);

  const suggestKeywords = async (
    title: string,
    startAt: string
  ): Promise<string[]> => {
    setIsLoadingKeywords(true);
    setError(null);
    try {
      const result = await api.suggestKeywords(title, startAt);
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
  };

  return {
    isLoadingKeywords,
    isLoadingSearch,
    keywords,
    searchResult,
    error,
    suggestKeywords,
    search,
    reset,
  };
};
