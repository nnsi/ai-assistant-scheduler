import type { CalendarEntity } from "../model/calendar";

export type CalendarRepo = {
  create: (calendar: CalendarEntity) => Promise<void>;
  findById: (id: string) => Promise<CalendarEntity | null>;
  findByUserId: (userId: string) => Promise<CalendarEntity[]>;
  findDefaultByUserId: (userId: string) => Promise<CalendarEntity | null>;
  update: (calendar: CalendarEntity) => Promise<void>;
  delete: (id: string) => Promise<void>;
};
