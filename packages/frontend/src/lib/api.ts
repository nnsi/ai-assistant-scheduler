import { hc } from "hono/client";
import type { ApiRoutes } from "@ai-scheduler/backend/client";
import {
  scheduleSchema,
  scheduleWithSupplementSchema,
  apiErrorSchema,
  type Schedule,
  type ScheduleWithSupplement,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@ai-scheduler/shared";
import { z } from "zod";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

// Hono RPC Client
const client = hc<ApiRoutes>(API_BASE_URL);

// レスポンススキーマ
const scheduleArraySchema = z.array(scheduleSchema);
const keywordsResponseSchema = z.object({ keywords: z.array(z.string()) });
const searchResponseSchema = z.object({ result: z.string() });

// レスポンスを処理してエラーならthrow、成功ならデータを返す
async function handleResponse<T>(
  res: Response,
  schema: z.ZodType<T>
): Promise<T> {
  const json: unknown = await res.json();

  if (!res.ok) {
    const errorResult = apiErrorSchema.safeParse(json);
    if (errorResult.success) {
      throw new ApiClientError(
        errorResult.data.code,
        errorResult.data.message,
        errorResult.data.details
      );
    }
    throw new Error("Unknown error");
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid response format: ${result.error.message}`);
  }

  return result.data;
}

// Schedule API
export const fetchSchedules = async (
  year?: number,
  month?: number
): Promise<Schedule[]> => {
  const res = await client.schedules.$get({
    query: {
      year: year?.toString(),
      month: month?.toString(),
    },
  });

  return handleResponse(res, scheduleArraySchema);
};

export const fetchScheduleById = async (
  id: string
): Promise<ScheduleWithSupplement> => {
  const res = await client.schedules[":id"].$get({
    param: { id },
  });

  return handleResponse(res, scheduleWithSupplementSchema);
};

export const createSchedule = async (
  input: CreateScheduleInput
): Promise<Schedule> => {
  const res = await client.schedules.$post({
    json: input,
  });

  return handleResponse(res, scheduleSchema);
};

export const updateSchedule = async (
  id: string,
  input: UpdateScheduleInput
): Promise<Schedule> => {
  const res = await client.schedules[":id"].$put({
    param: { id },
    json: input,
  });

  return handleResponse(res, scheduleSchema);
};

export const deleteSchedule = async (id: string): Promise<void> => {
  const res = await client.schedules[":id"].$delete({
    param: { id },
  });

  if (!res.ok) {
    const json: unknown = await res.json();
    const errorResult = apiErrorSchema.safeParse(json);
    if (errorResult.success) {
      throw new ApiClientError(
        errorResult.data.code,
        errorResult.data.message,
        errorResult.data.details
      );
    }
    throw new Error("Unknown error");
  }
};

// AI API
export const suggestKeywords = async (
  title: string,
  startAt: string
): Promise<string[]> => {
  const res = await client.ai["suggest-keywords"].$post({
    json: { title, startAt },
  });

  const data = await handleResponse(res, keywordsResponseSchema);
  return data.keywords;
};

export const searchWithKeywords = async (
  scheduleId: string,
  title: string,
  startAt: string,
  keywords: string[]
): Promise<string> => {
  const res = await client.ai.search.$post({
    json: { scheduleId, title, startAt, keywords },
  });

  const data = await handleResponse(res, searchResponseSchema);
  return data.result;
};

// Supplement API
export const updateMemo = async (
  scheduleId: string,
  userMemo: string
): Promise<void> => {
  const res = await client.supplements[":scheduleId"].memo.$put({
    param: { scheduleId },
    json: { userMemo },
  });

  if (!res.ok) {
    const json: unknown = await res.json();
    const errorResult = apiErrorSchema.safeParse(json);
    if (errorResult.success) {
      throw new ApiClientError(
        errorResult.data.code,
        errorResult.data.message,
        errorResult.data.details
      );
    }
    throw new Error("Unknown error");
  }
};

export { ApiClientError };
