import { Hono } from "hono";
import { createDb } from "../../infra/drizzle/client";
import { createSupplementRepo } from "../../infra/drizzle/supplementRepo";
import { createUpdateMemoUseCase } from "./usecase/updateMemo";
import { createUpdateMemoHandler } from "./handler/updateMemoHandler";

type Bindings = {
  DB: D1Database;
};

type Variables = {
  updateMemo: ReturnType<typeof createUpdateMemoUseCase>;
};

export const supplementRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// ミドルウェアでDIを解決
supplementRoute.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const supplementRepo = createSupplementRepo(db);

  c.set("updateMemo", createUpdateMemoUseCase(supplementRepo));

  await next();
});

// PUT /schedules/:scheduleId/supplement/memo
supplementRoute.put("/:scheduleId/memo", async (c) => {
  const handler = createUpdateMemoHandler(c.get("updateMemo"));
  return handler(c);
});
