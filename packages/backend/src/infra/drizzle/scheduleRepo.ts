import { eq, and, gte, lt } from "drizzle-orm";
import type { Database } from "./client";
import { schedules, type ScheduleRow } from "./schema";
import type { ScheduleRepo } from "../../domain/infra/scheduleRepo";
import type { ScheduleEntity } from "../../domain/model/schedule";

export const createScheduleRepo = (db: Database): ScheduleRepo => ({
  findAllByUserId: async (userId) => {
    const rows = await db
      .select()
      .from(schedules)
      .where(eq(schedules.userId, userId))
      .orderBy(schedules.startAt);
    return rows.map(toSchedule);
  },

  findByMonthAndUserId: async (year: number, month: number, userId: string) => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const rows = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.userId, userId),
          gte(schedules.startAt, startDate),
          lt(schedules.startAt, endDate)
        )
      )
      .orderBy(schedules.startAt);

    return rows.map(toSchedule);
  },

  findById: async (id) => {
    const rows = await db.select().from(schedules).where(eq(schedules.id, id));
    return rows[0] ? toSchedule(rows[0]) : null;
  },

  findByIdAndUserId: async (id, userId) => {
    const rows = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
    return rows[0] ? toSchedule(rows[0]) : null;
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

// Row → Entity 変換
const toSchedule = (row: ScheduleRow): ScheduleEntity => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  startAt: row.startAt,
  endAt: row.endAt,
  isAllDay: row.isAllDay,
  categoryId: row.categoryId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
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
