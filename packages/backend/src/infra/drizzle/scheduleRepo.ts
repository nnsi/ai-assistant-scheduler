import { eq, and, gte, lt, lte, like, or } from "drizzle-orm";
import type { Database } from "./client";
import { schedules, categories, scheduleSupplements, recurrenceRules, type ScheduleRow, type CategoryRow, type RecurrenceRuleRow } from "./schema";
import type { ScheduleRepo } from "../../domain/infra/scheduleRepo";
import type { ScheduleEntity } from "../../domain/model/schedule";
import type { DayOfWeek, Frequency, EndType } from "@ai-scheduler/shared";

type ScheduleWithCategoryAndRecurrence = {
  schedules: ScheduleRow;
  categories: CategoryRow | null;
  recurrence_rules: RecurrenceRuleRow | null;
};

export const createScheduleRepo = (db: Database): ScheduleRepo => ({
  findAllByUserId: async (userId) => {
    const rows = await db
      .select()
      .from(schedules)
      .leftJoin(categories, eq(schedules.categoryId, categories.id))
      .leftJoin(recurrenceRules, eq(schedules.id, recurrenceRules.scheduleId))
      .where(eq(schedules.userId, userId))
      .orderBy(schedules.startAt);
    return rows.map(toScheduleWithCategoryAndRecurrence);
  },

  findByMonthAndUserId: async (year: number, month: number, userId: string) => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const rows = await db
      .select()
      .from(schedules)
      .leftJoin(categories, eq(schedules.categoryId, categories.id))
      .leftJoin(recurrenceRules, eq(schedules.id, recurrenceRules.scheduleId))
      .where(
        and(
          eq(schedules.userId, userId),
          gte(schedules.startAt, startDate),
          lt(schedules.startAt, endDate)
        )
      )
      .orderBy(schedules.startAt);

    return rows.map(toScheduleWithCategoryAndRecurrence);
  },

  findById: async (id) => {
    const rows = await db
      .select()
      .from(schedules)
      .leftJoin(categories, eq(schedules.categoryId, categories.id))
      .leftJoin(recurrenceRules, eq(schedules.id, recurrenceRules.scheduleId))
      .where(eq(schedules.id, id));
    return rows[0] ? toScheduleWithCategoryAndRecurrence(rows[0]) : null;
  },

  findByIdAndUserId: async (id, userId) => {
    const rows = await db
      .select()
      .from(schedules)
      .leftJoin(categories, eq(schedules.categoryId, categories.id))
      .leftJoin(recurrenceRules, eq(schedules.id, recurrenceRules.scheduleId))
      .where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
    return rows[0] ? toScheduleWithCategoryAndRecurrence(rows[0]) : null;
  },

  search: async (userId, options) => {
    const conditions = [eq(schedules.userId, userId)];

    // 日付範囲フィルタ
    if (options.startDate) {
      conditions.push(gte(schedules.startAt, `${options.startDate}T00:00:00`));
    }
    if (options.endDate) {
      conditions.push(lte(schedules.startAt, `${options.endDate}T23:59:59`));
    }

    // カテゴリフィルタ
    if (options.categoryId) {
      conditions.push(eq(schedules.categoryId, options.categoryId));
    }

    // テキスト検索（タイトルまたはメモ）
    if (options.query) {
      const queryPattern = `%${options.query}%`;
      // JOINでsupplementsのuserMemoも検索
      const rows = await db
        .select({
          schedules,
          categories,
          userMemo: scheduleSupplements.userMemo,
        })
        .from(schedules)
        .leftJoin(categories, eq(schedules.categoryId, categories.id))
        .leftJoin(scheduleSupplements, eq(schedules.id, scheduleSupplements.scheduleId))
        .where(
          and(
            ...conditions,
            or(
              like(schedules.title, queryPattern),
              like(scheduleSupplements.userMemo, queryPattern)
            )
          )
        )
        .orderBy(schedules.startAt);

      return rows.map((row) => ({
        id: row.schedules.id,
        userId: row.schedules.userId,
        title: row.schedules.title,
        startAt: row.schedules.startAt,
        endAt: row.schedules.endAt,
        isAllDay: row.schedules.isAllDay,
        categoryId: row.schedules.categoryId,
        category: row.categories ? {
          id: row.categories.id,
          name: row.categories.name,
          color: row.categories.color,
          createdAt: row.categories.createdAt,
          updatedAt: row.categories.updatedAt,
        } : null,
        recurrence: null, // 検索ではrecurrenceをJOINしていない
        createdAt: row.schedules.createdAt,
        updatedAt: row.schedules.updatedAt,
      }));
    }

    // テキスト検索なしの場合
    const rows = await db
      .select()
      .from(schedules)
      .leftJoin(categories, eq(schedules.categoryId, categories.id))
      .leftJoin(recurrenceRules, eq(schedules.id, recurrenceRules.scheduleId))
      .where(and(...conditions))
      .orderBy(schedules.startAt);

    return rows.map(toScheduleWithCategoryAndRecurrence);
  },

  save: async (schedule) => {
    await db.insert(schedules).values(toRow(schedule));
  },

  update: async (schedule) => {
    await db
      .update(schedules)
      .set(toRow(schedule))
      .where(eq(schedules.id, schedule.id));
  },

  delete: async (id) => {
    await db.delete(schedules).where(eq(schedules.id, id));
  },
});

// Row with Category and Recurrence → Entity 変換
const toScheduleWithCategoryAndRecurrence = (row: ScheduleWithCategoryAndRecurrence): ScheduleEntity => ({
  id: row.schedules.id,
  userId: row.schedules.userId,
  title: row.schedules.title,
  startAt: row.schedules.startAt,
  endAt: row.schedules.endAt,
  isAllDay: row.schedules.isAllDay,
  categoryId: row.schedules.categoryId,
  category: row.categories ? {
    id: row.categories.id,
    name: row.categories.name,
    color: row.categories.color,
    createdAt: row.categories.createdAt,
    updatedAt: row.categories.updatedAt,
  } : null,
  recurrence: row.recurrence_rules ? {
    id: row.recurrence_rules.id,
    scheduleId: row.recurrence_rules.scheduleId,
    frequency: row.recurrence_rules.frequency as Frequency,
    interval: row.recurrence_rules.intervalValue,
    daysOfWeek: row.recurrence_rules.daysOfWeek ? JSON.parse(row.recurrence_rules.daysOfWeek) as DayOfWeek[] : null,
    dayOfMonth: row.recurrence_rules.dayOfMonth,
    weekOfMonth: row.recurrence_rules.weekOfMonth,
    endType: row.recurrence_rules.endType as EndType,
    endDate: row.recurrence_rules.endDate,
    endCount: row.recurrence_rules.endCount,
    createdAt: row.recurrence_rules.createdAt,
    updatedAt: row.recurrence_rules.updatedAt,
  } : null,
  createdAt: row.schedules.createdAt,
  updatedAt: row.schedules.updatedAt,
});

// Entity → Row 変換
const toRow = (schedule: ScheduleEntity): ScheduleRow => ({
  id: schedule.id,
  userId: schedule.userId,
  categoryId: schedule.categoryId ?? null,
  title: schedule.title,
  startAt: schedule.startAt,
  endAt: schedule.endAt,
  isAllDay: schedule.isAllDay,
  createdAt: schedule.createdAt,
  updatedAt: schedule.updatedAt,
});
