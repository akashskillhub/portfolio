import React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className = "", children, style, ...props }) => {
  return (
    <View
      style={[{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderWidth: 1, borderRadius: 12, padding: 16 }, style]}
      className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};

