import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCalendarInvitations,
  createCalendarInvitation,
  revokeCalendarInvitation,
  fetchInvitationInfo,
  acceptInvitation,
} from "../lib/api";
import type { CreateInvitationInput } from "@ai-scheduler/shared";
import { calendarQueryKeys } from "./useCalendars";

export const invitationQueryKeys = {
  all: (calendarId: string) => ["calendars", calendarId, "invitations"] as const,
  info: (token: string) => ["invitations", token] as const,
};

export const useCalendarInvitations = (calendarId: string) => {
  return useQuery({
    queryKey: invitationQueryKeys.all(calendarId),
    queryFn: () => fetchCalendarInvitations(calendarId),
    enabled: !!calendarId,
  });
};

export const useCreateCalendarInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      calendarId,
      input,
    }: {
      calendarId: string;
      input: CreateInvitationInput;
    }) => createCalendarInvitation(calendarId, input),
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({
        queryKey: invitationQueryKeys.all(calendarId),
      });
    },
  });
};

export const useRevokeCalendarInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      calendarId,
      invitationId,
    }: {
      calendarId: string;
      invitationId: string;
    }) => revokeCalendarInvitation(calendarId, invitationId),
    onSuccess: (_, { calendarId }) => {
      queryClient.invalidateQueries({
        queryKey: invitationQueryKeys.all(calendarId),
      });
    },
  });
};

export const useInvitationInfo = (token: string) => {
  return useQuery({
    queryKey: invitationQueryKeys.info(token),
    queryFn: () => fetchInvitationInfo(token),
    enabled: !!token,
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
    },
  });
};
