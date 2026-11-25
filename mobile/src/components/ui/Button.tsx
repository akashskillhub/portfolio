import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  GestureResponderEvent,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { triggerHaptic } from "../../utils/haptics";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  haptic?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  haptic,
  disabled,
  className = "",
  style,
  onPress,
  ...props
}) => {
  const { accentColor } = useAuth();

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;

    // Trigger semantic haptic feedback if enabled (defaults to true for primary & destructive)
    const shouldHaptic = haptic !== undefined ? haptic : (variant === "primary" || variant === "destructive");
    if (shouldHaptic) {
      if (variant === "destructive") {
        triggerHaptic.heavy();
      } else {
        triggerHaptic.medium();
      }
    }

    onPress?.(e);
  };

  let bgStyle: ViewStyle = {};
  let borderStyle: ViewStyle = {};
  let textClass = "font-medium text-center";

  if (variant === "primary") {
    bgStyle = { backgroundColor: accentColor || "#2563eb" };
    textClass += " text-white font-semibold";
  } else if (variant === "secondary") {
    bgStyle = { backgroundColor: "#f1f5f9" };
    borderStyle = { borderColor: "#e2e8f0", borderWidth: 1 };
    textClass += " text-slate-700 font-semibold";
  } else if (variant === "destructive") {
    bgStyle = { backgroundColor: "#dc2626" };
    textClass += " text-white font-semibold";
  } else if (variant === "outline") {
    bgStyle = { backgroundColor: "#ffffff" };
    borderStyle = { borderColor: "#cbd5e1", borderWidth: 1 };
    textClass += " text-slate-700 font-medium";
  } else if (variant === "ghost") {
    bgStyle = { backgroundColor: "transparent" };
    textClass += " text-slate-600 font-medium";
  }

  const paddingStyle =
    size === "sm"
      ? { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }
      : size === "lg"
        ? { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10 }
        : { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 };

  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={handlePress}
      style={[
        bgStyle,
        borderStyle,
        paddingStyle,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
      className={`items-center justify-center flex-row ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text className={`${textClass} ${textSize}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

