import type { Shop, AgentType } from "@ai-scheduler/shared";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import { createSupplement } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createDatabaseError } from "../../../shared/errors";

export const createSaveSupplementUseCase = (supplementRepo: SupplementRepo) => {
  return async (
    scheduleId: string,
    keywords: string[],
    aiResult: string,
    shopCandidates?: Shop[],
    agentTypes?: AgentType[]
  ): Promise<Result<void>> => {
    try {
      const supplement = createSupplement({
        scheduleId,
        keywords,
        agentTypes,
        aiResult,
        shopCandidates,
      });
      await supplementRepo.save(supplement);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type SaveSupplementUseCase = ReturnType<typeof createSaveSupplementUseCase>;
