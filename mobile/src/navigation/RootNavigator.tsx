import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

// Screens
import { LoginScreen } from "../screens/LoginScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { SetupWizardScreen } from "../screens/SetupWizardScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { SkillsScreen } from "../screens/SkillsScreen";
import { ProjectsScreen } from "../screens/ProjectsScreen";
import { ExperienceScreen } from "../screens/ExperienceScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { SocialLinksScreen } from "../screens/SocialLinksScreen";
import { MediaScreen } from "../screens/MediaScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

// Icons
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  Mail,
  Settings as SettingsIcon,
} from "lucide-react-native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    border: "#e2e8f0",
    primary: "#2563eb",
  },
};

const TabNavigator = () => {
  const { accentColor } = useAuth();
  const insets = useSafeAreaInsets();

  // Dynamic bottom inset to clear Android gesture bar, 3-button switcher, and curved screen corners
  const bottomInset = Math.max(insets.bottom, 12);
  const tabHeight = 54 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: tabHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarActiveTintColor: accentColor || "#2563eb",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Overview",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsScreen}
        options={{
          tabBarLabel: "Projects",
          tabBarIcon: ({ color, size }) => <FolderKanban size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="SkillsTab"
        component={SkillsScreen}
        options={{
          tabBarLabel: "Skills",
          tabBarIcon: ({ color, size }) => <Wrench size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          tabBarLabel: "Inquiries",
          tabBarIcon: ({ color, size }) => <Mail size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => <SettingsIcon size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const { token, isLoading } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    // Present the splash screen for at least 1.8 seconds on app start
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !splashFinished) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={LightNavigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f8fafc" } }}>
        {token ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Experience" component={ExperienceScreen} />
            <Stack.Screen name="Projects" component={ProjectsScreen} />
            <Stack.Screen name="Skills" component={SkillsScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="SocialLinks" component={SocialLinksScreen} />
            <Stack.Screen name="Media" component={MediaScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SetupWizard" component={SetupWizardScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

