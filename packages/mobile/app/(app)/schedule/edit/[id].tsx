/**
 * スケジュール編集画面
 */
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduleById, useSchedules, useCalendarContext, useCategories } from "@ai-scheduler/core";
import { ScheduleForm } from "../../../../src/components/schedule/ScheduleForm";
import { LoadingSpinner, ErrorMessage } from "../../../../src/components/ui";

export default function EditScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { calendars, defaultCalendarId, isLoading: calendarsLoading } = useCalendarContext();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { update } = useSchedules();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: schedule, isLoading: scheduleLoading, error } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => fetchScheduleById(id!),
    enabled: !!id,
  });

  const handleSubmit = useCallback(
    async (data: {
      title: string;
      startAt: Date;
      endAt: Date;
      isAllDay: boolean;
      calendarId: string;
      categoryId: string | null;
    }) => {
      setIsUpdating(true);
      try {
        await update(id!, {
          title: data.title,
          startAt: data.startAt.toISOString(),
          endAt: data.endAt.toISOString(),
          isAllDay: data.isAllDay,
          categoryId: data.categoryId || undefined,
        });
        router.back();
      } finally {
        setIsUpdating(false);
      }
    },
    [id, update, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const isLoading = calendarsLoading || categoriesLoading || scheduleLoading;

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <ScheduleForm
        initialData={schedule}
        calendars={calendars}
        categories={categories}
        defaultCalendarId={defaultCalendarId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isUpdating}
      />
    </SafeAreaView>
  );
}
