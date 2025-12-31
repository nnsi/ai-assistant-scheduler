import type { Context } from "hono";
import { suggestKeywordsInputSchema } from "@ai-scheduler/shared";
import type { SuggestKeywordsUseCase } from "../usecase/suggestKeywords";
import { createValidationError } from "../../../shared/errors";
import { getStatusCode } from "../../../shared/http";

export const createSuggestKeywordsHandler = (
  suggestKeywords: SuggestKeywordsUseCase
) => {
  return async (c: Context) => {
    const body = await c.req.json();

    const parsed = suggestKeywordsInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(createValidationError(parsed.error), 400);
    }

    const result = await suggestKeywords(parsed.data.title, parsed.data.startAt);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json({ keywords: result.value });
  };
};
