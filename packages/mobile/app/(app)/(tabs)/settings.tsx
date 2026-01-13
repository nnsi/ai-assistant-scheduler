/**
 * 設定画面
 */
import { View, Text, ScrollView, Pressable, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth, useCalendarContext } from "@ai-scheduler/core";
import Constants from "expo-constants";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { calendars } = useCalendarContext();

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handleLogout = () => {
    Alert.alert(
      "ログアウト",
      "ログアウトしますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "ログアウト",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert("エラー", "ログアウトに失敗しました");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* ヘッダー */}
      <View className="border-b border-gray-200 bg-white px-4 py-3">
        <Text className="text-xl font-bold text-gray-900">設定</Text>
      </View>

      <ScrollView className="flex-1">
        {/* プロフィールセクション */}
        <View className="mx-4 mt-4 rounded-xl bg-white">
          <View className="flex-row items-center p-4">
            {user?.picture ? (
              <Image
                source={{ uri: user.picture }}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <MaterialIcons name="person" size={32} color="#3b82f6" />
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {user?.name || "ユーザー"}
              </Text>
              <Text className="text-sm text-gray-500">{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* カレンダー管理セクション */}
        <Text className="mx-4 mb-2 mt-6 text-sm font-medium text-gray-500">
          カレンダー
        </Text>
        <View className="mx-4 rounded-xl bg-white">
          <Pressable
            onPress={() => router.push("/(app)/calendar/select")}
            className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 active:bg-gray-50"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="event" size={24} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-900">カレンダー管理</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="mr-2 text-sm text-gray-500">
                {calendars.length}個
              </Text>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/category/list")}
            className="flex-row items-center justify-between px-4 py-3 active:bg-gray-50"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="label" size={24} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-900">カテゴリ管理</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </Pressable>
        </View>

        {/* アカウントセクション */}
        <Text className="mx-4 mb-2 mt-6 text-sm font-medium text-gray-500">
          アカウント
        </Text>
        <View className="mx-4 rounded-xl bg-white">
          <Pressable
            onPress={() => router.push("/(app)/profile/edit")}
            className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 active:bg-gray-50"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="person-outline" size={24} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-900">プロフィール編集</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            disabled={isLoading}
            className="flex-row items-center px-4 py-3 active:bg-gray-50"
          >
            <MaterialIcons name="logout" size={24} color="#ef4444" />
            <Text className="ml-3 text-base text-red-500">ログアウト</Text>
          </Pressable>
        </View>

        {/* アプリ情報セクション */}
        <Text className="mx-4 mb-2 mt-6 text-sm font-medium text-gray-500">
          アプリ情報
        </Text>
        <View className="mx-4 rounded-xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
            <View className="flex-row items-center">
              <MaterialIcons name="info-outline" size={24} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-900">バージョン</Text>
            </View>
            <Text className="text-gray-500">{appVersion}</Text>
          </View>

          <Pressable
            onPress={() => {
              // TODO: プライバシーポリシーページへ
            }}
            className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 active:bg-gray-50"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="policy" size={24} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-900">プライバシーポリシー</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </Pressable>

          <Pressable
            onPress={() => {
              // TODO: 利用規約ページへ
            }}
            className="flex-row items-center justify-between px-4 py-3 active:bg-gray-50"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="description" size={24} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-900">利用規約</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </Pressable>
        </View>

        {/* フッター */}
        <View className="items-center py-8">
          <Text className="text-sm text-gray-400">
            AI Assistant Scheduler v{appVersion}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
