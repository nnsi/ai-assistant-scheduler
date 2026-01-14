import { z } from "zod";

// お店の情報スキーマ
export const shopSchema = z.object({
  name: z.string(),
  summary: z.string().optional(), // 一言説明
  businessHours: z.string().optional(), // 営業時間
  closedDays: z.string().optional(), // 定休日
  address: z.string().optional(), // 住所
  urls: z
    .object({
      official: z.string().url().optional(), // 公式サイト
      reservation: z.string().url().optional(), // 予約サイト
      tabelog: z.string().url().optional(), // 食べログ
      googleMap: z.string().url().optional(), // Googleマップ
    })
    .optional(),
  conditionChecks: z
    .object({
      required: z.string().optional(), // 必須条件の判定結果
      preferred: z.string().optional(), // 優先条件の判定結果
      subjective: z.string().optional(), // 重視ポイントの判定結果
    })
    .optional(),
});

export type Shop = z.infer<typeof shopSchema>;

// お店リストのスキーマ
export const shopListSchema = z.array(shopSchema);
export type ShopList = z.infer<typeof shopListSchema>;
