import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG } from "../config/app";
import { apiRequest, setCachedToken, setCachedApiUrl, initApiService } from "../services/api";

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  title?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  appName: string;
  accentColor: string;
  apiUrl: string;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateAppName: (name: string) => Promise<void>;
  updateAccentColor: (color: string) => Promise<void>;
  updateApiUrl: (url: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appName, setAppName] = useState<string>(APP_CONFIG.appName || "");
  const [accentColor, setAccentColor] = useState<string>(APP_CONFIG.accentColors[0].value);
  const [apiUrl, setApiUrl] = useState<string>(APP_CONFIG.apiUrl || "");

  useEffect(() => {
    async function loadStoredState() {
      try {
        await initApiService();
        const [storedToken, storedUser, storedAppName, storedAccent, storedUrl] = await Promise.all([
          AsyncStorage.getItem(APP_CONFIG.storageKeys.authToken).catch(() => null),
          AsyncStorage.getItem(APP_CONFIG.storageKeys.adminUser).catch(() => null),
          AsyncStorage.getItem(APP_CONFIG.storageKeys.appName).catch(() => null),
          AsyncStorage.getItem(APP_CONFIG.storageKeys.accentColor).catch(() => null),
          AsyncStorage.getItem(APP_CONFIG.storageKeys.apiUrl).catch(() => null),
        ]);

        if (storedToken) {
          setToken(storedToken);
          setCachedToken(storedToken);
        }
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {}
        }
        if (storedAppName) {
          setAppName(storedAppName);
        }
        if (storedAccent) {
          setAccentColor(storedAccent);
        }
        if (storedUrl) {
          setApiUrl(storedUrl);
          setCachedApiUrl(storedUrl);
        }

        // Fetch fresh profile data in background if logged in
        if (storedToken) {
          refreshUser();
        }
      } catch (err) {
        console.warn("Storage load warning (running with in-memory defaults):", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredState();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });

    if (!res.success) {
      return { success: false, error: res.error || "Login failed" };
    }

    // Extract session token from cookie header or response body
    let authToken = res.data?.token;

    if (!authToken && res.rawResponse) {
      // 1. Try Set-Cookie header
      const setCookie = res.rawResponse.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/skillhub_admin_session=([^;]+)/);
        if (match) authToken = match[1];
      }

      // 2. Try getSetCookie array if available in runtime
      if (!authToken && typeof (res.rawResponse.headers as any).getSetCookie === "function") {
        const cookiesList: string[] = (res.rawResponse.headers as any).getSetCookie();
        for (const c of cookiesList) {
          const match = c.match(/skillhub_admin_session=([^;]+)/);
          if (match) {
            authToken = match[1];
            break;
          }
        }
      }
    }

    if (!authToken) {
      // Fallback: use a marker if server sets cookies automatically
      authToken = "cookie_authenticated";
    }

    const userData = res.data?.user || { email, name: "Admin" };

    setToken(authToken);
    setUser(userData);
    setCachedToken(authToken);

    await Promise.all([
      AsyncStorage.setItem(APP_CONFIG.storageKeys.authToken, authToken),
      AsyncStorage.setItem(APP_CONFIG.storageKeys.adminUser, JSON.stringify(userData)),
    ]);

    // Sync remote profile and accent color
    try {
      const [settingsRes, profileRes] = await Promise.all([
        apiRequest("/api/admin/settings"),
        apiRequest("/api/admin/profile"),
      ]);
      const settings = settingsRes.data?.settings || settingsRes.data;
      if (settingsRes.success && settings?.accentColor) {
        setAccentColor(settings.accentColor);
        await AsyncStorage.setItem(APP_CONFIG.storageKeys.accentColor, settings.accentColor);
      }
      const p = profileRes.data?.profile || profileRes.data;
      if (profileRes.success && p) {
        const avatarUrl = p.profileImageUrl || p.avatarUrl || "";
        const name = p.name || userData.name;
        const email = p.email || userData.email;
        const title = p.professionalTitle || p.title || "";
        const updated: User = { name, email, avatarUrl, title };
        setUser(updated);
        await AsyncStorage.setItem(APP_CONFIG.storageKeys.adminUser, JSON.stringify(updated));
      }
    } catch {
      // Non-blocking
    }

    return { success: true };
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest("/api/admin/profile");
      const p = res.data?.profile || res.data;
      if (res.success && p) {
        const avatarUrl = p.profileImageUrl || p.avatarUrl || "";
        const name = p.name || user?.name || "Admin";
        const email = p.email || user?.email || "";
        const title = p.professionalTitle || p.title || "";
        const updated: User = { name, email, avatarUrl, title };
        setUser(updated);
        await AsyncStorage.setItem(
          APP_CONFIG.storageKeys.adminUser,
          JSON.stringify(updated)
        );
      }
    } catch {
      // Non-blocking
    }
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network fail on logout
    }

    setToken(null);
    setUser(null);
    setCachedToken(null);

    await Promise.all([
      AsyncStorage.removeItem(APP_CONFIG.storageKeys.authToken),
      AsyncStorage.removeItem(APP_CONFIG.storageKeys.adminUser),
    ]);
  };

  const updateAppName = async (name: string) => {
    const trimmed = name.trim() || APP_CONFIG.appName;
    setAppName(trimmed);
    await AsyncStorage.setItem(APP_CONFIG.storageKeys.appName, trimmed);
  };

  const updateAccentColor = async (color: string) => {
    setAccentColor(color);
    await AsyncStorage.setItem(APP_CONFIG.storageKeys.accentColor, color);
  };

  const updateApiUrl = async (url: string) => {
    const formatted = url.trim().replace(/\/+$/, "");
    setApiUrl(formatted);
    setCachedApiUrl(formatted);
    await AsyncStorage.setItem(APP_CONFIG.storageKeys.apiUrl, formatted);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        appName,
        accentColor,
        apiUrl,
        login,
        logout,
        updateAppName,
        updateAccentColor,
        updateApiUrl,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
