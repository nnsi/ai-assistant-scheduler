import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateMemoInputSchema } from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createSupplementRepo } from "../../infra/drizzle/supplementRepo";
import { createUpdateMemoUseCase } from "./usecase/updateMemo";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";

type Bindings = {
  DB: D1Database;
};

type Variables = {
  updateMemo: ReturnType<typeof createUpdateMemoUseCase>;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// ミドルウェアでDIを解決
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const supplementRepo = createSupplementRepo(db);

  c.set("updateMemo", createUpdateMemoUseCase(supplementRepo));

  await next();
});

export const supplementRoute = app
  // PUT /supplements/:scheduleId/memo
  .put(
    "/:scheduleId/memo",
    zValidator("json", updateMemoInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const scheduleId = c.req.param("scheduleId");
      const input = c.req.valid("json");
      const result = await c.get("updateMemo")(scheduleId, input);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  );
