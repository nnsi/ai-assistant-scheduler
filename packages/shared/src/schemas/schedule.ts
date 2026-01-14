import { z } from "zod";
import { categorySchema } from "./category";
import { recurrenceRuleSchema } from "./recurrence";
import { shopListSchema } from "./shop";

// 入力スキーマ
export const createScheduleInputSchema = z
  .object({
    title: z.string().min(1, "タイトルは必須です").max(100, "タイトルは100文字以内です"),
    startAt: z.string().datetime({ offset: true, message: "有効な日時形式で入力してください" }),
    endAt: z.string().datetime({ offset: true }).optional(),
    isAllDay: z.boolean().optional(),
    categoryId: z.string().optional(),
    calendarId: z.string().optional(), // 省略時はデフォルトカレンダー
    // AI検索結果（オプショナル）
    keywords: z
      .array(z.string().max(50, "キーワードは50文字以内です"))
      .max(10, "キーワードは10個以内です")
      .optional(),
    aiResult: z.string().max(10000, "AI結果は10000文字以内です").optional(),
    userMemo: z.string().max(10000, "メモは10000文字以内です").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endAt && data.startAt > data.endAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "終了日時は開始日時より後である必要があります",
        path: ["endAt"],
      });
    }
  });

export type CreateScheduleInput = z.infer<typeof createScheduleInputSchema>;

export const updateScheduleInputSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  isAllDay: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleInputSchema>;

// エンティティスキーマ
export const scheduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.string(),
  endAt: z.string().nullable(),
  isAllDay: z.boolean(),
  calendarId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  category: categorySchema.nullable().optional(),
  recurrence: recurrenceRuleSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Schedule = z.infer<typeof scheduleSchema>;

// 補足情報付きスケジュール
export const scheduleWithSupplementSchema = scheduleSchema.extend({
  supplement: z
    .object({
      id: z.string(),
      keywords: z.array(z.string()),
      aiResult: z.string().nullable(),
      shopCandidates: shopListSchema.nullable(),
      selectedShops: shopListSchema.nullable(),
      userMemo: z.string().nullable(),
    })
    .nullable(),
});

export type ScheduleWithSupplement = z.infer<typeof scheduleWithSupplementSchema>;

// 検索スキーマ
export const searchScheduleInputSchema = z.object({
  query: z.string().max(100, "検索クエリは100文字以内です").optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で入力してください")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で入力してください")
    .optional(),
  categoryId: z.string().optional(),
  calendarId: z.string().optional(), // カレンダーIDでフィルタ
});

export type SearchScheduleInput = z.infer<typeof searchScheduleInputSchema>;
