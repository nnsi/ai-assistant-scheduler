/**
 * エラーメッセージコンポーネント
 */
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onLogin?: () => void;
  isAuthError?: boolean;
  fullScreen?: boolean;
}

export function ErrorMessage({
  message,
  onRetry,
  onLogin,
  isAuthError = false,
  fullScreen = false,
}: ErrorMessageProps) {
  const content = (
    <View className="items-center">
      <MaterialIcons
        name={isAuthError ? "lock-outline" : "error-outline"}
        size={48}
        color={isAuthError ? "#f59e0b" : "#ef4444"}
      />
      <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
        {isAuthError ? "認証エラー" : "エラーが発生しました"}
      </Text>
      <Text className="mt-2 text-center text-gray-600">{message}</Text>

      {isAuthError && onLogin ? (
        <Pressable
          onPress={onLogin}
          className="mt-6 rounded-xl bg-primary-500 px-6 py-3 active:bg-primary-600"
        >
          <Text className="font-semibold text-white">ログイン画面に戻る</Text>
        </Pressable>
      ) : onRetry ? (
        <Pressable
          onPress={onRetry}
          className="mt-6 rounded-xl bg-primary-500 px-6 py-3 active:bg-primary-600"
        >
          <Text className="font-semibold text-white">再試行</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        {content}
      </View>
    );
  }

  return (
    <View className="items-center justify-center p-4">
      {content}
    </View>
  );
}

export default ErrorMessage;
