import type { Context } from "hono";
import type { GetScheduleByIdUseCase } from "../usecase/getScheduleById";
import { getStatusCode } from "../../../shared/http";

export const createGetScheduleByIdHandler = (
  getScheduleById: GetScheduleByIdUseCase
) => {
  return async (c: Context) => {
    const id = c.req.param("id");

    const result = await getScheduleById(id);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value);
  };
};
