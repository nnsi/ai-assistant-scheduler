import { generateId } from "../../shared/id";

// ロール定義
export type CalendarRole = "owner" | "admin" | "editor" | "viewer";
export type MemberRole = "admin" | "editor" | "viewer"; // calendar_membersで使用するロール

// カレンダーエンティティ
export type CalendarEntity = {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// カレンダーメンバーエンティティ
export type CalendarMemberEntity = {
  id: string;
  calendarId: string;
  userId: string;
  role: MemberRole;
  invitedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// 招待リンクエンティティ
export type CalendarInvitationEntity = {
  id: string;
  calendarId: string;
  token: string;
  role: "editor" | "viewer";
  expiresAt: string;
  maxUses: number | null;
  useCount: number;
  createdBy: string;
  createdAt: string;
};

// カレンダー作成入力
export type CreateCalendarInput = {
  name: string;
  color?: string;
};

// カレンダー更新入力
export type UpdateCalendarInput = {
  name?: string;
  color?: string;
};

// ファクトリ関数
export const createCalendar = (
  input: CreateCalendarInput,
  ownerId: string
): CalendarEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    ownerId,
    name: input.name,
    color: input.color ?? "#3B82F6",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

// カレンダー更新関数
export const updateCalendar = (
  calendar: CalendarEntity,
  input: UpdateCalendarInput
): CalendarEntity => {
  return {
    ...calendar,
    name: input.name ?? calendar.name,
    color: input.color ?? calendar.color,
    updatedAt: new Date().toISOString(),
  };
};

// ソフトデリート
export const softDeleteCalendar = (calendar: CalendarEntity): CalendarEntity => {
  return {
    ...calendar,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// メンバー作成
export const createCalendarMember = (
  calendarId: string,
  userId: string,
  role: MemberRole,
  invitedBy: string | null,
  accepted: boolean = false
): CalendarMemberEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    calendarId,
    userId,
    role,
    invitedBy,
    acceptedAt: accepted ? now : null,
    createdAt: now,
    updatedAt: now,
  };
};

// 権限チェックヘルパー
const roleHierarchy: Record<CalendarRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const hasRequiredRole = (
  userRole: CalendarRole,
  required: CalendarRole
): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[required];
};

export const canEdit = (role: CalendarRole): boolean =>
  hasRequiredRole(role, "editor");

export const canManageMembers = (role: CalendarRole): boolean =>
  hasRequiredRole(role, "admin");

export const isOwner = (role: CalendarRole): boolean => role === "owner";
