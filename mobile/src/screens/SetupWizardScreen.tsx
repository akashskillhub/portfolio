import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { toast } from "../context/ToastContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { SectionHeading } from "../components/ui/SectionHeading";
import { APP_CONFIG } from "../config/app";
import {
  CheckCircle2,
  AlertCircle,
  Database,
  Shield,
  Layers,
  ArrowRight,
  ArrowLeft,
  Server,
  Sparkles,
} from "lucide-react-native";

export const SetupWizardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, accentColor, apiUrl } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [checking, setChecking] = useState<boolean>(true);
  const [testingDb, setTestingDb] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [setupStatus, setSetupStatus] = useState<any>(null);
  const [dbSuccess, setDbSuccess] = useState<boolean | null>(null);
  const [dbMessage, setDbMessage] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    portfolioType: "both" as "data-analytics" | "full-stack" | "both",
    installationType: "express" as "express" | "full",
    customProfile: {
      professionalTitle: "",
      heroHeadline: "",
      location: "",
    },
  });

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  const fetchSetupStatus = async () => {
    setChecking(true);
    const res = await apiRequest("/api/setup/status");
    if (res.success && res.data) {
      setSetupStatus(res.data);
      if (res.data.isInstalled) {
        Alert.alert(
          "Already Installed",
          "This dynamic portfolio has already been initialized. Please sign in to manage your account.",
          [{ text: "Sign In", onPress: () => navigation.navigate("Login") }]
        );
      }
    }
    setChecking(false);
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbSuccess(null);
    setDbMessage("");

    const res = await apiRequest("/api/setup/test-db", { method: "POST" });
    setTestingDb(false);

    if (res.success) {
      setDbSuccess(true);
      setDbMessage("Database connection verified successfully.");
      toast.success("Database connection verified successfully.");
    } else {
      setDbSuccess(false);
      const errMsg = res.error || "Could not connect to database. Check MongoDB configuration.";
      setDbMessage(errMsg);
      toast.error(errMsg, "Database Error");
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        toast.error("Name, email, and password are required.", "Validation Error");
        return;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long.", "Password Weak");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match.", "Password Mismatch");
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((p) => p - 1);
    }
  };

  const handleCompleteSetup = async () => {
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      mobile: formData.mobile.trim(),
      password: formData.password,
      portfolioType: formData.portfolioType,
      installationType: formData.installationType,
      customProfile:
        formData.installationType === "full" ? formData.customProfile : undefined,
    };

    const res = await apiRequest("/api/setup/install", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.success) {
      setSubmitting(false);
      toast.error(res.error || "Installation failed.", "Setup Error");
      return;
    }

    // Attempt automatic login
    const loginRes = await login(formData.email.trim(), formData.password);
    setSubmitting(false);

    if (loginRes.success) {
      toast.success(
        "Portfolio initialized successfully! Welcome to your admin console.",
        "Setup Complete!"
      );
    } else {
      toast.info(
        "Portfolio initialized. Please sign in with your new admin credentials.",
        "Setup Complete!"
      );
      navigation.navigate("Login");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Top Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          borderBottomColor: "#e2e8f0",
          borderBottomWidth: 1,
          backgroundColor: "#ffffff",
        }}
        className="px-4 pb-3 flex-row items-center justify-between"
      >
        <View className="flex-1 pr-2">
          <Text style={{ color: accentColor || "#2563eb" }} className="text-xs uppercase tracking-widest font-semibold">
            {APP_CONFIG.organization || "Essential Setup"}
          </Text>
          <Text className="text-slate-900 text-lg font-bold">Setup Wizard</Text>
        </View>
        <Badge label={`Step ${currentStep} of 5`} variant="default" />
      </View>

      {/* Progress Bar */}
      <View className="h-1 w-full bg-slate-200">
        <View
          style={{
            width: `${(currentStep / 5) * 100}%`,
            backgroundColor: accentColor || "#2563eb",
            height: "100%",
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: System Readiness & Diagnostics */}
        {currentStep === 1 && (
          <View>
            <SectionHeading
              title="System Diagnostics"
              description="Verifying backend server connectivity and database readiness"
            />

            <Card className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Server size={18} color={accentColor || "#2563eb"} />
                  <Text className="text-slate-800 text-sm font-semibold ml-2">Backend API Server</Text>
                </View>
                {checking ? (
                  <ActivityIndicator size="small" color={accentColor || "#2563eb"} />
                ) : setupStatus ? (
                  <Badge label="Online" variant="success" />
                ) : (
                  <Badge label="Unreachable" variant="danger" />
                )}
              </View>

              <Text className="text-slate-500 text-xs font-mono mb-2">Endpoint: {apiUrl}</Text>

              {setupStatus?.envCheck ? (
                <View className="pt-2 border-t border-slate-200 space-y-1">
                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-slate-700 text-xs">MongoDB Database String</Text>
                    <Text className={setupStatus.envCheck.mongoUri ? "text-emerald-600 text-xs font-semibold" : "text-red-600 text-xs"}>
                      {setupStatus.envCheck.mongoUri ? "Configured" : "Missing"}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-slate-700 text-xs">Auth Encryption Key</Text>
                    <Text className={setupStatus.envCheck.authSecret ? "text-emerald-600 text-xs font-semibold" : "text-red-600 text-xs"}>
                      {setupStatus.envCheck.authSecret ? "Ready (32+ chars)" : "Missing"}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Card>

            <Card className="mb-5">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Database size={18} color="#059669" />
                  <Text className="text-slate-800 text-sm font-semibold ml-2">Database Connection</Text>
                </View>
                <Button
                  title={testingDb ? "Testing..." : "Test Connection"}
                  variant="outline"
                  size="sm"
                  loading={testingDb}
                  onPress={handleTestDatabase}
                />
              </View>

              {dbMessage ? (
                <Text className={`text-xs mt-2 ${dbSuccess ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}`}>
                  {dbMessage}
                </Text>
              ) : (
                <Text className="text-slate-500 text-xs">
                  Tap "Test Connection" to ping your database before proceeding.
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* STEP 2: Specialization Track Selection */}
        {currentStep === 2 && (
          <View>
            <SectionHeading
              title="Specialization Track"
              description="Choose your engineering domain to tailor starter skills and showcase templates"
            />

            {[
              {
                id: "full-stack",
                title: "Full Stack Development",
                desc: "React, Next.js, Node.js, TypeScript, REST & GraphQL APIs, microservices and modern web apps.",
              },
              {
                id: "data-analytics",
                title: "Data Analytics & Engineering",
                desc: "Python, SQL, ETL pipelines, Pandas, statistical modeling, data visualization and warehousing.",
              },
              {
                id: "both",
                title: "Both (Hybrid Mastery)",
                desc: "Comprehensive dual-track portfolio showcasing end-to-end software engineering and data analysis.",
              },
            ].map((track) => {
              const isSelected = formData.portfolioType === track.id;
              return (
                <TouchableOpacity
                  key={track.id}
                  onPress={() =>
                    setFormData((p) => ({
                      ...p,
                      portfolioType: track.id as any,
                    }))
                  }
                  activeOpacity={0.8}
                  className="mb-3"
                >
                  <Card
                    style={[
                      isSelected && {
                        borderColor: accentColor || "#2563eb",
                        borderWidth: 2,
                        backgroundColor: "#eff6ff",
                      },
                    ]}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-slate-900 text-sm font-bold">{track.title}</Text>
                      {isSelected ? (
                        <CheckCircle2 size={18} color={accentColor || "#2563eb"} />
                      ) : null}
                    </View>
                    <Text className="text-slate-500 text-xs leading-relaxed">{track.desc}</Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STEP 3: Admin Credentials */}
        {currentStep === 3 && (
          <View>
            <SectionHeading
              title="Admin Account"
              description="Create the primary credentials used to administer your portfolio"
            />

            <Card className="mb-5">
              <Input
                label="Full Name"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
              />

              <Input
                label="Admin Email"
                placeholder="admin@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(t) => setFormData((p) => ({ ...p, email: t }))}
              />

              <Input
                label="Mobile Number (Optional)"
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                value={formData.mobile}
                onChangeText={(t) => setFormData((p) => ({ ...p, mobile: t }))}
              />

              <Input
                label="Password (min 8 chars)"
                placeholder="••••••••••••"
                secureTextEntry
                value={formData.password}
                onChangeText={(t) => setFormData((p) => ({ ...p, password: t }))}
              />

              <Input
                label="Confirm Password"
                placeholder="••••••••••••"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(t) => setFormData((p) => ({ ...p, confirmPassword: t }))}
              />
            </Card>
          </View>
        )}

        {/* STEP 4: Installation Type */}
        {currentStep === 4 && (
          <View>
            <SectionHeading
              title="Installation Mode"
              description="Select whether to seed realistic starter content or customize initial profile"
            />

            <TouchableOpacity
              onPress={() => setFormData((p) => ({ ...p, installationType: "express" }))}
              activeOpacity={0.8}
              className="mb-3"
            >
              <Card
                style={[
                  formData.installationType === "express" && {
                    borderColor: accentColor || "#2563eb",
                    borderWidth: 2,
                    backgroundColor: "#eff6ff",
                  },
                ]}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-slate-900 text-sm font-bold">Express Setup (Recommended)</Text>
                  {formData.installationType === "express" ? (
                    <CheckCircle2 size={18} color={accentColor || "#2563eb"} />
                  ) : null}
                </View>
                <Text className="text-slate-500 text-xs leading-relaxed">
                  Automatically initializes curated projects, skill categories, and technical proficiencies matching your track.
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFormData((p) => ({ ...p, installationType: "full" }))}
              activeOpacity={0.8}
              className="mb-3"
            >
              <Card
                style={[
                  formData.installationType === "full" && {
                    borderColor: accentColor || "#2563eb",
                    borderWidth: 2,
                    backgroundColor: "#eff6ff",
                  },
                ]}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-slate-900 text-sm font-bold">Custom Initial Profile</Text>
                  {formData.installationType === "full" ? (
                    <CheckCircle2 size={18} color={accentColor || "#2563eb"} />
                  ) : null}
                </View>
                <Text className="text-slate-500 text-xs leading-relaxed">
                  Specify your custom title, headline, and location during initialization.
                </Text>
              </Card>
            </TouchableOpacity>

            {formData.installationType === "full" ? (
              <Card className="mt-2 mb-4">
                <Input
                  label="Professional Title"
                  placeholder="e.g. Senior Software Architect"
                  value={formData.customProfile.professionalTitle}
                  onChangeText={(t) =>
                    setFormData((p) => ({
                      ...p,
                      customProfile: { ...p.customProfile, professionalTitle: t },
                    }))
                  }
                />
                <Input
                  label="Hero Headline"
                  placeholder="e.g. Architecting high-concurrency cloud systems"
                  value={formData.customProfile.heroHeadline}
                  onChangeText={(t) =>
                    setFormData((p) => ({
                      ...p,
                      customProfile: { ...p.customProfile, heroHeadline: t },
                    }))
                  }
                />
                <Input
                  label="Location"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={formData.customProfile.location}
                  onChangeText={(t) =>
                    setFormData((p) => ({
                      ...p,
                      customProfile: { ...p.customProfile, location: t },
                    }))
                  }
                />
              </Card>
            ) : null}
          </View>
        )}

        {/* STEP 5: Review & Launch */}
        {currentStep === 5 && (
          <View>
            <SectionHeading
              title="Pre-flight Review"
              description="Confirm initialization parameters before launching your portfolio"
            />

            <Card className="mb-5">
              <View className="py-2 border-b border-slate-200">
                <Text className="text-slate-500 text-xs uppercase font-semibold">Administrator</Text>
                <Text className="text-slate-900 text-sm font-bold mt-0.5">{formData.name}</Text>
                <Text className="text-slate-500 text-xs">{formData.email}</Text>
              </View>

              <View className="py-2 border-b border-slate-200">
                <Text className="text-slate-500 text-xs uppercase font-semibold">Specialization Track</Text>
                <Text className="text-slate-900 text-sm font-bold mt-0.5 capitalize">
                  {formData.portfolioType.replace("-", " ")}
                </Text>
              </View>

              <View className="py-2 border-b border-slate-200">
                <Text className="text-slate-500 text-xs uppercase font-semibold">Initialization Mode</Text>
                <Text className="text-slate-900 text-sm font-bold mt-0.5 capitalize">
                  {formData.installationType} Setup
                </Text>
              </View>

              <View className="py-2">
                <Text className="text-slate-500 text-xs uppercase font-semibold">Target Server</Text>
                <Text className="text-slate-900 text-xs font-mono mt-0.5">{apiUrl}</Text>
              </View>
            </Card>

            <Button
              title={submitting ? "Initializing Portfolio..." : "Launch Portfolio Installation"}
              size="lg"
              loading={submitting}
              onPress={handleCompleteSetup}
              className="mb-3"
            />
          </View>
        )}

        {/* Navigation Actions */}
        <View className="flex-row items-center justify-between mt-4">
          {currentStep > 1 ? (
            <Button
              title="Back"
              variant="outline"
              size="md"
              onPress={handlePrevStep}
              className="flex-1 mr-2"
            />
          ) : (
            <Button
              title="Cancel"
              variant="ghost"
              size="md"
              onPress={() => navigation.navigate("Login")}
              className="flex-1 mr-2"
            />
          )}

          {currentStep < 5 ? (
            <Button
              title="Next Step"
              size="md"
              onPress={handleNextStep}
              className="flex-1 ml-2"
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};
