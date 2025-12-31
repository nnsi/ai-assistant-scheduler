import type { AppError } from "./errors";

// Result型でエラーハンドリング（例外を投げない）
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Result型のユーティリティ
export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } =>
  result.ok;

export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } =>
  !result.ok;

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.ok) {
    return result.value;
  }
  throw new Error("Cannot unwrap Err value");
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
};
