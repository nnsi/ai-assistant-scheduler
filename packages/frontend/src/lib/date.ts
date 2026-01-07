import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  getHours,
  getMinutes,
} from "date-fns";
import { ja } from "date-fns/locale";

export const formatDate = (date: Date, pattern: string) =>
  format(date, pattern, { locale: ja });

export const formatDateString = (dateString: string, pattern: string) =>
  formatDate(parseISO(dateString), pattern);

export const getCalendarDays = (month: Date): Date[] => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export const getMonthLabel = (date: Date): string =>
  formatDate(date, "yyyy年M月");

export const getDayLabel = (date: Date): string => formatDate(date, "d");

export const getWeekDayLabels = (): string[] => [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
];

export {
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  getHours,
  getMinutes,
};

export const getWeekDays = (date: Date): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export const getWeekLabel = (date: Date): string => {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return `${formatDate(start, "M/d")} - ${formatDate(end, "M/d")}`;
};

export const getDayFullLabel = (date: Date): string =>
  formatDate(date, "yyyy年M月d日 (E)");

/**
 * ブラウザのタイムゾーンオフセットを取得する
 * 例: "+09:00" (日本), "-05:00" (米国東部)
 */
export const getTimezoneOffset = (): string => {
  const offset = new Date().getTimezoneOffset();
  const sign = offset <= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offset) / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
};
