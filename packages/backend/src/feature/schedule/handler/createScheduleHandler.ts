import type { Context } from "hono";
import { createScheduleInputSchema } from "@ai-scheduler/shared";
import type { CreateScheduleUseCase } from "../usecase/createSchedule";
import { createValidationError } from "../../../shared/errors";
import { getStatusCode } from "../../../shared/http";

export const createCreateScheduleHandler = (
  createSchedule: CreateScheduleUseCase
) => {
  return async (c: Context) => {
    const body = await c.req.json();

    const parsed = createScheduleInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(createValidationError(parsed.error), 400);
    }

    const result = await createSchedule(parsed.data);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 201);
  };
};
