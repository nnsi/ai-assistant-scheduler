import type { CreateRecurrenceRuleInput, UpdateRecurrenceRuleInput } from "@ai-scheduler/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecurrence, deleteRecurrence, fetchRecurrence, updateRecurrence } from "../api";

export const useRecurrence = (scheduleId: string | null) => {
  const queryClient = useQueryClient();

  const queryKey = ["recurrence", scheduleId];

  const {
    data: recurrence,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => (scheduleId ? fetchRecurrence(scheduleId) : null),
    enabled: !!scheduleId,
  });

  const createMutation = useMutation({
    mutationFn: ({
      scheduleId,
      input,
    }: {
      scheduleId: string;
      input: CreateRecurrenceRuleInput;
    }) => createRecurrence(scheduleId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recurrence", variables.scheduleId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      scheduleId,
      input,
    }: {
      scheduleId: string;
      input: UpdateRecurrenceRuleInput;
    }) => updateRecurrence(scheduleId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recurrence", variables.scheduleId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) => deleteRecurrence(scheduleId),
    onSuccess: (_, scheduleId) => {
      queryClient.invalidateQueries({ queryKey: ["recurrence", scheduleId] });
    },
  });

  return {
    recurrence,
    isLoading,
    error,
    create: (scheduleId: string, input: CreateRecurrenceRuleInput) =>
      createMutation.mutateAsync({ scheduleId, input }),
    update: (scheduleId: string, input: UpdateRecurrenceRuleInput) =>
      updateMutation.mutateAsync({ scheduleId, input }),
    remove: (scheduleId: string) => deleteMutation.mutateAsync(scheduleId),
  };
};
