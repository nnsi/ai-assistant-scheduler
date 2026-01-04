import { hc } from "hono/client";
import type { ApiRoutes } from "@ai-scheduler/backend/client";
import {
  scheduleSchema,
  scheduleWithSupplementSchema,
  apiErrorSchema,
  profileResponseSchema,
  type Schedule,
  type ScheduleWithSupplement,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type UserProfile,
  type UpdateProfileConditionsRequest,
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

// トークン管理（AuthContextから設定される）
let currentAccessToken: string | null = null;
let tokenRefreshCallback: (() => Promise<string | null>) | null = null;

// AuthContextからアクセストークンを設定
export const setApiAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

// AuthContextからリフレッシュコールバックを設定
export const setTokenRefreshCallback = (
  callback: (() => Promise<string | null>) | null
) => {
  tokenRefreshCallback = callback;
};

const getAccessToken = (): string | null => {
  return currentAccessToken;
};

// 認証ヘッダーを追加するfetchラッパー（自動リフレッシュ付き）
const fetchWithAuth: typeof fetch = async (input, init) => {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers, credentials: "include" });

  // 401エラーの場合、トークンをリフレッシュしてリトライ
  if (res.status === 401 && tokenRefreshCallback) {
    const newToken = await tokenRefreshCallback();
    if (newToken) {
      currentAccessToken = newToken;
      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(input, { ...init, headers, credentials: "include" });
    }
  }

  return res;
};

// Hono RPC Client with auth
const client = hc<ApiRoutes>(API_BASE_URL, {
  fetch: fetchWithAuth,
});

// レスポンススキーマ
const scheduleArraySchema = z.array(scheduleSchema);
const keywordsResponseSchema = z.object({ keywords: z.array(z.string()) });
const searchResponseSchema = z.object({ result: z.string() });

// エラーレスポンスをパースしてスロー
async function handleErrorResponse(res: Response): Promise<never> {
  try {
    const json: unknown = await res.json();
    const errorResult = apiErrorSchema.safeParse(json);
    if (errorResult.success) {
      // 認証エラーの場合は特別なエラーコードを設定
      if (res.status === 401) {
        throw new ApiClientError(
          "UNAUTHORIZED",
          errorResult.data.message,
          errorResult.data.details
        );
      }
      throw new ApiClientError(
        errorResult.data.code,
        errorResult.data.message,
        errorResult.data.details
      );
    }
  } catch (e) {
    if (e instanceof ApiClientError) throw e;
    // JSONパース失敗時はステータスコードベースのエラー
  }
  throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
}

// レスポンスを処理してエラーならthrow、成功ならデータを返す
async function handleResponse<T>(
  res: Response,
  schema: z.ZodType<T>
): Promise<T> {
  if (!res.ok) {
    await handleErrorResponse(res);
  }

  const json: unknown = await res.json();
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid response format: ${result.error.message}`);
  }

  return result.data;
}

// voidレスポンス用ハンドラ（204 No Contentなど）
async function handleVoidResponse(res: Response): Promise<void> {
  if (!res.ok) {
    await handleErrorResponse(res);
  }
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

  await handleVoidResponse(res);
};

// AI API
export const suggestKeywords = async (
  title: string,
  startAt: string,
  excludeKeywords?: string[]
): Promise<string[]> => {
  const res = await client.ai["suggest-keywords"].$post({
    json: { title, startAt, excludeKeywords },
  });

  const data = await handleResponse(res, keywordsResponseSchema);
  return data.keywords;
};

export const searchWithKeywords = async (
  title: string,
  startAt: string,
  keywords: string[]
): Promise<string> => {
  const res = await client.ai.search.$post({
    json: { title, startAt, keywords },
  });

  const data = await handleResponse(res, searchResponseSchema);
  return data.result;
};

export const searchAndSave = async (
  scheduleId: string,
  title: string,
  startAt: string,
  keywords: string[]
): Promise<string> => {
  const res = await client.ai["search-and-save"].$post({
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

  await handleVoidResponse(res);
};

// Profile API
export const fetchProfileConditions = async (): Promise<UserProfile> => {
  const res = await client.profile.conditions.$get();

  const data = await handleResponse(res, profileResponseSchema);
  return data.profile;
};

export const updateProfileConditions = async (
  updates: UpdateProfileConditionsRequest
): Promise<UserProfile> => {
  const res = await client.profile.conditions.$put({
    json: updates,
  });

  const data = await handleResponse(res, profileResponseSchema);
  return data.profile;
};

export { ApiClientError };
