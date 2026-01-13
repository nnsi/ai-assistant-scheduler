/**
 * 認証後アプリグループのレイアウト
 */
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="schedule/[id]"
        options={{
          headerShown: true,
          title: "スケジュール詳細",
          headerBackTitle: "戻る",
        }}
      />
      <Stack.Screen
        name="schedule/edit/[id]"
        options={{
          headerShown: true,
          title: "スケジュール編集",
          headerBackTitle: "戻る",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="schedule/new"
        options={{
          headerShown: true,
          title: "新規スケジュール",
          headerBackTitle: "戻る",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="calendar/[id]/members"
        options={{
          headerShown: true,
          title: "メンバー管理",
          headerBackTitle: "戻る",
        }}
      />
    </Stack>
  );
}
