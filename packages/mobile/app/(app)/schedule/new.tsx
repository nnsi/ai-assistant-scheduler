/**
 * スケジュール新規作成画面
 */
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSchedules, useCalendarContext, useCategories } from "@ai-scheduler/core";
import { ScheduleForm } from "../../../src/components/schedule/ScheduleForm";
import { LoadingSpinner } from "../../../src/components/ui";
import { parseISO } from "date-fns";

export default function NewScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { calendars, defaultCalendarId, isLoading: calendarsLoading } = useCalendarContext();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { create } = useSchedules();
  const [isCreating, setIsCreating] = useState(false);

  const initialDate = params.date ? parseISO(params.date) : undefined;

  const handleSubmit = useCallback(
    async (data: {
      title: string;
      startAt: Date;
      endAt: Date;
      isAllDay: boolean;
      calendarId: string;
      categoryId: string | null;
    }) => {
      setIsCreating(true);
      try {
        await create({
          title: data.title,
          startAt: data.startAt.toISOString(),
          endAt: data.endAt.toISOString(),
          isAllDay: data.isAllDay,
          calendarId: data.calendarId,
          categoryId: data.categoryId || undefined,
        });
        router.back();
      } finally {
        setIsCreating(false);
      }
    },
    [create, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (calendarsLoading || categoriesLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <ScheduleForm
        initialDate={initialDate}
        calendars={calendars}
        categories={categories}
        defaultCalendarId={defaultCalendarId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isCreating}
      />
    </SafeAreaView>
  );
}
