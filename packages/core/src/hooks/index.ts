// Schedule hooks
export { useSchedules } from "./useSchedules";
export { useScheduleSearch } from "./useScheduleSearch";

// Calendar hooks
export {
  useCalendars,
  useCalendar,
  useCreateCalendar,
  useUpdateCalendar,
  useDeleteCalendar,
  calendarQueryKeys,
} from "./useCalendars";

// Category hooks
export { useCategories } from "./useCategories";

// AI hooks
export { useAI } from "./useAI";

// Profile hooks
export { useProfile } from "./useProfile";

// Recurrence hooks
export { useRecurrence } from "./useRecurrence";

// Supplement hooks
export { useSupplements } from "./useSupplements";

// Calendar Invitation hooks
export {
  useCalendarInvitations,
  useCreateCalendarInvitation,
  useRevokeCalendarInvitation,
  useInvitationInfo,
  useAcceptInvitation,
  invitationQueryKeys,
} from "./useCalendarInvitations";

// Calendar Member hooks
export {
  useCalendarMembers,
  useAddCalendarMember,
  useUpdateCalendarMemberRole,
  useRemoveCalendarMember,
  useLeaveCalendar,
  useTransferCalendarOwnership,
  memberQueryKeys,
} from "./useCalendarMembers";

// Modal Manager hooks
export { useModalManager } from "./useModalManager";

// UI Logic hooks (Headless)
export {
  useScheduleFormModal,
  type ScheduleFormData,
  type ScheduleFormStep,
  type ScheduleFormError,
  type UseScheduleFormModalConfig,
} from "./useScheduleFormModal";

export {
  useSearchModal,
  type UseSearchModalConfig,
} from "./useSearchModal";
