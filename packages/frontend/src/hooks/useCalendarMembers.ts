import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCalendarMembers,
  addCalendarMember,
  updateCalendarMemberRole,
  removeCalendarMember,
  leaveCalendar,
  transferCalendarOwnership,
} from "../lib/api";
import type {
  AddMemberInput,
  UpdateMemberRoleInput,
  TransferOwnershipInput,
} from "@ai-scheduler/shared";
import { calendarQueryKeys } from "./useCalendars";

export const memberQueryKeys = {
  all: (calendarId: string) => ["calendars", calendarId, "members"] as const,
};

export const useCalendarMembers = (calendarId: string) => {
  return useQuery({
    queryKey: memberQueryKeys.all(calendarId),
    queryFn: () => fetchCalendarMembers(calendarId),
    enabled: !!calendarId,
  });
};

export const useAddCalendarMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      calendarId,
      input,
    }: {
      calendarId: string;
      input: AddMemberInput;
    }) => addCalendarMember(calendarId, input),
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all(calendarId) });
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
    },
  });
};

export const useUpdateCalendarMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      calendarId,
      targetUserId,
      input,
    }: {
      calendarId: string;
      targetUserId: string;
      input: UpdateMemberRoleInput;
    }) => updateCalendarMemberRole(calendarId, targetUserId, input),
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all(calendarId) });
    },
  });
};

export const useRemoveCalendarMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      calendarId,
      targetUserId,
    }: {
      calendarId: string;
      targetUserId: string;
    }) => removeCalendarMember(calendarId, targetUserId),
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all(calendarId) });
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
    },
  });
};

export const useLeaveCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (calendarId: string) => leaveCalendar(calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
    },
  });
};

export const useTransferCalendarOwnership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      calendarId,
      input,
    }: {
      calendarId: string;
      input: TransferOwnershipInput;
    }) => transferCalendarOwnership(calendarId, input),
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all(calendarId) });
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: calendarQueryKeys.detail(calendarId),
      });
    },
  });
};
