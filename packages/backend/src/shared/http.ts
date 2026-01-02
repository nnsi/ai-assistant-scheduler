import type { ErrorCode } from "@ai-scheduler/shared";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const getStatusCode = (code: ErrorCode): ContentfulStatusCode => {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "CONFLICT":
      return 409;
    case "AI_ERROR":
      return 502;
    case "DATABASE_ERROR":
      return 500;
    case "INTERNAL_ERROR":
      return 500;
    default:
      return 500;
  }
};
