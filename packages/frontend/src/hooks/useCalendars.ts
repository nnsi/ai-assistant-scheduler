import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCalendars,
  fetchCalendarById,
  createCalendar,
  updateCalendar,
  deleteCalendar,
} from "../lib/api";
import type {
  CreateCalendarInput,
  UpdateCalendarInput,
} from "@ai-scheduler/shared";

export const calendarQueryKeys = {
  all: ["calendars"] as const,
  detail: (id: string) => ["calendars", id] as const,
};

export const useCalendars = () => {
  return useQuery({
    queryKey: calendarQueryKeys.all,
    queryFn: fetchCalendars,
  });
};

export const useCalendar = (id: string) => {
  return useQuery({
    queryKey: calendarQueryKeys.detail(id),
    queryFn: () => fetchCalendarById(id),
    enabled: !!id,
  });
};

export const useCreateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCalendarInput) => createCalendar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
    },
  });
};

export const useUpdateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCalendarInput }) =>
      updateCalendar(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.detail(id) });
    },
  });
};

export const useDeleteCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCalendar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
    },
  });
};
