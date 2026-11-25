import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { ToastContainer } from "../../context/ToastContext";

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ToastContainer />
        {/* Backdrop tap to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Keyboard avoiding bottom sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            {/* Visual Grab Handle */}
            <View style={styles.handleWrapper}>
              <View style={styles.handle} />
            </View>

            {/* Header Bar */}
            <View style={styles.header}>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoid: {
    justifyContent: "flex-end",
  },
  sheetContainer: {
    maxHeight: "92%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 25,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  handleWrapper: {
    alignItems: "center",
    paddingVertical: 6,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 12,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
