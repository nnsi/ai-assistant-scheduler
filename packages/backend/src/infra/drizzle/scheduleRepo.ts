import { eq, and, gte, lt } from "drizzle-orm";
import type { Database } from "./client";
import { schedules, type ScheduleRow } from "./schema";
import type { ScheduleRepo } from "../../domain/infra/scheduleRepo";
import type { Schedule } from "../../domain/model/schedule";

export const createScheduleRepo = (db: Database): ScheduleRepo => ({
  findAll: async () => {
    const rows = await db.select().from(schedules).orderBy(schedules.startAt);
    return rows.map(toSchedule);
  },

  findByMonth: async (year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const rows = await db
      .select()
      .from(schedules)
      .where(and(gte(schedules.startAt, startDate), lt(schedules.startAt, endDate)))
      .orderBy(schedules.startAt);

    return rows.map(toSchedule);
  },

  findById: async (id) => {
    const rows = await db.select().from(schedules).where(eq(schedules.id, id));
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
const toSchedule = (row: ScheduleRow): Schedule => ({
  id: row.id,
  title: row.title,
  startAt: row.startAt,
  endAt: row.endAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (schedule: Schedule): ScheduleRow => ({
  id: schedule.id,
  title: schedule.title,
  startAt: schedule.startAt,
  endAt: schedule.endAt,
  createdAt: schedule.createdAt,
  updatedAt: schedule.updatedAt,
});
