/**
 * Class name ユーティリティ
 *
 * Tailwind CSSのクラス名をマージするためのヘルパー関数。
 * UIに関連するため、coreではなくfrontendに配置。
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
