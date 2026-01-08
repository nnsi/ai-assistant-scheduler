import { z } from "zod";

// カレンダーロール
export const calendarRoleSchema = z.enum(["owner", "admin", "editor", "viewer"]);
export type CalendarRole = z.infer<typeof calendarRoleSchema>;

export const memberRoleSchema = z.enum(["admin", "editor", "viewer"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const invitationRoleSchema = z.enum(["editor", "viewer"]);
export type InvitationRole = z.infer<typeof invitationRoleSchema>;

// カレンダー作成入力
export const createCalendarInputSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});
export type CreateCalendarInput = z.infer<typeof createCalendarInputSchema>;

// カレンダー更新入力
export const updateCalendarInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});
export type UpdateCalendarInput = z.infer<typeof updateCalendarInputSchema>;

// カレンダーオーナー情報
export const calendarOwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  picture: z.string().nullable(),
});
export type CalendarOwner = z.infer<typeof calendarOwnerSchema>;

// カレンダーレスポンス
export const calendarResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  role: calendarRoleSchema,
  memberCount: z.number(),
  owner: calendarOwnerSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CalendarResponse = z.infer<typeof calendarResponseSchema>;

// メンバーユーザー情報
export const memberUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  picture: z.string().nullable(),
});
export type MemberUser = z.infer<typeof memberUserSchema>;

// カレンダーメンバーレスポンス
export const calendarMemberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: calendarRoleSchema, // オーナー含む
  user: memberUserSchema,
  invitedBy: z.string().nullable(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type CalendarMemberResponse = z.infer<typeof calendarMemberResponseSchema>;

// メンバー追加入力
export const addMemberInputSchema = z.object({
  email: z.string().email(),
  role: memberRoleSchema,
});
export type AddMemberInput = z.infer<typeof addMemberInputSchema>;

// メンバー権限更新入力
export const updateMemberRoleInputSchema = z.object({
  role: memberRoleSchema,
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleInputSchema>;

// 招待リンク作成入力
export const createInvitationInputSchema = z.object({
  role: invitationRoleSchema,
  expiresInDays: z.number().min(1).max(30).default(7),
  maxUses: z.number().min(1).max(100).nullable().optional(),
});
export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;

// 招待リンク作成レスポンス
export const createInvitationResponseSchema = z.object({
  id: z.string(),
  token: z.string(),
  url: z.string(),
  role: invitationRoleSchema,
  expiresAt: z.string(),
  maxUses: z.number().nullable(),
});
export type CreateInvitationResponse = z.infer<typeof createInvitationResponseSchema>;

// 招待リンク一覧アイテムレスポンス
export const invitationListItemResponseSchema = z.object({
  id: z.string(),
  tokenPreview: z.string(),
  role: invitationRoleSchema,
  expiresAt: z.string(),
  maxUses: z.number().nullable(),
  useCount: z.number(),
  createdAt: z.string(),
});
export type InvitationListItemResponse = z.infer<typeof invitationListItemResponseSchema>;

// 招待リンク情報取得レスポンス（公開用）
export const invitationInfoResponseSchema = z.object({
  calendarName: z.string(),
  calendarColor: z.string(),
  role: invitationRoleSchema,
  expiresAt: z.string(),
  ownerName: z.string(),
});
export type InvitationInfoResponse = z.infer<typeof invitationInfoResponseSchema>;

// オーナー移譲入力
export const transferOwnershipInputSchema = z.object({
  newOwnerId: z.string(),
});
export type TransferOwnershipInput = z.infer<typeof transferOwnershipInputSchema>;
