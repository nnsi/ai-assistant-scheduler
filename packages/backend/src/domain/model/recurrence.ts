import {
  type RecurrenceRule,
  type CreateRecurrenceRuleInput,
  type UpdateRecurrenceRuleInput,
  type DayOfWeek,
} from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { RecurrenceRule, CreateRecurrenceRuleInput, UpdateRecurrenceRuleInput };

// 内部エンティティ型
export type RecurrenceRuleEntity = RecurrenceRule;

// ファクトリ関数
export const createRecurrenceRule = (
  input: CreateRecurrenceRuleInput,
  scheduleId: string
): RecurrenceRuleEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    scheduleId,
    frequency: input.frequency,
    interval: input.interval ?? 1,
    daysOfWeek: input.daysOfWeek ?? null,
    dayOfMonth: input.dayOfMonth ?? null,
    weekOfMonth: input.weekOfMonth ?? null,
    endType: input.endType ?? "never",
    endDate: input.endDate ?? null,
    endCount: input.endCount ?? null,
    createdAt: now,
    updatedAt: now,
  };
};

// エンティティから公開用に変換
export const toPublicRecurrenceRule = (entity: RecurrenceRuleEntity): RecurrenceRule => ({
  id: entity.id,
  scheduleId: entity.scheduleId,
  frequency: entity.frequency,
  interval: entity.interval,
  daysOfWeek: entity.daysOfWeek,
  dayOfMonth: entity.dayOfMonth,
  weekOfMonth: entity.weekOfMonth,
  endType: entity.endType,
  endDate: entity.endDate,
  endCount: entity.endCount,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

// 更新関数
export const updateRecurrenceRule = (
  rule: RecurrenceRuleEntity,
  input: UpdateRecurrenceRuleInput
): RecurrenceRuleEntity => {
  return {
    ...rule,
    frequency: input.frequency ?? rule.frequency,
    interval: input.interval ?? rule.interval,
    daysOfWeek: input.daysOfWeek !== undefined ? input.daysOfWeek : rule.daysOfWeek,
    dayOfMonth: input.dayOfMonth !== undefined ? input.dayOfMonth : rule.dayOfMonth,
    weekOfMonth: input.weekOfMonth !== undefined ? input.weekOfMonth : rule.weekOfMonth,
    endType: input.endType ?? rule.endType,
    endDate: input.endDate !== undefined ? input.endDate : rule.endDate,
    endCount: input.endCount !== undefined ? input.endCount : rule.endCount,
    updatedAt: new Date().toISOString(),
  };
};

// 繰り返しルールから次のイベント発生日を計算
export const generateOccurrences = (
  rule: RecurrenceRuleEntity,
  baseDate: Date,
  rangeStart: Date,
  rangeEnd: Date
): Date[] => {
  const occurrences: Date[] = [];
  const maxOccurrences = rule.endCount ?? 1000; // 安全のための上限
  let count = 0;
  let currentDate = new Date(baseDate);

  while (currentDate <= rangeEnd && count < maxOccurrences) {
    // 終了日チェック
    if (rule.endType === "date" && rule.endDate) {
      const endDate = new Date(rule.endDate);
      if (currentDate > endDate) break;
    }

    // 範囲内かチェック
    if (currentDate >= rangeStart && currentDate <= rangeEnd) {
      // weeklyの場合は曜日チェック
      if (rule.frequency === "weekly" && rule.daysOfWeek) {
        const dayNames: DayOfWeek[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const currentDay = dayNames[currentDate.getDay()];
        if (rule.daysOfWeek.includes(currentDay)) {
          occurrences.push(new Date(currentDate));
          count++;
        }
      } else {
        occurrences.push(new Date(currentDate));
        count++;
      }
    }

    // 次の日付へ
    currentDate = getNextDate(currentDate, rule);

    // 無限ループ防止
    if (currentDate > rangeEnd) break;
  }

  return occurrences;
};

// 次の発生日を計算
const getNextDate = (current: Date, rule: RecurrenceRuleEntity): Date => {
  const next = new Date(current);
  const interval = rule.interval;

  switch (rule.frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      // weeklyの場合は1日ずつ進めて曜日チェックする
      next.setDate(next.getDate() + 1);
      break;
    case "monthly":
      if (rule.dayOfMonth) {
        // 特定の日付
        next.setMonth(next.getMonth() + interval);
        next.setDate(rule.dayOfMonth);
      } else if (rule.weekOfMonth && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // 第N週のX曜日
        next.setMonth(next.getMonth() + interval);
        const targetDay = getDayNumber(rule.daysOfWeek[0]);
        next.setDate(1);
        // 第N週の曜日を計算
        const firstDayOfMonth = next.getDay();
        let offset = targetDay - firstDayOfMonth;
        if (offset < 0) offset += 7;
        const week = rule.weekOfMonth === -1 ? 4 : rule.weekOfMonth - 1; // -1は最終週
        next.setDate(1 + offset + week * 7);
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

// 曜日文字列を数値に変換
const getDayNumber = (day: DayOfWeek): number => {
  const map: Record<DayOfWeek, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };
  return map[day];
};
