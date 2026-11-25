import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ModalWrapper } from "../components/ui/ModalWrapper";
import { APP_CONFIG } from "../config/app";
import { toast } from "../context/ToastContext";
import { Shield, Globe, Sparkles } from "lucide-react-native";

export const LoginScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, appName, apiUrl, updateApiUrl, accentColor } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please provide both admin email and password.", "Validation Error");
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error || "Invalid credentials or unreachable server.", "Authentication Failed");
    } else {
      toast.success("Welcome back! Signed in successfully.");
    }
  };

  const handleSaveServerUrl = async () => {
    if (!tempApiUrl.trim()) return;
    await updateApiUrl(tempApiUrl.trim());
    setServerModalVisible(false);
    toast.success(`Backend endpoint set to: ${tempApiUrl.trim()}`, "Server Updated");
  };

  return (
    <ScrollView
      style={{ backgroundColor: "#f8fafc" }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingTop: Math.max(insets.top, 24),
        paddingBottom: Math.max(insets.bottom, 24),
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-8">
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 80, height: 80, marginBottom: 12 }}
          resizeMode="contain"
        />
        {APP_CONFIG.organization ? (
          <Text style={{ color: accentColor || "#2563eb" }} className="text-xs uppercase tracking-widest font-bold mb-1">
            {APP_CONFIG.organization}
          </Text>
        ) : null}
        <Text className="text-slate-900 text-2xl font-bold tracking-tight text-center">
          {appName || "Admin Console"}
        </Text>
        <Text className="text-slate-500 text-xs text-center mt-1">
          Candidate Portfolio Management Console
        </Text>
      </View>

      <Card className="p-5">
        <View className="mb-4">
          <Text className="text-slate-900 text-base font-semibold">Admin Sign In</Text>
          <Text className="text-slate-500 text-xs mt-0.5">
            Enter your credentials to manage your portfolio
          </Text>
        </View>

        <Input
          label="Admin Email"
          placeholder="admin@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Password"
          placeholder="••••••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button
          title="Sign In to Dashboard"
          loading={loading}
          onPress={handleLogin}
          size="lg"
          className="mt-2"
        />

        <TouchableOpacity
          onPress={() => {
            setTempApiUrl(apiUrl);
            setServerModalVisible(true);
          }}
          className="flex-row items-center justify-center mt-5 py-2"
          activeOpacity={0.7}
        >
          <Globe size={14} color="#64748b" />
          <Text className="text-slate-500 text-xs ml-1.5 underline">
            Configure Server URL: {apiUrl}
          </Text>
        </TouchableOpacity>

        {navigation ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("SetupWizard")}
            className="flex-row items-center justify-center mt-3 py-2.5 bg-blue-50/70 border border-blue-200 rounded-lg"
            activeOpacity={0.7}
          >
            <Sparkles size={14} color={accentColor || "#2563eb"} />
            <Text style={{ color: accentColor || "#2563eb" }} className="text-xs font-semibold ml-1.5">
              Initial Setup? Run Setup Wizard
            </Text>
          </TouchableOpacity>
        ) : null}
      </Card>

      {/* Attribution footer */}
      {APP_CONFIG.brandingCredit || APP_CONFIG.author ? (
        <View className="items-center mt-8">
          <Text className="text-slate-500 text-xs">
            {APP_CONFIG.brandingCredit} {APP_CONFIG.author ? `• Developed by ${APP_CONFIG.author}` : ""}
          </Text>
          {APP_CONFIG.officialWebsite ? (
            <Text className="text-slate-600 text-xs mt-0.5">
              {APP_CONFIG.officialWebsite}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Server URL Config Modal */}
      <ModalWrapper
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
        title="Server API Connection"
        subtitle="Set the HTTP URL of your Next.js backend"
      >
        <Input
          label="API Base URL"
          placeholder="http://192.168.1.10:3000"
          value={tempApiUrl}
          onChangeText={setTempApiUrl}
          helperText="For Android emulator use http://10.0.2.2:3000. For real devices use your computer local IP address or production domain."
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
    </ScrollView>
  );
};
