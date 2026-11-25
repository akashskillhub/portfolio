import React from "react";
import { View, Text, Switch } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { triggerHaptic } from "../../utils/haptics";

interface SwitchItemProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}

export const SwitchItem: React.FC<SwitchItemProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { accentColor } = useAuth();

  const handleValueChange = (val: boolean) => {
    triggerHaptic.light();
    onValueChange(val);
  };

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-slate-200">
      <View className="flex-1 pr-4">
        <Text className="text-slate-800 text-sm font-medium">{label}</Text>
        {description ? (
          <Text className="text-slate-500 text-xs mt-0.5">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        thumbColor={"#ffffff"}
        trackColor={{ false: "#e2e8f0", true: accentColor || "#2563eb" }}
      />
    </View>
  );
};

