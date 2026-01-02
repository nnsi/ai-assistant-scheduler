import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateProfileConditionsSchema } from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createProfileRepo } from "../../infra/drizzle/profileRepo";
import { createGetProfileConditionsUseCase } from "./usecase/getProfileConditions";
import { createUpdateProfileConditionsUseCase } from "./usecase/updateProfileConditions";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { authMiddleware } from "../../middleware/auth";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Variables = {
  getProfileConditions: ReturnType<typeof createGetProfileConditionsUseCase>;
  updateProfileConditions: ReturnType<
    typeof createUpdateProfileConditionsUseCase
  >;
  userId: string;
  userEmail: string;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// 認証ミドルウェアを適用
app.use("*", authMiddleware);

// DIミドルウェア
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const profileRepo = createProfileRepo(db);

  c.set("getProfileConditions", createGetProfileConditionsUseCase(profileRepo));
  c.set(
    "updateProfileConditions",
    createUpdateProfileConditionsUseCase(profileRepo)
  );

  await next();
});

export const profileRoute = app
  // GET /profile/conditions - こだわり条件を取得
  .get("/conditions", async (c) => {
    const userId = c.get("userId");
    const result = await c.get("getProfileConditions")(userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json({ profile: result.value }, 200);
  })
  // PUT /profile/conditions - こだわり条件を更新
  .put(
    "/conditions",
    zValidator("json", updateProfileConditionsSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const userId = c.get("userId");
      const updates = c.req.valid("json");
      const result = await c.get("updateProfileConditions")(userId, updates);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json({ profile: result.value }, 200);
    }
  );
