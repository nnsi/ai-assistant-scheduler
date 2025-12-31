import type { Context } from "hono";
import type { GetSchedulesUseCase } from "../usecase/getSchedules";
import { getStatusCode } from "../../../shared/http";

export const createGetSchedulesHandler = (getSchedules: GetSchedulesUseCase) => {
  return async (c: Context) => {
    const yearParam = c.req.query("year");
    const monthParam = c.req.query("month");

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const month = monthParam ? parseInt(monthParam, 10) : undefined;

    const result = await getSchedules(year, month);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value);
  };
};
