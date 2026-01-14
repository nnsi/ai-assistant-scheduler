import {
  type AgentType,
  type ShopList,
  agentTypeSchema,
  shopListSchema,
} from "@ai-scheduler/shared";
import { eq } from "drizzle-orm";
import type { SupplementRepo } from "../../domain/infra/supplementRepo";
import type { Supplement } from "../../domain/model/supplement";
import { logger } from "../../shared/logger";
import type { Database } from "./client";
import { type SupplementRow, scheduleSupplements } from "./schema";

export const createSupplementRepo = (db: Database): SupplementRepo => ({
  findByScheduleId: async (scheduleId) => {
    const rows = await db
      .select()
      .from(scheduleSupplements)
      .where(eq(scheduleSupplements.scheduleId, scheduleId));
    return rows[0] ? toSupplement(rows[0]) : null;
  },

  save: async (supplement) => {
    await db.insert(scheduleSupplements).values(toRow(supplement));
  },

  update: async (supplement) => {
    await db
      .update(scheduleSupplements)
      .set(toRow(supplement))
      .where(eq(scheduleSupplements.id, supplement.id));
  },

  delete: async (scheduleId) => {
    await db.delete(scheduleSupplements).where(eq(scheduleSupplements.scheduleId, scheduleId));
  },
});

// JSON文字列を安全にパースする
const safeParseJsonArray = (jsonString: string | null): string[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    logger.warn("Failed to parse keywords JSON", { category: "database", jsonString });
    return [];
  }
};

// shopCandidatesをパースする
const parseShopCandidates = (jsonString: string | null): ShopList | null => {
  if (!jsonString) return null;
  try {
    const parsed = JSON.parse(jsonString);
    const result = shopListSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    logger.warn("Failed to validate shop candidates", {
      category: "database",
      error: result.error.message,
    });
    return null;
  } catch {
    logger.warn("Failed to parse shop candidates JSON", { category: "database", jsonString });
    return null;
  }
};

// selectedShopsをパースする（shopCandidatesと同じ形式）
const parseSelectedShops = (jsonString: string | null): ShopList | null => {
  if (!jsonString) return null;
  try {
    const parsed = JSON.parse(jsonString);
    const result = shopListSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    logger.warn("Failed to validate selected shops", {
      category: "database",
      error: result.error.message,
    });
    return null;
  } catch {
    logger.warn("Failed to parse selected shops JSON", { category: "database", jsonString });
    return null;
  }
};

// agentTypesをパースする
const parseAgentTypes = (jsonString: string | null): AgentType[] | null => {
  if (!jsonString) return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return null;
    const validTypes: AgentType[] = [];
    for (const item of parsed) {
      const result = agentTypeSchema.safeParse(item);
      if (result.success) {
        validTypes.push(result.data);
      }
    }
    return validTypes.length > 0 ? validTypes : null;
  } catch {
    logger.warn("Failed to parse agent types JSON", { category: "database", jsonString });
    return null;
  }
};

// Row → Entity 変換
const toSupplement = (row: SupplementRow): Supplement => ({
  id: row.id,
  scheduleId: row.scheduleId,
  keywords: safeParseJsonArray(row.keywords),
  agentTypes: parseAgentTypes(row.agentTypes),
  aiResult: row.aiResult,
  shopCandidates: parseShopCandidates(row.shopCandidates),
  selectedShops: parseSelectedShops(row.selectedShops),
  userMemo: row.userMemo,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (supplement: Supplement): SupplementRow => ({
  id: supplement.id,
  scheduleId: supplement.scheduleId,
  keywords: JSON.stringify(supplement.keywords),
  agentTypes: supplement.agentTypes ? JSON.stringify(supplement.agentTypes) : null,
  aiResult: supplement.aiResult,
  shopCandidates: supplement.shopCandidates ? JSON.stringify(supplement.shopCandidates) : null,
  selectedShops: supplement.selectedShops ? JSON.stringify(supplement.selectedShops) : null,
  userMemo: supplement.userMemo,
  createdAt: supplement.createdAt,
  updatedAt: supplement.updatedAt,
});
