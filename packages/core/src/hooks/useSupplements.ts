import type { ShopList } from "@ai-scheduler/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { selectShops, updateMemo } from "../api";

/**
 * スケジュール補足情報（お店選択、メモ）を管理するhook
 */
export const useSupplements = () => {
  const queryClient = useQueryClient();

  const selectShopsMutation = useMutation({
    mutationFn: ({
      scheduleId,
      shops,
    }: {
      scheduleId: string;
      shops: ShopList;
    }) => selectShops(scheduleId, shops),
    onSuccess: (_, variables) => {
      // スケジュール詳細のキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: ["schedule", variables.scheduleId],
      });
    },
  });

  const updateMemoMutation = useMutation({
    mutationFn: ({
      scheduleId,
      userMemo,
    }: {
      scheduleId: string;
      userMemo: string;
    }) => updateMemo(scheduleId, userMemo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["schedule", variables.scheduleId],
      });
    },
  });

  return {
    selectShops: (scheduleId: string, shops: ShopList) =>
      selectShopsMutation.mutateAsync({ scheduleId, shops }),
    updateMemo: (scheduleId: string, userMemo: string) =>
      updateMemoMutation.mutateAsync({ scheduleId, userMemo }),
    isSelectingShops: selectShopsMutation.isPending,
    isUpdatingMemo: updateMemoMutation.isPending,
  };
};
