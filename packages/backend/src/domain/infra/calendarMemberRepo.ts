import type { CalendarMemberEntity, MemberRole } from "../model/calendar";

export type CalendarMemberWithUser = CalendarMemberEntity & {
  user: {
    id: string;
    name: string;
    email: string;
    picture: string | null;
  };
};

export type CalendarMemberRepo = {
  create: (member: CalendarMemberEntity) => Promise<void>;
  findByCalendarId: (calendarId: string) => Promise<CalendarMemberWithUser[]>;
  findByUserIdAndCalendarId: (
    userId: string,
    calendarId: string
  ) => Promise<CalendarMemberEntity | null>;
  findByUserId: (userId: string) => Promise<CalendarMemberEntity[]>;
  updateRole: (id: string, role: MemberRole) => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteByUserIdAndCalendarId: (userId: string, calendarId: string) => Promise<void>;
};
