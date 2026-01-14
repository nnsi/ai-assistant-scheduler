import { z } from "zod";

// 曜日定数
export const DAYS_OF_WEEK = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// 繰り返し頻度
export const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

// 終了タイプ
export const END_TYPES = ["never", "date", "count"] as const;
export type EndType = (typeof END_TYPES)[number];

// 繰り返しルール入力スキーマ
export const createRecurrenceRuleInputSchema = z
  .object({
    frequency: z.enum(FREQUENCIES),
    interval: z.number().int().min(1).max(99).default(1),
    daysOfWeek: z.array(z.enum(DAYS_OF_WEEK)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    weekOfMonth: z.number().int().min(-1).max(5).optional(),
    endType: z.enum(END_TYPES).default("never"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endCount: z.number().int().min(1).max(999).optional(),
  })
  .superRefine((data, ctx) => {
    // endType が 'date' の場合は endDate が必須
    if (data.endType === "date" && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "終了日を指定してください",
        path: ["endDate"],
      });
    }
    // endType が 'count' の場合は endCount が必須
    if (data.endType === "count" && !data.endCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "終了回数を指定してください",
        path: ["endCount"],
      });
    }
    // weekly の場合は daysOfWeek が必須
    if (data.frequency === "weekly" && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "曜日を1つ以上選択してください",
        path: ["daysOfWeek"],
      });
    }
  });

export type CreateRecurrenceRuleInput = z.infer<typeof createRecurrenceRuleInputSchema>;

// 更新スキーマ
export const updateRecurrenceRuleInputSchema = z.object({
  frequency: z.enum(FREQUENCIES).optional(),
  interval: z.number().int().min(1).max(99).optional(),
  daysOfWeek: z.array(z.enum(DAYS_OF_WEEK)).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  weekOfMonth: z.number().int().min(-1).max(5).nullable().optional(),
  endType: z.enum(END_TYPES).optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  endCount: z.number().int().min(1).max(999).nullable().optional(),
});

export type UpdateRecurrenceRuleInput = z.infer<typeof updateRecurrenceRuleInputSchema>;

// 繰り返しルールエンティティスキーマ
export const recurrenceRuleSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  frequency: z.enum(FREQUENCIES),
  interval: z.number(),
  daysOfWeek: z.array(z.enum(DAYS_OF_WEEK)).nullable(),
  dayOfMonth: z.number().nullable(),
  weekOfMonth: z.number().nullable(),
  endType: z.enum(END_TYPES),
  endDate: z.string().nullable(),
  endCount: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;

// 曜日ラベル（日本語）
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  SU: "日",
  MO: "月",
  TU: "火",
  WE: "水",
  TH: "木",
  FR: "金",
  SA: "土",
};

// 頻度ラベル（日本語）
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "毎日",
  weekly: "毎週",
  monthly: "毎月",
  yearly: "毎年",
};
