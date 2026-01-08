import type { CalendarInvitationEntity } from "../model/calendar";

export type CalendarInvitationRepo = {
  create: (invitation: CalendarInvitationEntity) => Promise<void>;
  findByToken: (token: string) => Promise<CalendarInvitationEntity | null>;
  findById: (id: string) => Promise<CalendarInvitationEntity | null>;
  findByCalendarId: (calendarId: string) => Promise<CalendarInvitationEntity[]>;
  incrementUseCount: (token: string) => Promise<CalendarInvitationEntity | null>;
  delete: (id: string) => Promise<void>;
};
