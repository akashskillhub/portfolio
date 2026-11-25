import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = "",
  style,
  ...props
}) => {
  return (
    <View className="mb-4 w-full">
      {label ? (
        <Text className="text-slate-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#94a3b8"
        style={[
          {
            backgroundColor: "#ffffff",
            borderColor: error ? "#ef4444" : "#cbd5e1",
            borderWidth: 1,
            borderRadius: 8,
            color: "#0f172a",
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
          },
          style,
        ]}
        className={`bg-white border text-slate-900 rounded-lg px-3 py-2.5 text-sm ${
          error ? "border-red-500" : "border-slate-300"
        } ${className}`}
        {...props}
      />
      {error ? (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-slate-500 text-xs mt-1">{helperText}</Text>
      ) : null}
    </View>
  );
};

