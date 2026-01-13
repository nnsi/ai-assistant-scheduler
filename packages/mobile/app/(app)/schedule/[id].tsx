/**
 * スケジュール詳細画面
 */
import { useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduleById, useSchedules, useCalendarContext } from "@ai-scheduler/core";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { LoadingSpinner, ErrorMessage } from "../../../src/components/ui";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCalendarById } = useCalendarContext();
  const { remove } = useSchedules();

  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => fetchScheduleById(id!),
    enabled: !!id,
  });

  const calendar = schedule?.calendarId ? getCalendarById(schedule.calendarId) : undefined;

  const handleEdit = useCallback(() => {
    router.push(`/(app)/schedule/edit/${id}`);
  }, [router, id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "削除確認",
      "このスケジュールを削除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(id!);
              router.back();
            } catch (err) {
              console.error("Delete failed:", err);
              Alert.alert("エラー", "削除に失敗しました");
            }
          },
        },
      ]
    );
  }, [id, remove, router]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  if (error || !schedule) {
    return (
      <ErrorMessage
        fullScreen
        message="スケジュールが見つかりません"
        onRetry={() => router.back()}
      />
    );
  }

  const startTime = new Date(schedule.startAt);
  const endTime = schedule.endAt ? new Date(schedule.endAt) : startTime;
  const calendarColor = calendar?.color || "#3b82f6";

  // 権限チェック
  const canEdit = calendar?.role === "owner" || calendar?.role === "editor";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerRight: () =>
            canEdit ? (
              <View className="flex-row">
                <Pressable onPress={handleEdit} className="mr-4">
                  <MaterialIcons name="edit" size={24} color="#3b82f6" />
                </Pressable>
                <Pressable onPress={handleDelete}>
                  <MaterialIcons name="delete" size={24} color="#ef4444" />
                </Pressable>
              </View>
            ) : null,
        }}
      />

      <ScrollView className="flex-1">
        {/* ヘッダー */}
        <View
          className="px-4 py-6"
          style={{ backgroundColor: calendarColor }}
        >
          <Text className="text-2xl font-bold text-white">{schedule.title}</Text>
          {calendar && (
            <Text className="mt-2 text-white opacity-90">{calendar.name}</Text>
          )}
        </View>

        {/* 日時 */}
        <View className="mx-4 mt-4 rounded-xl bg-white p-4">
          <View className="flex-row items-center">
            <MaterialIcons name="access-time" size={24} color="#6b7280" />
            <View className="ml-3">
              <Text className="text-base font-medium text-gray-900">
                {format(startTime, "yyyy年M月d日(E)", { locale: ja })}
              </Text>
              <Text className="text-sm text-gray-600">
                {schedule.isAllDay
                  ? "終日"
                  : `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`}
              </Text>
            </View>
          </View>
        </View>

        {/* 繰り返し */}
        {schedule.recurrence && (
          <View className="mx-4 mt-3 rounded-xl bg-white p-4">
            <View className="flex-row items-center">
              <MaterialIcons name="repeat" size={24} color="#6b7280" />
              <View className="ml-3">
                <Text className="text-base font-medium text-gray-900">
                  繰り返し
                </Text>
                <Text className="text-sm text-gray-600">
                  {schedule.recurrence.frequency === "daily" && "毎日"}
                  {schedule.recurrence.frequency === "weekly" && "毎週"}
                  {schedule.recurrence.frequency === "monthly" && "毎月"}
                  {schedule.recurrence.frequency === "yearly" && "毎年"}
                  {schedule.recurrence.interval > 1 && ` (${schedule.recurrence.interval}回ごと)`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* カテゴリ */}
        {schedule.category && (
          <View className="mx-4 mt-3 rounded-xl bg-white p-4">
            <View className="flex-row items-center">
              <MaterialIcons name="label" size={24} color="#6b7280" />
              <View
                className="ml-3 rounded-full px-3 py-1"
                style={{ backgroundColor: schedule.category.color || "#e5e7eb" }}
              >
                <Text className="text-sm font-medium text-white">
                  {schedule.category.name}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
