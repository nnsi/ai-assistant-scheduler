import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type { UserProfile, UpdateProfileConditionsRequest } from "@ai-scheduler/shared";

const PROFILE_QUERY_KEY = ["profile", "conditions"];

type UseProfileOptions = {
  enabled?: boolean;
};

export const useProfile = (options: UseProfileOptions = {}) => {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading, error, refetch } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: api.fetchProfileConditions,
    enabled,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: UpdateProfileConditionsRequest) =>
      api.updateProfileConditions(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, updated);
    },
  });

  const updateConditions = async (
    updates: UpdateProfileConditionsRequest
  ): Promise<UserProfile> => {
    return updateMutation.mutateAsync(updates);
  };

  return {
    profile,
    isLoading,
    error: error as Error | null,
    updateConditions,
    refetch,
  };
};
