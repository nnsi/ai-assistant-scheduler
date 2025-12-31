import { hc } from "hono/client";
import type { ApiRoutes } from "@ai-scheduler/backend/client";
import type {
  Schedule,
  ScheduleWithSupplement,
  CreateScheduleInput,
  UpdateScheduleInput,
  ApiError,
} from "@ai-scheduler/shared";

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

// エラーハンドリングヘルパー
const handleError = (error: ApiError): never => {
  throw new ApiClientError(error.code, error.message, error.details);
};

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

  const data = await res.json();

  if (!res.ok) {
    handleError(data as ApiError);
  }

  return data as Schedule[];
};

export const fetchScheduleById = async (
  id: string
): Promise<ScheduleWithSupplement> => {
  const res = await client.schedules[":id"].$get({
    param: { id },
  });

  const data = await res.json();

  if (!res.ok) {
    handleError(data as ApiError);
  }

  return data as ScheduleWithSupplement;
};

export const createSchedule = async (
  input: CreateScheduleInput
): Promise<Schedule> => {
  const res = await client.schedules.$post({
    json: input,
  });

  const data = await res.json();

  if (!res.ok) {
    handleError(data as ApiError);
  }

  return data as Schedule;
};

export const updateSchedule = async (
  id: string,
  input: UpdateScheduleInput
): Promise<Schedule> => {
  const res = await client.schedules[":id"].$put({
    param: { id },
    json: input,
  });

  const data = await res.json();

  if (!res.ok) {
    handleError(data as ApiError);
  }

  return data as Schedule;
};

export const deleteSchedule = async (id: string): Promise<void> => {
  const res = await client.schedules[":id"].$delete({
    param: { id },
  });

  if (!res.ok) {
    const data = await res.json();
    handleError(data as ApiError);
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

  const data = await res.json();

  if (!res.ok) {
    handleError(data as ApiError);
  }

  return (data as { keywords: string[] }).keywords;
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

  const data = await res.json();

  if (!res.ok) {
    handleError(data as ApiError);
  }

  return (data as { result: string }).result;
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
    const data = await res.json();
    handleError(data as ApiError);
  }
};

export { ApiClientError };
