import type { Context } from "hono";
import { searchInputSchema } from "@ai-scheduler/shared";
import type { SearchWithKeywordsUseCase } from "../usecase/searchWithKeywords";
import { createValidationError } from "../../../shared/errors";
import { getStatusCode } from "../../../shared/http";

export const createSearchHandler = (
  searchWithKeywords: SearchWithKeywordsUseCase
) => {
  return async (c: Context) => {
    const body = await c.req.json();

    const parsed = searchInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(createValidationError(parsed.error), 400);
    }

    const { scheduleId, title, startAt, keywords } = parsed.data;
    const result = await searchWithKeywords(scheduleId, title, startAt, keywords);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json({ result: result.value.aiResult });
  };
};
