/**
 * ローディングスピナーコンポーネント
 */
import { ActivityIndicator, Text, View } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "large",
  color = "#3b82f6",
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {message && <Text className="mt-2 text-gray-600">{message}</Text>}
    </>
  );

  if (fullScreen) {
    return <View className="flex-1 items-center justify-center bg-white">{content}</View>;
  }

  return <View className="items-center justify-center p-4">{content}</View>;
}

export default LoadingSpinner;
