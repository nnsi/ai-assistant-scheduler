/**
 * ログイン画面
 */
import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@ai-scheduler/core";
import { useGoogleAuth } from "../src/lib/auth";
import { config } from "../src/lib/config";

export default function SignInScreen() {
  const { login, devLogin, isLoading } = useAuth();

  const { signIn, isReady } = useGoogleAuth(async (code, redirectUri) => {
    await login(code, redirectUri);
  });

  const handleDevLogin = async () => {
    try {
      await devLogin();
    } catch (error) {
      console.error("Dev login failed:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        {/* ロゴ・タイトル */}
        <View className="mb-12 items-center">
          <MaterialIcons name="event-note" size={80} color="#3b82f6" />
          <Text className="mt-4 text-3xl font-bold text-gray-900">
            AI Assistant
          </Text>
          <Text className="mt-1 text-3xl font-bold text-primary-500">
            Scheduler
          </Text>
          <Text className="mt-4 text-center text-gray-600">
            AIがあなたのスケジュール管理を{"\n"}サポートします
          </Text>
        </View>

        {/* ログインボタン */}
        <View className="w-full max-w-sm">
          {/* Google ログイン */}
          <Pressable
            onPress={signIn}
            disabled={!isReady || isLoading}
            className={`flex-row items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-4 ${
              !isReady || isLoading ? "opacity-50" : "active:bg-gray-50"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <>
                <Image
                  source={{
                    uri: "https://www.google.com/favicon.ico",
                  }}
                  className="mr-3 h-6 w-6"
                />
                <Text className="text-lg font-medium text-gray-700">
                  Googleでログイン
                </Text>
              </>
            )}
          </Pressable>

          {/* 開発環境用ログイン */}
          {config.isDevelopment && (
            <Pressable
              onPress={handleDevLogin}
              disabled={isLoading}
              className={`mt-4 flex-row items-center justify-center rounded-xl bg-gray-100 px-6 py-4 ${
                isLoading ? "opacity-50" : "active:bg-gray-200"
              }`}
            >
              <MaterialIcons name="code" size={24} color="#6b7280" />
              <Text className="ml-2 text-lg font-medium text-gray-600">
                開発環境ログイン
              </Text>
            </Pressable>
          )}
        </View>

        {/* フッター */}
        <View className="absolute bottom-8">
          <Text className="text-center text-sm text-gray-400">
            ログインすることで、利用規約と{"\n"}プライバシーポリシーに同意したとみなされます
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
