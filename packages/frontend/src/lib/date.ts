/**
 * 日付ユーティリティ（@ai-scheduler/core からの re-export）
 *
 * 互換性のため、既存の import パスを維持しています。
 * 新規コードでは @ai-scheduler/core/utils から直接インポートしてください。
 */
export {
  formatDate,
  formatDateString,
  getCalendarDays,
  getMonthLabel,
  getDayLabel,
  getWeekDayLabels,
  getWeekDays,
  getWeekLabel,
  getDayFullLabel,
  getTimezoneOffset,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addYears,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getHours,
  getMinutes,
  getDay,
  isBefore,
  isAfter,
} from "@ai-scheduler/core/utils";
