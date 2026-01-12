import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@ai-scheduler/shared";

const CATEGORIES_QUERY_KEY = "categories";

export const useCategories = () => {
  const queryClient = useQueryClient();

  const queryKey = [CATEGORIES_QUERY_KEY];

  const { data: categories = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => api.fetchCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => api.createCategory(input),
    onSuccess: (newCategory) => {
      queryClient.setQueryData<Category[]>(queryKey, (old) =>
        old ? [...old, newCategory] : [newCategory]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      api.updateCategory(id, input),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData<Category[]>(queryKey, (old) =>
        old?.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)) ?? []
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Category[]>(queryKey, (old) =>
        old?.filter((c) => c.id !== id) ?? []
      );
    },
  });

  const create = async (input: CreateCategoryInput): Promise<Category> => {
    return createMutation.mutateAsync(input);
  };

  const update = async (id: string, input: UpdateCategoryInput): Promise<Category> => {
    return updateMutation.mutateAsync({ id, input });
  };

  const remove = async (id: string): Promise<void> => {
    await removeMutation.mutateAsync(id);
  };

  return {
    categories,
    isLoading,
    error: error as Error | null,
    create,
    update,
    remove,
    refetch,
  };
};
