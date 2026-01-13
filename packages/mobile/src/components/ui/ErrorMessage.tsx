/**
 * エラーメッセージコンポーネント
 */
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorMessage({
  message,
  onRetry,
  fullScreen = false,
}: ErrorMessageProps) {
  const content = (
    <View className="items-center">
      <MaterialIcons name="error-outline" size={48} color="#ef4444" />
      <Text className="mt-2 text-center text-gray-700">{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="mt-4 rounded-lg bg-primary-500 px-4 py-2 active:bg-primary-600"
        >
          <Text className="font-medium text-white">再試行</Text>
        </Pressable>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
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
