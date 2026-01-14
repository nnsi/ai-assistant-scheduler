import {
  type CalendarProviderConfig,
  CalendarProvider as CoreCalendarProvider,
  useCalendarContext,
} from "@ai-scheduler/core/contexts";
/**
 * カレンダーコンテキスト（Web環境用ラッパー）
 *
 * @ai-scheduler/core の CalendarProvider に Web 環境固有の設定を注入します。
 */
import { type ReactNode } from "react";
import { storage } from "../storage";

// Web 環境用の設定
const calendarConfig: CalendarProviderConfig = {
  storage,
};

/**
 * Web 環境用の CalendarProvider
 */
export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  return <CoreCalendarProvider config={calendarConfig}>{children}</CoreCalendarProvider>;
};

export { useCalendarContext };
