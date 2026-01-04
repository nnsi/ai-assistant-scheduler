import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAI } from "./useAI";
import * as api from "@/lib/api";

// api モジュールをモック
vi.mock("@/lib/api", () => ({
  suggestKeywords: vi.fn(),
  searchWithKeywords: vi.fn(),
}));

describe("useAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("suggestKeywords", () => {
    it("キーワード提案を取得できる", async () => {
      const mockKeywords = ["キーワード1", "キーワード2", "キーワード3"];
      vi.mocked(api.suggestKeywords).mockResolvedValue(mockKeywords);

      const { result } = renderHook(() => useAI());

      expect(result.current.keywords).toEqual([]);
      expect(result.current.isLoadingKeywords).toBe(false);

      let returnedKeywords: string[] = [];
      await act(async () => {
        returnedKeywords = await result.current.suggestKeywords(
          "会議タイトル",
          "2025-01-15T10:00:00"
        );
      });

      expect(api.suggestKeywords).toHaveBeenCalledWith(
        "会議タイトル",
        "2025-01-15T10:00:00",
        undefined // excludeKeywords
      );
      expect(result.current.keywords).toEqual(mockKeywords);
      expect(returnedKeywords).toEqual(mockKeywords);
      expect(result.current.isLoadingKeywords).toBe(false);
    });

    it("エラー時は空配列を返しerrorを設定する", async () => {
      const mockError = new Error("API Error");
      vi.mocked(api.suggestKeywords).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAI());

      let returnedKeywords: string[] = [];
      await act(async () => {
        returnedKeywords = await result.current.suggestKeywords(
          "会議タイトル",
          "2025-01-15T10:00:00"
        );
      });

      expect(returnedKeywords).toEqual([]);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoadingKeywords).toBe(false);
    });

    it("ローディング状態が正しく管理される", async () => {
      let resolvePromise: (value: string[]) => void;
      const promise = new Promise<string[]>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.suggestKeywords).mockReturnValue(promise);

      const { result } = renderHook(() => useAI());

      expect(result.current.isLoadingKeywords).toBe(false);

      act(() => {
        result.current.suggestKeywords("タイトル", "2025-01-15T10:00:00");
      });

      await waitFor(() => {
        expect(result.current.isLoadingKeywords).toBe(true);
      });

      await act(async () => {
        resolvePromise!(["keyword"]);
      });

      expect(result.current.isLoadingKeywords).toBe(false);
    });
  });

  describe("search", () => {
    it("検索結果を取得できる", async () => {
      const mockSearchResult = {
        result: "検索結果のテキスト",
        shopCandidates: undefined,
      };
      vi.mocked(api.searchWithKeywords).mockResolvedValue(mockSearchResult);

      const { result } = renderHook(() => useAI());

      expect(result.current.searchResult).toBe("");
      expect(result.current.isLoadingSearch).toBe(false);

      let returnedResult: api.SearchResult | null = null;
      await act(async () => {
        returnedResult = await result.current.search(
          "会議タイトル",
          "2025-01-15T10:00:00",
          ["キーワード1", "キーワード2"]
        );
      });

      expect(api.searchWithKeywords).toHaveBeenCalledWith(
        "会議タイトル",
        "2025-01-15T10:00:00",
        ["キーワード1", "キーワード2"]
      );
      expect(result.current.searchResult).toBe(mockSearchResult.result);
      expect(returnedResult).toEqual(mockSearchResult);
      expect(result.current.isLoadingSearch).toBe(false);
    });

    it("エラー時はnullを返しerrorを設定する", async () => {
      const mockError = new Error("Search API Error");
      vi.mocked(api.searchWithKeywords).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAI());

      let returnedResult: api.SearchResult | null = null;
      await act(async () => {
        returnedResult = await result.current.search(
          "会議タイトル",
          "2025-01-15T10:00:00",
          ["キーワード"]
        );
      });

      expect(returnedResult).toBeNull();
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoadingSearch).toBe(false);
    });
  });

  describe("reset", () => {
    it("状態をリセットできる", async () => {
      vi.mocked(api.suggestKeywords).mockResolvedValue(["keyword"]);
      vi.mocked(api.searchWithKeywords).mockResolvedValue({
        result: "result",
        shopCandidates: undefined,
      });

      const { result } = renderHook(() => useAI());

      // 状態を設定
      await act(async () => {
        await result.current.suggestKeywords("タイトル", "2025-01-15T10:00:00");
        await result.current.search("タイトル", "2025-01-15T10:00:00", ["keyword"]);
      });

      expect(result.current.keywords).toEqual(["keyword"]);
      expect(result.current.searchResult).toBe("result");

      // リセット
      act(() => {
        result.current.reset();
      });

      expect(result.current.keywords).toEqual([]);
      expect(result.current.searchResult).toBe("");
      expect(result.current.error).toBeNull();
    });
  });
});
