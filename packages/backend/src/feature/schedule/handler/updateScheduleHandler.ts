import type { Context } from "hono";
import { updateScheduleInputSchema } from "@ai-scheduler/shared";
import type { UpdateScheduleUseCase } from "../usecase/updateSchedule";
import { createValidationError } from "../../../shared/errors";
import { getStatusCode } from "../../../shared/http";

export const createUpdateScheduleHandler = (
  updateSchedule: UpdateScheduleUseCase
) => {
  return async (c: Context) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    const parsed = updateScheduleInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(createValidationError(parsed.error), 400);
    }

    const result = await updateSchedule(id, parsed.data);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value);
  };
};
