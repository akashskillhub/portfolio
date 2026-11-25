import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, Check, X, Plus } from "lucide-react-native";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  accentColor?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  error,
  helperText,
  onAddNew,
  addNewLabel = "+ Add New",
  accentColor = "#2563eb",
}) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value || opt.label === value);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.triggerBox,
          error ? styles.borderError : styles.borderNormal,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            selectedOption ? styles.textActive : styles.textPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color="#64748b" />
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop tap to dismiss */}
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.modalContainer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            {/* Visual Handle */}
            <View style={styles.handleWrapper}>
              <View style={styles.handle} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || "Select Option"}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.value === value || item.label === value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      isSelected && { backgroundColor: "#eff6ff" },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onValueChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && { color: accentColor, fontWeight: "700" },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <Check size={18} color={accentColor} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No options available</Text>
                </View>
              }
            />

            {onAddNew ? (
              <TouchableOpacity
                style={styles.addNewButton}
                activeOpacity={0.8}
                onPress={() => {
                  setModalVisible(false);
                  onAddNew();
                }}
              >
                <Plus size={16} color={accentColor} />
                <Text style={[styles.addNewText, { color: accentColor }]}>
                  {addNewLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  triggerBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  borderNormal: {
    borderColor: "#cbd5e1",
  },
  borderError: {
    borderColor: "#ef4444",
  },
  triggerText: {
    fontSize: 14,
    flex: 1,
  },
  textActive: {
    color: "#0f172a",
    fontWeight: "500",
  },
  textPlaceholder: {
    color: "#94a3b8",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomWidth: 0,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 25,
    paddingTop: 8,
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
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  optionLabel: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addNewText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
