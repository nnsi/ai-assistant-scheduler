import type { DayOfWeek, EndType, Frequency } from "@ai-scheduler/shared";
import { eq, inArray } from "drizzle-orm";
import type { RecurrenceRepo } from "../../domain/infra/recurrenceRepo";
import type { RecurrenceRuleEntity } from "../../domain/model/recurrence";
import type { Database } from "./client";
import { type RecurrenceRuleRow, recurrenceRules } from "./schema";

export const createRecurrenceRepo = (db: Database): RecurrenceRepo => ({
  findByScheduleId: async (scheduleId) => {
    const rows = await db
      .select()
      .from(recurrenceRules)
      .where(eq(recurrenceRules.scheduleId, scheduleId));
    return rows[0] ? toEntity(rows[0]) : null;
  },

  findByScheduleIds: async (scheduleIds) => {
    if (scheduleIds.length === 0) return [];
    const rows = await db
      .select()
      .from(recurrenceRules)
      .where(inArray(recurrenceRules.scheduleId, scheduleIds));
    return rows.map(toEntity);
  },

  save: async (rule) => {
    await db.insert(recurrenceRules).values(toRow(rule));
  },

  update: async (rule) => {
    await db.update(recurrenceRules).set(toRow(rule)).where(eq(recurrenceRules.id, rule.id));
  },

  delete: async (id) => {
    await db.delete(recurrenceRules).where(eq(recurrenceRules.id, id));
  },

  deleteByScheduleId: async (scheduleId) => {
    await db.delete(recurrenceRules).where(eq(recurrenceRules.scheduleId, scheduleId));
  },
});

// Row → Entity 変換
const toEntity = (row: RecurrenceRuleRow): RecurrenceRuleEntity => ({
  id: row.id,
  scheduleId: row.scheduleId,
  frequency: row.frequency as Frequency,
  interval: row.intervalValue,
  daysOfWeek: row.daysOfWeek ? (JSON.parse(row.daysOfWeek) as DayOfWeek[]) : null,
  dayOfMonth: row.dayOfMonth,
  weekOfMonth: row.weekOfMonth,
  endType: row.endType as EndType,
  endDate: row.endDate,
  endCount: row.endCount,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (entity: RecurrenceRuleEntity): RecurrenceRuleRow => ({
  id: entity.id,
  scheduleId: entity.scheduleId,
  frequency: entity.frequency,
  intervalValue: entity.interval,
  daysOfWeek: entity.daysOfWeek ? JSON.stringify(entity.daysOfWeek) : null,
  dayOfMonth: entity.dayOfMonth,
  weekOfMonth: entity.weekOfMonth,
  endType: entity.endType,
  endDate: entity.endDate,
  endCount: entity.endCount,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});
