import {
  scheduleSchema,
  scheduleWithSupplementSchema,
  type Schedule,
  type ScheduleWithSupplement,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type ApiError,
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

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new ApiClientError(error.code, error.message, error.details);
  }

  return data as T;
};

// Schedule API
export const fetchSchedules = async (
  year?: number,
  month?: number
): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", year.toString());
  if (month !== undefined) params.set("month", month.toString());

  const url = `${API_BASE_URL}/schedules${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);
  const data = await handleResponse<unknown[]>(response);

  return data.map((item) => scheduleSchema.parse(item));
};

export const fetchScheduleById = async (
  id: string
): Promise<ScheduleWithSupplement> => {
  const response = await fetch(`${API_BASE_URL}/schedules/${id}`);
  const data = await handleResponse<unknown>(response);
  return scheduleWithSupplementSchema.parse(data);
};

export const createSchedule = async (
  input: CreateScheduleInput
): Promise<Schedule> => {
  const response = await fetch(`${API_BASE_URL}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handleResponse<unknown>(response);
  return scheduleSchema.parse(data);
};

export const updateSchedule = async (
  id: string,
  input: UpdateScheduleInput
): Promise<Schedule> => {
  const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handleResponse<unknown>(response);
  return scheduleSchema.parse(data);
};

export const deleteSchedule = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await response.json();
    throw new ApiClientError(data.code, data.message, data.details);
  }
};

// AI API
export const suggestKeywords = async (
  title: string,
  startAt: string
): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/ai/suggest-keywords`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, startAt }),
  });
  const data = await handleResponse<{ keywords: string[] }>(response);
  return data.keywords;
};

export const searchWithKeywords = async (
  scheduleId: string,
  title: string,
  startAt: string,
  keywords: string[]
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/ai/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduleId, title, startAt, keywords }),
  });
  const data = await handleResponse<{ result: string }>(response);
  return data.result;
};

// Supplement API
export const updateMemo = async (
  scheduleId: string,
  userMemo: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/supplements/${scheduleId}/memo`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMemo }),
    }
  );
  if (!response.ok) {
    const data = await response.json();
    throw new ApiClientError(data.code, data.message, data.details);
  }
};

export { ApiClientError };
