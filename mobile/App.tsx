import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { startNetworkLogging } from "react-native-network-logger";
import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { NetworkInspectorModal } from "./src/components/NetworkInspectorModal";
import "./global.css";

// Intercept network calls in development
if (__DEV__) {
  try {
    startNetworkLogging();
  } catch (e) {
    console.warn("Failed to start network logging:", e);
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ToastProvider>
        <AuthProvider>
          <RootNavigator />
          <NetworkInspectorModal />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
