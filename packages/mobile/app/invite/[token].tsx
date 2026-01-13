/**
 * 招待受諾画面
 * Deep Link: ai-scheduler://invite/{token}
 */
import { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth, fetchInvitationInfo, acceptInvitation } from "@ai-scheduler/core";
import { Button, ErrorMessage } from "../../src/components/ui";

interface InvitationInfo {
  calendarName: string;
  calendarColor: string;
  ownerName: string;
  role: string;
  expiresAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  editor: "編集者",
  viewer: "閲覧者",
};

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 招待情報を取得
  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError("無効な招待リンクです");
        setIsLoading(false);
        return;
      }

      try {
        const info = await fetchInvitationInfo(token);
        setInvitation(info);
      } catch (err) {
        console.error("Failed to load invitation:", err);
        setError("招待リンクが無効か、期限切れです");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  // 招待を受諾
  const handleAccept = useCallback(async () => {
    if (!token) return;

    setIsAccepting(true);
    try {
      await acceptInvitation(token);
      Alert.alert(
        "招待を受諾しました",
        `「${invitation?.calendarName}」カレンダーに参加しました`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/(app)/(tabs)"),
          },
        ]
      );
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      Alert.alert("エラー", "招待の受諾に失敗しました。再度お試しください。");
    } finally {
      setIsAccepting(false);
    }
  }, [token, invitation?.calendarName, router]);

  // 未認証の場合はログイン画面へ誘導
  const handleLogin = useCallback(() => {
    // TODO: ログイン後にこの画面に戻る処理
    router.replace("/sign-in");
  }, [router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // ローディング中
  if (authLoading || isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  // エラー
  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message={error}
        onRetry={() => router.back()}
      />
    );
  }

  // 未認証
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="login" size={64} color="#3b82f6" />
          <Text className="mt-4 text-xl font-bold text-gray-900">
            ログインが必要です
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            招待を受諾するには、先にログインしてください
          </Text>

          {invitation && (
            <View className="mt-6 w-full rounded-xl bg-gray-50 p-4">
              <Text className="text-center text-sm text-gray-500">
                招待されているカレンダー
              </Text>
              <Text className="mt-1 text-center text-lg font-semibold text-gray-900">
                {invitation.calendarName}
              </Text>
            </View>
          )}

          <Button onPress={handleLogin} className="mt-8 w-full">
            ログインする
          </Button>
          <Button
            onPress={handleCancel}
            variant="ghost"
            className="mt-3 w-full"
          >
            キャンセル
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // 招待情報表示
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="h-20 w-20 items-center justify-center rounded-2xl"
          style={{ backgroundColor: invitation?.calendarColor || "#3b82f6" }}
        >
          <MaterialIcons name="event" size={48} color="#ffffff" />
        </View>

        <Text className="mt-6 text-2xl font-bold text-gray-900">
          カレンダーへの招待
        </Text>

        <Text className="mt-2 text-center text-gray-600">
          {invitation?.ownerName || "ユーザー"}さんからの招待です
        </Text>

        <View className="mt-6 w-full rounded-xl bg-gray-50 p-6">
          <View className="items-center">
            <Text className="text-sm text-gray-500">カレンダー名</Text>
            <Text className="mt-1 text-xl font-semibold text-gray-900">
              {invitation?.calendarName}
            </Text>
          </View>

          <View className="mt-4 items-center">
            <Text className="text-sm text-gray-500">あなたの権限</Text>
            <View className="mt-1 flex-row items-center">
              <MaterialIcons
                name={invitation?.role === "editor" ? "edit" : "visibility"}
                size={20}
                color="#3b82f6"
              />
              <Text className="ml-1 text-lg font-medium text-primary-500">
                {ROLE_LABELS[invitation?.role || "viewer"]}
              </Text>
            </View>
          </View>
        </View>

        <Button
          onPress={handleAccept}
          loading={isAccepting}
          className="mt-8 w-full"
          size="lg"
        >
          招待を受諾する
        </Button>
        <Button
          onPress={handleCancel}
          variant="ghost"
          className="mt-3 w-full"
          disabled={isAccepting}
        >
          キャンセル
        </Button>
      </View>
    </SafeAreaView>
  );
}
