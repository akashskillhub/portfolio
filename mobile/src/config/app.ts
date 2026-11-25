import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};

export const APP_CONFIG = {
  appName: process.env.EXPO_PUBLIC_APP_NAME || extra.appName || "",
  author: process.env.EXPO_PUBLIC_APP_AUTHOR || extra.author || "",
  organization: process.env.EXPO_PUBLIC_ORGANIZATION || extra.organization || "",
  brandingCredit: process.env.EXPO_PUBLIC_BRANDING_CREDIT || extra.brandingCredit || "",
  officialWebsite: process.env.EXPO_PUBLIC_OFFICIAL_WEBSITE || extra.officialWebsite || "",
  apiUrl: process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || "",
  storageKeys: {
    authToken: "skillhub_auth_token",
    adminUser: "skillhub_admin_user",
    apiUrl: "skillhub_api_url",
    appName: "skillhub_custom_app_name",
    accentColor: "skillhub_accent_color",
  },
  accentColors: [
    { label: "SKILLHUB Royal Blue", value: "#2563eb" },
    { label: "Electric Indigo", value: "#4f46e5" },
    { label: "Deep Violet", value: "#7c3aed" },
    { label: "Emerald Green", value: "#10b981" },
    { label: "Ocean Teal", value: "#0d9488" },
    { label: "Cyber Cyan", value: "#06b6d4" },
    { label: "Vibrant Rose", value: "#f43f5e" },
    { label: "Flame Orange", value: "#ea580c" },
    { label: "Amber Gold", value: "#d97706" },
    { label: "Modern Slate", value: "#475569" },
  ],
};
