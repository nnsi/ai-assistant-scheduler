import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type { UserProfile, UpdateProfileConditionsRequest } from "@ai-scheduler/shared";

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.fetchProfileConditions();
      setProfile(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateConditions = async (
    updates: UpdateProfileConditionsRequest
  ): Promise<UserProfile> => {
    const updated = await api.updateProfileConditions(updates);
    setProfile(updated);
    return updated;
  };

  return {
    profile,
    isLoading,
    error,
    updateConditions,
    refetch: fetchProfile,
  };
};
