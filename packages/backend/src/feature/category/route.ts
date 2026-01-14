import { createCategoryInputSchema, updateCategoryInputSchema } from "@ai-scheduler/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createCategoryRepo } from "../../infra/drizzle/categoryRepo";
import { createDb } from "../../infra/drizzle/client";
import { authMiddleware } from "../../middleware/auth";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { createCreateCategoryUseCase } from "./usecase/createCategory";
import { createDeleteCategoryUseCase } from "./usecase/deleteCategory";
import { createGetCategoriesUseCase } from "./usecase/getCategories";
import { createUpdateCategoryUseCase } from "./usecase/updateCategory";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Variables = {
  userId: string;
  userEmail: string;
  createCategory: ReturnType<typeof createCreateCategoryUseCase>;
  getCategories: ReturnType<typeof createGetCategoriesUseCase>;
  updateCategory: ReturnType<typeof createUpdateCategoryUseCase>;
  deleteCategory: ReturnType<typeof createDeleteCategoryUseCase>;
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
  const categoryRepo = createCategoryRepo(db);

  c.set("createCategory", createCreateCategoryUseCase(categoryRepo));
  c.set("getCategories", createGetCategoriesUseCase(categoryRepo));
  c.set("updateCategory", createUpdateCategoryUseCase(categoryRepo));
  c.set("deleteCategory", createDeleteCategoryUseCase(categoryRepo));

  await next();
});

export const categoryRoute = app
  // GET /categories
  .get("/", async (c) => {
    const userId = c.get("userId");
    const result = await c.get("getCategories")(userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // POST /categories
  .post(
    "/",
    zValidator("json", createCategoryInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const result = await c.get("createCategory")(input, userId);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 201);
    }
  )
  // PUT /categories/:id
  .put(
    "/:id",
    zValidator("json", updateCategoryInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const id = c.req.param("id");
      const userId = c.get("userId");
      const input = c.req.valid("json");
      const result = await c.get("updateCategory")(id, userId, input);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  )
  // DELETE /categories/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const result = await c.get("deleteCategory")(id, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  });
