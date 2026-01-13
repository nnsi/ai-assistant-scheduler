/**
 * 共通ボタンコンポーネント
 */
import { Pressable, Text, ActivityIndicator, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

interface ButtonProps {
  onPress: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
}

const variantStyles = {
  primary: {
    container: "bg-primary-500 active:bg-primary-600",
    text: "text-white",
  },
  secondary: {
    container: "bg-gray-100 active:bg-gray-200",
    text: "text-gray-700",
  },
  danger: {
    container: "bg-red-500 active:bg-red-600",
    text: "text-white",
  },
  ghost: {
    container: "bg-transparent active:bg-gray-100",
    text: "text-gray-700",
  },
};

const sizeStyles = {
  sm: {
    container: "px-3 py-1.5 rounded-md",
    text: "text-sm",
  },
  md: {
    container: "px-4 py-2 rounded-lg",
    text: "text-base",
  },
  lg: {
    container: "px-6 py-3 rounded-xl",
    text: "text-lg",
  },
};

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${sizeStyle.container} ${variantStyle.container} ${isDisabled ? "opacity-50" : ""} ${className}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#ffffff" : "#6b7280"}
        />
      ) : typeof children === "string" ? (
        <Text className={`font-medium ${sizeStyle.text} ${variantStyle.text}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export default Button;
