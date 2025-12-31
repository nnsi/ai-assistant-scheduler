import { describe, it, expect, vi } from "vitest";
import { createSuggestKeywordsUseCase } from "./suggestKeywords";
import type { AiService } from "../../../domain/infra/aiService";

describe("suggestKeywordsUseCase", () => {
  const createMockAiService = (): AiService => ({
    suggestKeywords: vi.fn().mockResolvedValue([
      "3000円前後",
      "家族利用",
      "イタリアン",
    ]),
    searchWithKeywords: vi.fn(),
  });

  it("should return keywords from AI", async () => {
    const mockAiService = createMockAiService();
    const suggestKeywords = createSuggestKeywordsUseCase(mockAiService);

    const result = await suggestKeywords(
      "都内 レストラン 新宿",
      "2025-01-10T12:00:00+09:00"
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(3);
      expect(result.value).toContain("家族利用");
    }
    expect(mockAiService.suggestKeywords).toHaveBeenCalledWith(
      "都内 レストラン 新宿",
      "2025-01-10T12:00:00+09:00"
    );
  });

  it("should return error when AI fails", async () => {
    const mockAiService = createMockAiService();
    vi.mocked(mockAiService.suggestKeywords).mockRejectedValue(
      new Error("AI service error")
    );

    const suggestKeywords = createSuggestKeywordsUseCase(mockAiService);

    const result = await suggestKeywords("test", "2025-01-10T12:00:00+09:00");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AI_ERROR");
    }
  });
});
