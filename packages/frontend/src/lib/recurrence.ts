/**
 * 繰り返しユーティリティ（@ai-scheduler/core からの re-export）
 *
 * 互換性のため、既存の import パスを維持しています。
 * 新規コードでは @ai-scheduler/core/utils から直接インポートしてください。
 */
export {
  generateOccurrences,
  expandRecurringSchedules,
  getOccurrencesForDate,
  type ScheduleOccurrence,
} from "@ai-scheduler/core/utils";
