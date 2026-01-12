import { useState, useRef, useCallback } from "react";
import type { ShopList } from "@ai-scheduler/shared";
import * as api from "../api";
import type { AgentType, ScheduleContext } from "../api";

export const useAI = () => {
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [agentTypes, setAgentTypes] = useState<AgentType[]>([]);
  const [searchResult, setSearchResult] = useState<string>("");
  const [shopCandidates, setShopCandidates] = useState<ShopList | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // 除外済みキーワードの履歴（再生成用）
  const excludedKeywordsRef = useRef<string[]>([]);
  // ストリーミング中断用
  const abortControllerRef = useRef<AbortController | null>(null);

  const suggestKeywords = async (
    title: string,
    startAt: string,
    excludeKeywords?: string[],
    scheduleContext?: ScheduleContext
  ): Promise<string[]> => {
    setIsLoadingKeywords(true);
    setError(null);
    try {
      const result = await api.suggestKeywords(title, startAt, excludeKeywords, scheduleContext);
      setKeywords(result.keywords);
      setAgentTypes(result.agentTypes);
      return result.keywords;
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
    startAt: string,
    scheduleContext?: ScheduleContext
  ): Promise<string[]> => {
    // 現在のキーワードを除外リストに追加
    excludedKeywordsRef.current = [...excludedKeywordsRef.current, ...keywords];
    return suggestKeywords(title, startAt, excludedKeywordsRef.current, scheduleContext);
  };

  const search = async (
    title: string,
    startAt: string,
    selectedKeywords: string[],
    scheduleContext?: ScheduleContext
  ): Promise<api.SearchResult | null> => {
    setIsLoadingSearch(true);
    setError(null);
    try {
      const result = await api.searchWithKeywords(title, startAt, selectedKeywords, agentTypes, scheduleContext);
      setSearchResult(result.result);
      setShopCandidates(result.shopCandidates);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      return null;
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const searchAndSave = async (
    scheduleId: string,
    title: string,
    startAt: string,
    selectedKeywords: string[],
    scheduleContext?: ScheduleContext
  ): Promise<api.SearchResult | null> => {
    setIsLoadingSearch(true);
    setError(null);
    try {
      const result = await api.searchAndSave(scheduleId, title, startAt, selectedKeywords, agentTypes, scheduleContext);
      setSearchResult(result.result);
      setShopCandidates(result.shopCandidates);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      return null;
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // ストリーミング検索（共通処理）
  const executeStream = useCallback(async (
    streamFn: (onEvent: (event: api.StreamEvent) => void, signal: AbortSignal) => Promise<void>
  ): Promise<api.SearchResult | null> => {
    // 既存のストリーミングがあれば中断
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);
    setIsLoadingSearch(true);
    setSearchResult("");
    setShopCandidates(undefined);
    setStatusMessage(null);
    setError(null);

    let fullText = "";
    let finalShopCandidates: ShopList | undefined;

    try {
      await streamFn(
        (event) => {
          if (event.type === "text") {
            fullText += event.content;
            setSearchResult(fullText);
          } else if (event.type === "status") {
            setStatusMessage(event.message);
          } else if (event.type === "done") {
            finalShopCandidates = event.shopCandidates;
            if (event.shopCandidates) {
              setShopCandidates(event.shopCandidates);
            }
            setStatusMessage(null); // 完了時にステータスをクリア
          } else if (event.type === "error") {
            setError(new Error(event.message));
          }
        },
        abortController.signal
      );

      return { result: fullText, shopCandidates: finalShopCandidates };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        // 中断された場合は現在の結果を返す
        return { result: fullText, shopCandidates: finalShopCandidates };
      }
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      return null;
    } finally {
      setIsStreaming(false);
      setIsLoadingSearch(false);
      abortControllerRef.current = null;
    }
  }, []);

  // ストリーミング検索
  const searchStream = useCallback(async (
    title: string,
    startAt: string,
    selectedKeywords: string[],
    scheduleContext?: ScheduleContext
  ): Promise<api.SearchResult | null> => {
    return executeStream((onEvent, signal) =>
      api.searchWithKeywordsStream(title, startAt, selectedKeywords, agentTypes, onEvent, signal, scheduleContext)
    );
  }, [executeStream, agentTypes]);

  // ストリーミング検索＋保存
  const searchAndSaveStream = useCallback(async (
    scheduleId: string,
    title: string,
    startAt: string,
    selectedKeywords: string[],
    scheduleContext?: ScheduleContext
  ): Promise<api.SearchResult | null> => {
    return executeStream((onEvent, signal) =>
      api.searchAndSaveStream(scheduleId, title, startAt, selectedKeywords, agentTypes, onEvent, signal, scheduleContext)
    );
  }, [executeStream, agentTypes]);

  // ストリーミングを中断
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = () => {
    abortStream();
    setKeywords([]);
    setAgentTypes([]);
    setSearchResult("");
    setShopCandidates(undefined);
    setStatusMessage(null);
    setError(null);
    excludedKeywordsRef.current = [];
  };

  return {
    isLoadingKeywords,
    isLoadingSearch,
    isStreaming,
    keywords,
    agentTypes,
    searchResult,
    shopCandidates,
    statusMessage,
    error,
    suggestKeywords,
    regenerateKeywords,
    search,
    searchStream,
    searchAndSave,
    searchAndSaveStream,
    abortStream,
    reset,
  };
};
