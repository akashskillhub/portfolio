import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "../../context/AuthContext";

interface SectionHeadingProps {
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  description,
  badge,
  action,
}) => {
  const { accentColor } = useAuth();

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            style={{ width: 3, height: 16, backgroundColor: accentColor || "#2563eb", marginRight: 8, borderRadius: 2 }}
          />
          <Text className="text-slate-900 text-base font-semibold tracking-tight">
            {title}
          </Text>
          {badge ? (
            <View className="ml-2 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md">
              <Text className="text-slate-700 text-xs font-medium">{badge}</Text>
            </View>
          ) : null}
        </View>
        {action ? <View className="ml-2">{action}</View> : null}
      </View>
      {description ? (
        <Text className="text-slate-500 text-xs mt-1 ml-3.5 leading-relaxed">
          {description}
        </Text>
      ) : null}
    </View>
  );
};

