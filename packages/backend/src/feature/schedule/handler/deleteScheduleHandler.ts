import type { Context } from "hono";
import type { DeleteScheduleUseCase } from "../usecase/deleteSchedule";
import { getStatusCode } from "../../../shared/http";

export const createDeleteScheduleHandler = (
  deleteSchedule: DeleteScheduleUseCase
) => {
  return async (c: Context) => {
    const id = c.req.param("id");

    const result = await deleteSchedule(id);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  };
};
