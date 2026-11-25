import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: process.env.EXPO_PUBLIC_APP_NAME || "SKILLHUB Admin",
    slug: "skillhub-admin-mobile",
    owner: "skillhub",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.skillhub.admin",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/logo.png",
      },
      package: "com.skillhub.admin",
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: "fabf249b-7479-4a1e-9604-8602c6db4eff",
        ...(config.extra?.eas || {}),
      },
      appName: process.env.EXPO_PUBLIC_APP_NAME,
      author: process.env.EXPO_PUBLIC_APP_AUTHOR,
      organization: process.env.EXPO_PUBLIC_ORGANIZATION,
      brandingCredit: process.env.EXPO_PUBLIC_BRANDING_CREDIT,
      officialWebsite: process.env.EXPO_PUBLIC_OFFICIAL_WEBSITE,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  };
};
