import React from "react";
import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "secondary" | "outline" | "success" | "danger";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "default",
  className = "",
}) => {
  let bg = "#f1f5f9";
  let textColor = "#475569";
  let border = "#e2e8f0";

  if (variant === "default") {
    bg = "#eff6ff";
    textColor = "#2563eb";
    border = "#bfdbfe";
  } else if (variant === "secondary") {
    bg = "#f1f5f9";
    textColor = "#475569";
    border = "#e2e8f0";
  } else if (variant === "outline") {
    bg = "transparent";
    textColor = "#475569";
    border = "#cbd5e1";
  } else if (variant === "success") {
    bg = "#ecfdf5";
    textColor = "#059669";
    border = "#a7f3d0";
  } else if (variant === "danger") {
    bg = "#fef2f2";
    textColor = "#dc2626";
    border = "#fecaca";
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9999,
        alignSelf: "flex-start",
      }}
      className={`px-2 py-0.5 rounded-full ${className}`}
    >
      <Text style={{ color: textColor, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
};

