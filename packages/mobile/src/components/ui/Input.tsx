/**
 * 共通テキスト入力コンポーネント
 */
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { forwardRef } from "react";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName = "", className = "", ...props }, ref) => {
    return (
      <View className={containerClassName}>
        {label && (
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={`rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 ${
            error ? "border-red-500" : "focus:border-primary-500"
          } ${className}`}
          placeholderTextColor="#9ca3af"
          {...props}
        />
        {error && (
          <Text className="mt-1 text-sm text-red-500">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

export default Input;
