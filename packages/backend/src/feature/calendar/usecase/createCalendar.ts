import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import {
  createCalendar as createCalendarEntity,
  type CreateCalendarInput,
} from "../../../domain/model/calendar";
import type { CalendarResponse } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import { createDatabaseError } from "../../../shared/errors";

export const createCreateCalendarUseCase = (
  calendarRepo: CalendarRepo,
  userRepo: UserRepo
) => {
  return async (
    input: CreateCalendarInput,
    userId: string
  ): Promise<Result<CalendarResponse>> => {
    try {
      const user = await userRepo.findById(userId);
      if (!user) {
        return err(createDatabaseError("ユーザーが見つかりません"));
      }

      const calendar = createCalendarEntity(input, userId);
      await calendarRepo.create(calendar);

      // メンバー数を取得（オーナーを含むため1）
      const memberCount = 1;

      const response: CalendarResponse = {
        id: calendar.id,
        name: calendar.name,
        color: calendar.color,
        role: "owner",
        memberCount,
        owner: {
          id: user.id,
          name: user.name,
          picture: user.picture,
        },
        createdAt: calendar.createdAt,
        updatedAt: calendar.updatedAt,
      };

      return ok(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type CreateCalendarUseCase = ReturnType<typeof createCreateCalendarUseCase>;
