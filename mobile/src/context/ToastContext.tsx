import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react-native";
import { triggerHaptic } from "../utils/haptics";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let listeners: ToastListener[] = [];
let currentToasts: ToastItem[] = [];

export const showToast = (
  message: string,
  type: ToastType = "info",
  title?: string,
  duration: number = 3500
): string => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastItem = { id, type, title, message, duration };
  // Limit to at most 3 simultaneous toasts
  currentToasts = [newToast, ...currentToasts.slice(0, 2)];
  listeners.forEach((l) => l([...currentToasts]));

  // Trigger semantic haptic feedback based on toast type
  if (type === "success") {
    triggerHaptic.success();
  } else if (type === "error") {
    triggerHaptic.error();
  } else if (type === "warning") {
    triggerHaptic.warning();
  }

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
};

export const dismissToast = (id: string) => {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l([...currentToasts]));
};

export const toast = {
  success: (message: string, title?: string) =>
    showToast(message, "success", title || "Success"),
  error: (message: string, title?: string) =>
    showToast(message, "error", title || "Error"),
  info: (message: string, title?: string) =>
    showToast(message, "info", title || "Notice"),
  warning: (message: string, title?: string) =>
    showToast(message, "warning", title || "Warning"),
  dismiss: dismissToast,
};

export const useToast = () => toast;

const ToastCard: React.FC<{ item: ToastItem; onDismiss: (id: string) => void }> = ({
  item,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -12,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(item.id);
    });
  };

  const getTheme = () => {
    switch (item.type) {
      case "success":
        return {
          bg: "#f0fdf4",
          border: "#86efac",
          iconColor: "#16a34a",
          titleColor: "#15803d",
          textColor: "#166534",
          Icon: CheckCircle2,
        };
      case "error":
        return {
          bg: "#fef2f2",
          border: "#fca5a5",
          iconColor: "#dc2626",
          titleColor: "#b91c1c",
          textColor: "#991b1b",
          Icon: AlertCircle,
        };
      case "warning":
        return {
          bg: "#fffbeb",
          border: "#fde68a",
          iconColor: "#d97706",
          titleColor: "#b45309",
          textColor: "#92400e",
          Icon: AlertTriangle,
        };
      case "info":
      default:
        return {
          bg: "#eff6ff",
          border: "#bfdbfe",
          iconColor: "#2563eb",
          titleColor: "#1d4ed8",
          textColor: "#1e40af",
          Icon: Info,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleClose}
        style={styles.cardContent}
      >
        <View style={styles.iconWrapper}>
          <IconComponent size={20} color={theme.iconColor} />
        </View>

        <View style={styles.textContainer}>
          {item.title ? (
            <Text style={[styles.title, { color: theme.titleColor }]}>
              {item.title}
            </Text>
          ) : null}
          <Text style={[styles.message, { color: theme.textColor }]}>
            {item.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={16} color={theme.iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>(currentToasts);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => {
      setToasts(newToasts);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { top: Math.max(insets.top, 16) + 4 },
      ]}
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={dismissToast} />
      ))}
    </View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <View style={styles.providerWrapper}>
      {children}
      <ToastContainer />
    </View>
  );
};

const styles = StyleSheet.create({
  providerWrapper: {
    flex: 1,
  },
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999999,
    elevation: 999999,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
  },
});
