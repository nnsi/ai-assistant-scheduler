import type { Context } from "hono";
import { updateMemoInputSchema } from "@ai-scheduler/shared";
import type { UpdateMemoUseCase } from "../usecase/updateMemo";
import { createValidationError } from "../../../shared/errors";
import { getStatusCode } from "../../../shared/http";

export const createUpdateMemoHandler = (updateMemo: UpdateMemoUseCase) => {
  return async (c: Context) => {
    const scheduleId = c.req.param("scheduleId");
    const body = await c.req.json();

    const parsed = updateMemoInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(createValidationError(parsed.error), 400);
    }

    const result = await updateMemo(scheduleId, parsed.data);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value);
  };
};
