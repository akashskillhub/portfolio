import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "destructive" | "primary";
  iconType?: "logout" | "delete" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "destructive",
  iconType = "warning",
  onConfirm,
  onCancel,
}) => {
  const { accentColor } = useAuth();

  const getIcon = () => {
    switch (iconType) {
      case "logout":
        return <LogOut size={24} color="#dc2626" />;
      case "delete":
        return <Trash2 size={24} color="#dc2626" />;
      case "warning":
      default:
        return confirmVariant === "destructive" ? (
          <AlertTriangle size={24} color="#dc2626" />
        ) : (
          <AlertTriangle size={24} color={accentColor || "#2563eb"} />
        );
    }
  };

  const getIconBg = () => {
    if (confirmVariant === "destructive") return "#fee2e2";
    return "#eff6ff";
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Centered Confirmation Dialog */}
        <View style={styles.dialogCard}>
          <View style={[styles.iconCircle, { backgroundColor: getIconBg() }]}>
            {getIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic.heavy();
                onConfirm();
              }}
              style={[
                styles.confirmBtn,
                confirmVariant === "destructive"
                  ? styles.confirmBtnDestructive
                  : { backgroundColor: accentColor || "#2563eb" },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDestructive: {
    backgroundColor: "#dc2626",
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
