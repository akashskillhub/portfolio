import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../context/ToastContext";
import { ConfirmModal } from "./ConfirmModal";
import { Settings as SettingsIcon, LogOut } from "lucide-react-native";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogout?: boolean;
  showProfileAvatar?: boolean;
  onOptionsPress?: () => void;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLogout = false,
  showProfileAvatar = true,
  onOptionsPress,
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { appName, accentColor, logout, user } = useAuth();
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

  const handleConfirmLogout = () => {
    setConfirmLogoutVisible(true);
  };

  const handleAvatarPress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      try {
        (navigation as any).navigate("Profile");
      } catch {
        // Navigation target unavailable
      }
    }
  };

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
    >
      <View style={styles.textContainer}>
        {appName ? (
          <Text
            style={[styles.appName, { color: accentColor || "#2563eb" }]}
            numberOfLines={1}
          >
            {appName}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={1}>
          {title || "Account Overview"}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.actionsContainer}>
        {onOptionsPress ? (
          <TouchableOpacity
            onPress={onOptionsPress}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <SettingsIcon size={18} color="#475569" />
          </TouchableOpacity>
        ) : null}

        {showLogout ? (
          <TouchableOpacity
            onPress={handleConfirmLogout}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            <LogOut size={16} color="#ef4444" />
          </TouchableOpacity>
        ) : null}

        {showProfileAvatar ? (
          <TouchableOpacity
            onPress={handleAvatarPress}
            style={styles.avatarBtn}
            activeOpacity={0.7}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={[
                  styles.avatarImg,
                  { borderColor: accentColor || "#2563eb" },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: accentColor || "#2563eb" },
                ]}
              >
                <Text style={styles.avatarInitial}>
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Custom Confirmation Modal for Logout */}
      <ConfirmModal
        visible={confirmLogoutVisible}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your admin session?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmVariant="destructive"
        iconType="logout"
        onConfirm={async () => {
          setConfirmLogoutVisible(false);
          await logout();
          toast.info("Signed out successfully.");
        }}
        onCancel={() => setConfirmLogoutVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  appName: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    marginRight: 8,
  },
  avatarBtn: {
    padding: 2,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
