import { hc } from "hono/client";
import type { ApiRoutes } from "@ai-scheduler/backend/client";
import {
  scheduleSchema,
  scheduleWithSupplementSchema,
  apiErrorSchema,
  profileResponseSchema,
  shopListSchema,
  categorySchema,
  recurrenceRuleSchema,
  calendarResponseSchema,
  calendarMemberResponseSchema,
  invitationListItemResponseSchema,
  createInvitationResponseSchema,
  invitationInfoResponseSchema,
  type Schedule,
  type ScheduleWithSupplement,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type SearchScheduleInput,
  type UserProfile,
  type UpdateProfileConditionsRequest,
  type Shop,
  type ShopList,
  type Category,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type RecurrenceRule,
  type CreateRecurrenceRuleInput,
  type UpdateRecurrenceRuleInput,
  type CalendarResponse,
  type CreateCalendarInput,
  type UpdateCalendarInput,
  type CalendarMemberResponse,
  type AddMemberInput,
  type UpdateMemberRoleInput,
  type CreateInvitationInput,
  type CreateInvitationResponse,
  type InvitationListItemResponse,
  type InvitationInfoResponse,
  type TransferOwnershipInput,
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
const categoryArraySchema = z.array(categorySchema);
const calendarArraySchema = z.array(calendarResponseSchema);
const calendarMemberArraySchema = z.array(calendarMemberResponseSchema);
const invitationArraySchema = z.array(invitationListItemResponseSchema);
const keywordsResponseSchema = z.object({ keywords: z.array(z.string()) });
const searchResponseSchema = z.object({
  result: z.string(),
  shopCandidates: shopListSchema.optional(),
});

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

export const searchSchedules = async (
  params: SearchScheduleInput
): Promise<Schedule[]> => {
  const res = await client.schedules.search.$get({
    query: params,
  });

  return handleResponse(res, scheduleArraySchema);
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

export type SearchResult = {
  result: string;
  shopCandidates?: ShopList;
};

export const searchWithKeywords = async (
  title: string,
  startAt: string,
  keywords: string[]
): Promise<SearchResult> => {
  const res = await client.ai.search.$post({
    json: { title, startAt, keywords },
  });

  return handleResponse(res, searchResponseSchema);
};

export const searchAndSave = async (
  scheduleId: string,
  title: string,
  startAt: string,
  keywords: string[]
): Promise<SearchResult> => {
  const res = await client.ai["search-and-save"].$post({
    json: { scheduleId, title, startAt, keywords },
  });

  return handleResponse(res, searchResponseSchema);
};

// ストリーミングイベントの型
export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "status"; message: string }
  | { type: "done"; shopCandidates?: ShopList }
  | { type: "error"; message: string };

// SSEストリーミング検索
export const searchWithKeywordsStream = async (
  title: string,
  startAt: string,
  keywords: string[],
  onEvent: (event: StreamEvent) => void,
  abortSignal?: AbortSignal
): Promise<void> => {
  await streamRequest(
    `${API_BASE_URL}/ai/search/stream`,
    { title, startAt, keywords },
    onEvent,
    abortSignal
  );
};

// SSEストリーミング検索＋保存
export const searchAndSaveStream = async (
  scheduleId: string,
  title: string,
  startAt: string,
  keywords: string[],
  onEvent: (event: StreamEvent) => void,
  abortSignal?: AbortSignal
): Promise<void> => {
  await streamRequest(
    `${API_BASE_URL}/ai/search-and-save/stream`,
    { scheduleId, title, startAt, keywords },
    onEvent,
    abortSignal
  );
};

// 共通のストリームリクエスト処理
const streamRequest = async (
  url: string,
  body: Record<string, unknown>,
  onEvent: (event: StreamEvent) => void,
  abortSignal?: AbortSignal
): Promise<void> => {
  const token = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
    signal: abortSignal,
  });

  if (!res.ok) {
    await handleErrorResponse(res);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSEメッセージは\n\nで区切られる
      // 完全なメッセージのみを処理し、不完全なものはバッファに残す
      let messageEnd = buffer.indexOf("\n\n");
      while (messageEnd !== -1) {
        const message = buffer.slice(0, messageEnd);
        buffer = buffer.slice(messageEnd + 2);

        // メッセージ内のdata:行を探す
        const lines = message.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data) as StreamEvent;
              onEvent(event);
            } catch {
              // JSONパース失敗は無視（通常は発生しないはず）
            }
          }
          // event:, id:, 空行は無視
        }

        messageEnd = buffer.indexOf("\n\n");
      }
    }

    // 残りのバッファを処理（ストリーム終了時）
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const event = JSON.parse(data) as StreamEvent;
            onEvent(event);
          } catch {
            // JSONパース失敗は無視
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

// お店選択API
export const selectShop = async (
  scheduleId: string,
  shop: Shop
): Promise<void> => {
  const res = await client.supplements[":scheduleId"]["selected-shop"].$put({
    param: { scheduleId },
    json: { shop },
  });

  await handleVoidResponse(res);
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

// Category API
export const fetchCategories = async (): Promise<Category[]> => {
  const res = await client.categories.$get();
  return handleResponse(res, categoryArraySchema);
};

export const createCategory = async (
  input: CreateCategoryInput
): Promise<Category> => {
  const res = await client.categories.$post({
    json: input,
  });
  return handleResponse(res, categorySchema);
};

export const updateCategory = async (
  id: string,
  input: UpdateCategoryInput
): Promise<Category> => {
  const res = await client.categories[":id"].$put({
    param: { id },
    json: input,
  });
  return handleResponse(res, categorySchema);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const res = await client.categories[":id"].$delete({
    param: { id },
  });
  await handleVoidResponse(res);
};

// Recurrence API
const nullableRecurrenceRuleSchema = recurrenceRuleSchema.nullable();

export const fetchRecurrence = async (
  scheduleId: string
): Promise<RecurrenceRule | null> => {
  const res = await client.recurrence[":scheduleId"].$get({
    param: { scheduleId },
  });
  return handleResponse(res, nullableRecurrenceRuleSchema);
};

export const createRecurrence = async (
  scheduleId: string,
  input: CreateRecurrenceRuleInput
): Promise<RecurrenceRule> => {
  const res = await client.recurrence[":scheduleId"].$post({
    param: { scheduleId },
    json: input,
  });
  return handleResponse(res, recurrenceRuleSchema);
};

export const updateRecurrence = async (
  scheduleId: string,
  input: UpdateRecurrenceRuleInput
): Promise<RecurrenceRule> => {
  const res = await client.recurrence[":scheduleId"].$put({
    param: { scheduleId },
    json: input,
  });
  return handleResponse(res, recurrenceRuleSchema);
};

export const deleteRecurrence = async (scheduleId: string): Promise<void> => {
  const res = await client.recurrence[":scheduleId"].$delete({
    param: { scheduleId },
  });
  await handleVoidResponse(res);
};

// Calendar API
export const fetchCalendars = async (): Promise<CalendarResponse[]> => {
  const res = await client.calendars.$get();
  return handleResponse(res, calendarArraySchema);
};

export const fetchCalendarById = async (
  id: string
): Promise<CalendarResponse> => {
  const res = await client.calendars[":id"].$get({
    param: { id },
  });
  return handleResponse(res, calendarResponseSchema);
};

export const createCalendar = async (
  input: CreateCalendarInput
): Promise<CalendarResponse> => {
  const res = await client.calendars.$post({
    json: input,
  });
  return handleResponse(res, calendarResponseSchema);
};

export const updateCalendar = async (
  id: string,
  input: UpdateCalendarInput
): Promise<CalendarResponse> => {
  const res = await client.calendars[":id"].$put({
    param: { id },
    json: input,
  });
  return handleResponse(res, calendarResponseSchema);
};

export const deleteCalendar = async (id: string): Promise<void> => {
  const res = await client.calendars[":id"].$delete({
    param: { id },
  });
  await handleVoidResponse(res);
};

// Calendar Member API
export const fetchCalendarMembers = async (
  calendarId: string
): Promise<CalendarMemberResponse[]> => {
  const res = await client.calendars[":id"].members.$get({
    param: { id: calendarId },
  });
  return handleResponse(res, calendarMemberArraySchema);
};

export const addCalendarMember = async (
  calendarId: string,
  input: AddMemberInput
): Promise<CalendarMemberResponse> => {
  const res = await client.calendars[":id"].members.$post({
    param: { id: calendarId },
    json: input,
  });
  return handleResponse(res, calendarMemberResponseSchema);
};

export const updateCalendarMemberRole = async (
  calendarId: string,
  targetUserId: string,
  input: UpdateMemberRoleInput
): Promise<void> => {
  const res = await client.calendars[":id"].members[":targetUserId"].$put({
    param: { id: calendarId, targetUserId },
    json: input,
  });
  await handleVoidResponse(res);
};

export const removeCalendarMember = async (
  calendarId: string,
  targetUserId: string
): Promise<void> => {
  const res = await client.calendars[":id"].members[":targetUserId"].$delete({
    param: { id: calendarId, targetUserId },
  });
  await handleVoidResponse(res);
};

export const leaveCalendar = async (calendarId: string): Promise<void> => {
  const res = await client.calendars[":id"].leave.$post({
    param: { id: calendarId },
  });
  await handleVoidResponse(res);
};

export const transferCalendarOwnership = async (
  calendarId: string,
  input: TransferOwnershipInput
): Promise<void> => {
  const res = await client.calendars[":id"].transfer.$put({
    param: { id: calendarId },
    json: input,
  });
  await handleVoidResponse(res);
};

// Calendar Invitation API
export const fetchCalendarInvitations = async (
  calendarId: string
): Promise<InvitationListItemResponse[]> => {
  const res = await client.calendars[":id"].invitations.$get({
    param: { id: calendarId },
  });
  return handleResponse(res, invitationArraySchema);
};

export const createCalendarInvitation = async (
  calendarId: string,
  input: CreateInvitationInput
): Promise<CreateInvitationResponse> => {
  const res = await client.calendars[":id"].invitations.$post({
    param: { id: calendarId },
    json: input,
  });
  return handleResponse(res, createInvitationResponseSchema);
};

export const revokeCalendarInvitation = async (
  calendarId: string,
  invitationId: string
): Promise<void> => {
  const res = await client.calendars[":id"].invitations[":invitationId"].$delete({
    param: { id: calendarId, invitationId },
  });
  await handleVoidResponse(res);
};

// Invitation Token API (直接fetchを使用 - Hono RPC型推論の制約回避)
export const fetchInvitationInfo = async (
  token: string
): Promise<InvitationInfoResponse> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/invitations/${token}`);
  return handleResponse(res, invitationInfoResponseSchema);
};

const acceptInvitationResponseSchema = z.object({ calendarId: z.string() });

export const acceptInvitation = async (
  token: string
): Promise<{ calendarId: string }> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/invitations/${token}/accept`, {
    method: "POST",
  });
  return handleResponse(res, acceptInvitationResponseSchema);
};

export { ApiClientError };
