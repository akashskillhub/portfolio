import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { SwitchItem } from "../components/ui/SwitchItem";
import { ModalWrapper } from "../components/ui/ModalWrapper";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { APP_CONFIG } from "../config/app";
import { Check, Building2, LogOut, User as UserIcon, Smartphone } from "lucide-react-native";
import { getHapticsEnabled, setHapticsEnabled, triggerHaptic } from "../utils/haptics";

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    appName,
    updateAppName,
    accentColor,
    updateAccentColor,
    apiUrl,
    updateApiUrl,
    logout,
    user,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customAppName, setCustomAppName] = useState(appName);

  const [settings, setSettings] = useState({
    title: "",
    description: "",
    defaultTheme: "dark",
    accentColor: accentColor || "#2563eb",
    showAttribution: true,
    customHeadings: {
      heroTitle: "",
      aboutTitle: "",
      skillsTitle: "",
      projectsTitle: "",
      experienceTitle: "",
      contactTitle: "",
    },
  });

  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const [hapticsActive, setHapticsActive] = useState(getHapticsEnabled());

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await apiRequest("/api/admin/settings");
    const s = res.data?.settings || res.data;
    if (res.success && s) {
      setSettings({
        title: s.title || "",
        description: s.description || "",
        defaultTheme: s.defaultTheme || "dark",
        accentColor: s.accentColor || accentColor || "#2563eb",
        showAttribution: s.showAttribution ?? true,
        customHeadings: {
          heroTitle: s.customHeadings?.heroTitle || "",
          aboutTitle: s.customHeadings?.aboutTitle || "",
          skillsTitle: s.customHeadings?.skillsTitle || "",
          projectsTitle: s.customHeadings?.projectsTitle || "",
          experienceTitle: s.customHeadings?.experienceTitle || "",
          contactTitle: s.customHeadings?.contactTitle || "",
        },
      });
      if (s.accentColor) {
        updateAccentColor(s.accentColor);
      }
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    if (customAppName.trim()) {
      await updateAppName(customAppName.trim());
    }

    const res = await apiRequest("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });

    setSaving(false);

    if (res.success) {
      toast.success("Settings and dynamic app name saved successfully.");
    } else {
      toast.warning(res.error || "App name saved locally. Server settings update had a notice.");
    }
  };

  const handleSelectAccent = async (color: string) => {
    setSettings((p) => ({ ...p, accentColor: color }));
    await updateAccentColor(color);
  };

  const handleSaveServerUrl = async () => {
    if (!tempApiUrl.trim()) return;
    await updateApiUrl(tempApiUrl.trim());
    setServerModalVisible(false);
    toast.success(`Backend connection set to: ${tempApiUrl.trim()}`, "Server Updated");
  };

  const handleConfirmLogout = () => {
    setConfirmLogoutVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="App & Portfolio Settings"
        subtitle="Candidate dynamic app name, theme palette, custom section titles and branding"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      >
        {/* User Profile Card */}
        <Card className="mb-5 p-4 flex-row items-center">
          <View style={styles.profileAvatarWrapper}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={[
                  styles.profileAvatar,
                  { borderColor: accentColor || "#2563eb" },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.profileAvatarFallback,
                  { backgroundColor: accentColor || "#2563eb" },
                ]}
              >
                <Text style={styles.profileAvatarInitial}>
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-1 ml-3.5 pr-2">
            <Text className="text-slate-900 text-base font-bold">
              {user?.name || "Administrator"}
            </Text>
            <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
              {user?.email || "Admin Account"}
            </Text>
            {user?.title ? (
              <Text
                style={{ color: accentColor || "#2563eb" }}
                className="text-xs font-semibold mt-1"
                numberOfLines={1}
              >
                {user.title}
              </Text>
            ) : null}
          </View>
          <Button
            title="Edit Profile"
            variant="outline"
            size="sm"
            onPress={() => (navigation as any).navigate("Profile")}
          />
        </Card>
        <SectionHeading
          title="Dynamic Mobile App Name"
          description="Candidates can dynamically brand and name their admin application"
        />

        <Card className="mb-5">
          <Input
            label="Application Display Name"
            placeholder="e.g. Akash's Portfolio Hub"
            value={customAppName}
            onChangeText={setCustomAppName}
            helperText="This updates the header title, screen branding and mobile console name."
          />
        </Card>

        <SectionHeading
          title="Accent Color Palette"
          description="Select your brand accent color across web and mobile panels"
        />

        <Card className="mb-5">
          <View className="flex-row flex-wrap mb-3">
            {APP_CONFIG.accentColors.map((item) => {
              const isSelected = settings.accentColor.toLowerCase() === item.value.toLowerCase();
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => handleSelectAccent(item.value)}
                  style={{
                    backgroundColor: item.value,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    marginRight: 10,
                    marginBottom: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: isSelected ? "#0f172a" : "transparent",
                    borderWidth: isSelected ? 2.5 : 0,
                  }}
                  activeOpacity={0.8}
                >
                  {isSelected ? <Check size={18} color="#ffffff" strokeWidth={3} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Custom Hex Code"
            placeholder="#2563eb"
            value={settings.accentColor}
            onChangeText={(c) => {
              setSettings((p) => ({ ...p, accentColor: c }));
              if (/^#[0-9A-Fa-f]{6}$/.test(c)) {
                updateAccentColor(c);
              }
            }}
          />
        </Card>

        <SectionHeading
          title="Custom Section Headings"
          description="Personalize section titles across the portfolio"
        />

        <Card className="mb-5">
          <Input
            label="Hero Section Title"
            placeholder="e.g. Engineering Showcase"
            value={settings.customHeadings.heroTitle}
            onChangeText={(t) =>
              setSettings((p) => ({
                ...p,
                customHeadings: { ...p.customHeadings, heroTitle: t },
              }))
            }
          />
          <Input
            label="About Section Title"
            placeholder="e.g. About & Career Journey"
            value={settings.customHeadings.aboutTitle}
            onChangeText={(t) =>
              setSettings((p) => ({
                ...p,
                customHeadings: { ...p.customHeadings, aboutTitle: t },
              }))
            }
          />
          <Input
            label="Skills Section Title"
            placeholder="e.g. Technical Mastery & Stack"
            value={settings.customHeadings.skillsTitle}
            onChangeText={(t) =>
              setSettings((p) => ({
                ...p,
                customHeadings: { ...p.customHeadings, skillsTitle: t },
              }))
            }
          />
          <Input
            label="Projects Section Title"
            placeholder="e.g. Featured Works & Deployments"
            value={settings.customHeadings.projectsTitle}
            onChangeText={(t) =>
              setSettings((p) => ({
                ...p,
                customHeadings: { ...p.customHeadings, projectsTitle: t },
              }))
            }
          />
          <Input
            label="Experience Section Title"
            placeholder="e.g. Career Milestones"
            value={settings.customHeadings.experienceTitle}
            onChangeText={(t) =>
              setSettings((p) => ({
                ...p,
                customHeadings: { ...p.customHeadings, experienceTitle: t },
              }))
            }
          />
          <Input
            label="Contact Section Title"
            placeholder="e.g. Get in Touch"
            value={settings.customHeadings.contactTitle}
            onChangeText={(t) =>
              setSettings((p) => ({
                ...p,
                customHeadings: { ...p.customHeadings, contactTitle: t },
              }))
            }
          />
        </Card>

        <SectionHeading
          title="Branding & Credit Details"
          description="Organization and developer credits"
        />

        <Card className="mb-5">
          <SwitchItem
            label="Show Platform Attribution"
            description="Display 'Built with SKILLHUB' footer banner"
            value={settings.showAttribution}
            onValueChange={(val) => setSettings((p) => ({ ...p, showAttribution: val }))}
          />

          {APP_CONFIG.organization || APP_CONFIG.author ? (
            <View className="pt-3 border-t border-slate-200">
              {APP_CONFIG.organization ? (
                <View className="flex-row items-center mb-1">
                  <Building2 size={14} color="#64748b" />
                  <Text className="text-slate-800 text-xs font-semibold ml-1.5">
                    {APP_CONFIG.organization}
                  </Text>
                </View>
              ) : null}
              {APP_CONFIG.author ? (
                <Text className="text-slate-500 text-xs ml-5">
                  Developed by {APP_CONFIG.author}
                </Text>
              ) : null}
              {APP_CONFIG.officialWebsite ? (
                <Text className="text-slate-400 text-xs ml-5 mt-0.5">
                  {APP_CONFIG.officialWebsite}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Card>

        <SectionHeading
          title="Device & Interaction"
          description="Configure mobile tactile feedback and vibrations"
        />

        <Card className="mb-5">
          <SwitchItem
            label="Haptic Feedback"
            description="Provide subtle tactile vibrations for button presses, deletions, and toast alerts"
            value={hapticsActive}
            onValueChange={async (val) => {
              setHapticsActive(val);
              await setHapticsEnabled(val);
              if (val) {
                triggerHaptic.light();
              }
            }}
          />
        </Card>

        <SectionHeading
          title="Server Connection"
          description="Configure the Next.js API endpoint for this app"
        />

        <Card className="mb-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-slate-500 text-xs uppercase font-semibold">Current Endpoint</Text>
              <Text className="text-slate-900 text-xs mt-0.5 font-mono">{apiUrl}</Text>
            </View>
            <Button
              title="Edit URL"
              variant="outline"
              size="sm"
              onPress={() => {
                setTempApiUrl(apiUrl);
                setServerModalVisible(true);
              }}
            />
          </View>
        </Card>

        <Button
          title={saving ? "Saving Changes..." : "Save All Settings"}
          onPress={handleSaveSettings}
          loading={saving}
          size="lg"
          className="mb-8"
        />

        {/* Dedicated Account & Session Danger Zone */}
        <View style={styles.dangerZoneWrapper}>
          <SectionHeading
            title="Account Session"
            description="Manage active administrative authentication on this device"
          />
          <Card className="border-red-100 bg-red-50/20">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-1 pr-3">
                <Text className="text-slate-900 text-xs font-bold">
                  Signed in as {user?.email || "Admin"}
                </Text>
                <Text className="text-slate-500 text-[11px] mt-0.5">
                  Sign out to terminate active admin session on this phone.
                </Text>
              </View>
              <Button
                title="Sign Out"
                variant="destructive"
                size="sm"
                onPress={handleConfirmLogout}
              />
            </View>
          </Card>
        </View>
      </ScrollView>

      <ModalWrapper
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
        title="Edit Server API Endpoint"
      >
        <Input
          label="Server Base URL"
          placeholder="http://192.168.1.15:3000"
          value={tempApiUrl}
          onChangeText={setTempApiUrl}
          helperText="For local testing, use your machine's Wi-Fi / LAN IP or ngrok / production URL."
        />

        <View className="flex-row justify-end space-x-2 mt-4">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setServerModalVisible(false)}
            className="mr-2"
          />
          <Button
            title="Save URL"
            onPress={handleSaveServerUrl}
          />
        </View>
      </ModalWrapper>

      {/* Custom Confirmation Modal for Logout */}
      <ConfirmModal
        visible={confirmLogoutVisible}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your admin session? Any unsaved edits will be discarded."
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
  profileAvatarWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
  },
  profileAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarInitial: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },
  dangerZoneWrapper: {
    marginTop: 4,
  },
});
