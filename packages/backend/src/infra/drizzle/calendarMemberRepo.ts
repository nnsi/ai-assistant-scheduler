import { eq, and } from "drizzle-orm";
import type { Database } from "./client";
import { calendarMembers, users, type CalendarMemberRow } from "./schema";
import type { CalendarMemberRepo } from "../../domain/infra/calendarMemberRepo";
import type { CalendarMemberEntity, MemberRole } from "../../domain/model/calendar";

export const createCalendarMemberRepo = (db: Database): CalendarMemberRepo => ({
  create: async (member) => {
    await db.insert(calendarMembers).values(toRow(member));
  },

  findByCalendarId: async (calendarId) => {
    const rows = await db
      .select({
        member: calendarMembers,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          picture: users.picture,
        },
      })
      .from(calendarMembers)
      .innerJoin(users, eq(calendarMembers.userId, users.id))
      .where(eq(calendarMembers.calendarId, calendarId));

    return rows.map((row) => ({
      ...toMember(row.member),
      user: row.user,
    }));
  },

  findByUserIdAndCalendarId: async (userId, calendarId) => {
    const rows = await db
      .select()
      .from(calendarMembers)
      .where(
        and(
          eq(calendarMembers.userId, userId),
          eq(calendarMembers.calendarId, calendarId)
        )
      );
    return rows[0] ? toMember(rows[0]) : null;
  },

  findByUserId: async (userId) => {
    const rows = await db
      .select()
      .from(calendarMembers)
      .where(eq(calendarMembers.userId, userId));
    return rows.map(toMember);
  },

  updateRole: async (id, role) => {
    const now = new Date().toISOString();
    await db
      .update(calendarMembers)
      .set({ role, updatedAt: now })
      .where(eq(calendarMembers.id, id));
  },

  delete: async (id) => {
    await db.delete(calendarMembers).where(eq(calendarMembers.id, id));
  },

  deleteByUserIdAndCalendarId: async (userId, calendarId) => {
    await db
      .delete(calendarMembers)
      .where(
        and(
          eq(calendarMembers.userId, userId),
          eq(calendarMembers.calendarId, calendarId)
        )
      );
  },
});

// Row → Entity 変換
const toMember = (row: CalendarMemberRow): CalendarMemberEntity => ({
  id: row.id,
  calendarId: row.calendarId,
  userId: row.userId,
  role: row.role as MemberRole,
  invitedBy: row.invitedBy,
  acceptedAt: row.acceptedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (member: CalendarMemberEntity): CalendarMemberRow => ({
  id: member.id,
  calendarId: member.calendarId,
  userId: member.userId,
  role: member.role,
  invitedBy: member.invitedBy,
  acceptedAt: member.acceptedAt,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
});
