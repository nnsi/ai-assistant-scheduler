import { eq, and, isNull } from "drizzle-orm";
import type { Database } from "./client";
import { calendars, calendarMembers, type CalendarRow } from "./schema";
import type { CalendarRepo } from "../../domain/infra/calendarRepo";
import type { CalendarEntity } from "../../domain/model/calendar";

export const createCalendarRepo = (db: Database): CalendarRepo => ({
  create: async (calendar) => {
    await db.insert(calendars).values(toRow(calendar));
  },

  findById: async (id) => {
    const rows = await db
      .select()
      .from(calendars)
      .where(eq(calendars.id, id));
    return rows[0] ? toCalendar(rows[0]) : null;
  },

  findByUserId: async (userId) => {
    // オーナーのカレンダー、または共有されたカレンダーを取得
    // ソフトデリートされていないカレンダーのみ
    const ownerCalendars = await db
      .select()
      .from(calendars)
      .where(and(eq(calendars.ownerId, userId), isNull(calendars.deletedAt)));

    const memberCalendars = await db
      .select({ calendar: calendars })
      .from(calendarMembers)
      .innerJoin(calendars, eq(calendarMembers.calendarId, calendars.id))
      .where(
        and(
          eq(calendarMembers.userId, userId),
          isNull(calendars.deletedAt)
        )
      );

    const allCalendars = [
      ...ownerCalendars.map(toCalendar),
      ...memberCalendars.map((r) => toCalendar(r.calendar)),
    ];

    // 重複を除去（IDで）
    const uniqueCalendars = allCalendars.reduce<CalendarEntity[]>((acc, cal) => {
      if (!acc.find((c) => c.id === cal.id)) {
        acc.push(cal);
      }
      return acc;
    }, []);

    return uniqueCalendars;
  },

  findDefaultByUserId: async (userId) => {
    // ユーザーが所有する最初のカレンダーをデフォルトとして返す
    const rows = await db
      .select()
      .from(calendars)
      .where(and(eq(calendars.ownerId, userId), isNull(calendars.deletedAt)))
      .orderBy(calendars.createdAt)
      .limit(1);
    return rows[0] ? toCalendar(rows[0]) : null;
  },

  update: async (calendar) => {
    await db
      .update(calendars)
      .set(toRow(calendar))
      .where(eq(calendars.id, calendar.id));
  },

  delete: async (id) => {
    await db.delete(calendars).where(eq(calendars.id, id));
  },
});

// Row → Entity 変換
const toCalendar = (row: CalendarRow): CalendarEntity => ({
  id: row.id,
  ownerId: row.ownerId,
  name: row.name,
  color: row.color,
  deletedAt: row.deletedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (calendar: CalendarEntity): CalendarRow => ({
  id: calendar.id,
  ownerId: calendar.ownerId,
  name: calendar.name,
  color: calendar.color,
  deletedAt: calendar.deletedAt,
  createdAt: calendar.createdAt,
  updatedAt: calendar.updatedAt,
});
