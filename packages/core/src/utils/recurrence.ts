import type { Schedule, RecurrenceRule, DayOfWeek } from "@ai-scheduler/shared";
import { addYears, isSameDay } from "./date";

// 繰り返しイベントから表示用のオカレンスを生成
export type ScheduleOccurrence = Schedule & {
  isRecurring: boolean;
  occurrenceDate: Date;
  originalScheduleId: string;
};

const DAYS_OF_WEEK_MAP: Record<DayOfWeek, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

// 繰り返しルールからオカレンスを生成
export const generateOccurrences = (
  schedule: Schedule,
  rangeStart: Date,
  rangeEnd: Date
): ScheduleOccurrence[] => {
  const occurrences: ScheduleOccurrence[] = [];
  const recurrence = schedule.recurrence;

  if (!recurrence) {
    // 繰り返しなしの場合は元のスケジュールのみ
    const scheduleDate = new Date(schedule.startAt);
    if (scheduleDate >= rangeStart && scheduleDate <= rangeEnd) {
      occurrences.push({
        ...schedule,
        isRecurring: false,
        occurrenceDate: scheduleDate,
        originalScheduleId: schedule.id,
      });
    }
    return occurrences;
  }

  const baseDate = new Date(schedule.startAt);
  const maxOccurrences = recurrence.endCount ?? 365; // 最大1年分
  let count = 0;
  let currentDate = new Date(baseDate);

  // 終了日の計算
  const endDate = recurrence.endType === "date" && recurrence.endDate
    ? new Date(recurrence.endDate)
    : addYears(baseDate, 1); // 無期限の場合は1年後まで

  while (currentDate <= rangeEnd && currentDate <= endDate && count < maxOccurrences) {
    // 範囲内かつ開始日以降の場合のみ追加
    if (currentDate >= rangeStart && currentDate >= baseDate) {
      // weeklyの場合は曜日チェック
      if (recurrence.frequency === "weekly" && recurrence.daysOfWeek) {
        const dayOfWeek = currentDate.getDay();
        const matchingDays = recurrence.daysOfWeek.filter(
          (d) => DAYS_OF_WEEK_MAP[d] === dayOfWeek
        );
        if (matchingDays.length > 0) {
          occurrences.push(createOccurrence(schedule, currentDate, count > 0));
          count++;
        }
      } else if (recurrence.frequency !== "weekly") {
        occurrences.push(createOccurrence(schedule, currentDate, count > 0));
        count++;
      }
    }

    // 次の日付へ
    currentDate = getNextDate(currentDate, recurrence, baseDate);

    // 無限ループ防止
    if (currentDate > rangeEnd || currentDate > endDate) break;
    if (recurrence.endType === "count" && recurrence.endCount && count >= recurrence.endCount) break;
  }

  return occurrences;
};

// オカレンスオブジェクトを作成
const createOccurrence = (
  schedule: Schedule,
  date: Date,
  isVirtual: boolean
): ScheduleOccurrence => {
  // 時間部分は元のスケジュールから取得
  const originalDate = new Date(schedule.startAt);
  const occurrenceDate = new Date(date);
  occurrenceDate.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);

  return {
    ...schedule,
    // 仮想オカレンスには一意のIDを生成
    id: isVirtual ? `${schedule.id}_${date.toISOString().split("T")[0]}` : schedule.id,
    startAt: occurrenceDate.toISOString(),
    isRecurring: true,
    occurrenceDate,
    originalScheduleId: schedule.id,
  };
};

// 次の発生日を計算
const getNextDate = (
  current: Date,
  rule: RecurrenceRule,
  _baseDate: Date
): Date => {
  const next = new Date(current);
  const interval = rule.interval;

  switch (rule.frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      // weeklyの場合は1日ずつ進める（曜日チェックは呼び出し側で行う）
      next.setDate(next.getDate() + 1);
      break;
    case "monthly":
      if (rule.dayOfMonth) {
        // 特定の日付
        next.setMonth(next.getMonth() + interval);
        next.setDate(Math.min(rule.dayOfMonth, getDaysInMonth(next)));
      } else {
        next.setMonth(next.getMonth() + interval);
      }
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
};

// 月の日数を取得
const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// スケジュールリストから全オカレンスを生成
export const expandRecurringSchedules = (
  schedules: Schedule[],
  rangeStart: Date,
  rangeEnd: Date
): ScheduleOccurrence[] => {
  const allOccurrences: ScheduleOccurrence[] = [];

  for (const schedule of schedules) {
    const occurrences = generateOccurrences(schedule, rangeStart, rangeEnd);
    allOccurrences.push(...occurrences);
  }

  // 日時でソート
  allOccurrences.sort((a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime());

  return allOccurrences;
};

// 特定の日のオカレンスをフィルタ
export const getOccurrencesForDate = (
  occurrences: ScheduleOccurrence[],
  date: Date
): ScheduleOccurrence[] => {
  return occurrences.filter((occ) => isSameDay(occ.occurrenceDate, date));
};
