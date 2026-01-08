import { eq, and, gt, or, isNull, lt, sql } from "drizzle-orm";
import type { Database } from "./client";
import { calendarInvitations, type CalendarInvitationRow } from "./schema";
import type { CalendarInvitationRepo } from "../../domain/infra/calendarInvitationRepo";
import type { CalendarInvitationEntity } from "../../domain/model/calendar";

export const createCalendarInvitationRepo = (
  db: Database
): CalendarInvitationRepo => ({
  create: async (invitation) => {
    await db.insert(calendarInvitations).values(toRow(invitation));
  },

  findByToken: async (token) => {
    const now = new Date().toISOString();
    const rows = await db
      .select()
      .from(calendarInvitations)
      .where(
        and(
          eq(calendarInvitations.token, token),
          gt(calendarInvitations.expiresAt, now),
          or(
            isNull(calendarInvitations.maxUses),
            lt(calendarInvitations.useCount, calendarInvitations.maxUses)
          )
        )
      );
    return rows[0] ? toInvitation(rows[0]) : null;
  },

  findById: async (id) => {
    const rows = await db
      .select()
      .from(calendarInvitations)
      .where(eq(calendarInvitations.id, id));
    return rows[0] ? toInvitation(rows[0]) : null;
  },

  findByCalendarId: async (calendarId) => {
    const rows = await db
      .select()
      .from(calendarInvitations)
      .where(eq(calendarInvitations.calendarId, calendarId))
      .orderBy(calendarInvitations.createdAt);
    return rows.map(toInvitation);
  },

  incrementUseCount: async (token) => {
    const now = new Date().toISOString();
    // 原子的UPDATE: use_countをインクリメントしつつmax_usesを超えないことを保証
    const result = await db
      .update(calendarInvitations)
      .set({ useCount: sql`${calendarInvitations.useCount} + 1` })
      .where(
        and(
          eq(calendarInvitations.token, token),
          gt(calendarInvitations.expiresAt, now),
          or(
            isNull(calendarInvitations.maxUses),
            lt(calendarInvitations.useCount, calendarInvitations.maxUses)
          )
        )
      )
      .returning();
    return result[0] ? toInvitation(result[0]) : null;
  },

  delete: async (id) => {
    await db
      .delete(calendarInvitations)
      .where(eq(calendarInvitations.id, id));
  },
});

// Row → Entity 変換
const toInvitation = (row: CalendarInvitationRow): CalendarInvitationEntity => ({
  id: row.id,
  calendarId: row.calendarId,
  token: row.token,
  role: row.role as "editor" | "viewer",
  expiresAt: row.expiresAt,
  maxUses: row.maxUses,
  useCount: row.useCount,
  createdBy: row.createdBy,
  createdAt: row.createdAt,
});

// Entity → Row 変換
const toRow = (
  invitation: CalendarInvitationEntity
): CalendarInvitationRow => ({
  id: invitation.id,
  calendarId: invitation.calendarId,
  token: invitation.token,
  role: invitation.role,
  expiresAt: invitation.expiresAt,
  maxUses: invitation.maxUses,
  useCount: invitation.useCount,
  createdBy: invitation.createdBy,
  createdAt: invitation.createdAt,
});
