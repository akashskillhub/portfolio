import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NetworkLogger, { clearRequests } from "react-native-network-logger";
import { Activity, X, Trash2 } from "lucide-react-native";

export function NetworkInspectorModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Only active in development mode
  if (!__DEV__) {
    return null;
  }

  return (
    <>
      {/* Floating Network Inspector Trigger Pill */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          activeOpacity={0.8}
          style={styles.floatingButton}
        >
          <Activity size={14} color="#3b82f6" />
          <Text style={styles.floatingText}>Net Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Network Inspector Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeContainer} edges={["top", "bottom"]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Activity size={20} color="#2563eb" />
              <Text style={styles.headerTitle}>Network Inspector</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => clearRequests()}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#64748b" />
                <Text style={styles.headerButtonText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X size={20} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Network Logger Core Component */}
          <View style={styles.loggerContainer}>
            <NetworkLogger theme="light" />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    bottom: 95,
    right: 16,
    zIndex: 99999,
  },
  floatingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 6,
  },
  floatingText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "600",
  },
  modalSafeContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    gap: 4,
  },
  headerButtonText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  loggerContainer: {
    flex: 1,
  },
});
