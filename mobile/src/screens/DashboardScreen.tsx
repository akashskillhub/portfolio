import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Badge } from "../components/ui/Badge";
import {
  FolderKanban,
  Wrench,
  Briefcase,
  Mail,
  User,
  Settings,
  Share2,
  Image,
  GraduationCap,
  ArrowRight,
} from "lucide-react-native";

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, accentColor } = useAuth();
  const [stats, setStats] = useState({
    projectsCount: 0,
    skillsCount: 0,
    experienceCount: 0,
    unreadMessages: 0,
    totalMessages: 0,
  });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Try single overview endpoint first
      const overviewRes = await apiRequest("/api/admin/overview");
      if (overviewRes.success && overviewRes.data?.metrics) {
        const m = overviewRes.data.metrics;
        setStats({
          projectsCount: m.totalProjects || 0,
          skillsCount: m.totalSkills || 0,
          experienceCount: m.totalExperience || 0,
          unreadMessages: m.unreadMessages || 0,
          totalMessages: m.totalMessages || 0,
        });
        const recMsgs = overviewRes.data.recentMessages;
        setRecentMessages(Array.isArray(recMsgs) ? recMsgs.slice(0, 3) : []);
        return;
      }

      // 2. Fallback to parallel requests with proper payload unwrapping
      const [projectsRes, skillsRes, expRes, msgsRes] = await Promise.all([
        apiRequest("/api/admin/projects"),
        apiRequest("/api/admin/skills"),
        apiRequest("/api/admin/experience"),
        apiRequest("/api/admin/messages"),
      ]);

      const projects = projectsRes.data?.projects || (Array.isArray(projectsRes.data) ? projectsRes.data : []);
      const skills = skillsRes.data?.skills || (Array.isArray(skillsRes.data) ? skillsRes.data : []);
      const experience = expRes.data?.experiences || (Array.isArray(expRes.data) ? expRes.data : []);
      const messages = msgsRes.data?.messages || (Array.isArray(msgsRes.data) ? msgsRes.data : []);

      const unread = messages.filter((m: any) => !m.isRead).length;

      setStats({
        projectsCount: projects.length,
        skillsCount: skills.length,
        experienceCount: experience.length,
        unreadMessages: unread,
        totalMessages: messages.length,
      });

      setRecentMessages(messages.slice(0, 3));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const completeness = Math.min(
    100,
    Math.round(
      (stats.projectsCount > 0 ? 30 : 0) +
        (stats.skillsCount > 0 ? 30 : 0) +
        (stats.experienceCount > 0 ? 25 : 0) +
        15
    )
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Account Overview"
        subtitle={`Welcome back, ${user?.name || "Admin"}`}
        showLogout
        onOptionsPress={() => navigation.navigate("Settings")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }
      >
        {/* Profile Completeness Card */}
        <Card className="mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-slate-800 text-sm font-semibold">Portfolio Health</Text>
            <Text style={{ color: accentColor || "#2563eb" }} className="text-sm font-bold">
              {completeness}%
            </Text>
          </View>
          <View className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden mb-2">
            <View
              style={{
                width: `${completeness}%`,
                backgroundColor: accentColor || "#2563eb",
                height: "100%",
                borderRadius: 9999,
              }}
            />
          </View>
          <Text className="text-slate-500 text-xs">
            {completeness >= 85
              ? "Your dynamic portfolio is in optimal showcase condition."
              : "Add more projects, skills, and experience to maximize completeness."}
          </Text>
        </Card>

        {/* Metric Cards Grid */}
        <View className="flex-row flex-wrap justify-between mb-5">
          <TouchableOpacity
            style={{ width: "48%" }}
            onPress={() => navigation.navigate("Projects")}
            activeOpacity={0.8}
            className="mb-3"
          >
            <Card className="p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold uppercase">Projects</Text>
                <FolderKanban size={16} color={accentColor || "#2563eb"} />
              </View>
              <Text className="text-slate-900 text-2xl font-bold">{stats.projectsCount}</Text>
              <Text className="text-slate-400 text-xs mt-1">Showcased works</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: "48%" }}
            onPress={() => navigation.navigate("Skills")}
            activeOpacity={0.8}
            className="mb-3"
          >
            <Card className="p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold uppercase">Skills</Text>
                <Wrench size={16} color="#059669" />
              </View>
              <Text className="text-slate-900 text-2xl font-bold">{stats.skillsCount}</Text>
              <Text className="text-slate-400 text-xs mt-1">Tech capabilities</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: "48%" }}
            onPress={() => navigation.navigate("Experience")}
            activeOpacity={0.8}
            className="mb-3"
          >
            <Card className="p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold uppercase">Experience</Text>
                <Briefcase size={16} color="#7c3aed" />
              </View>
              <Text className="text-slate-900 text-2xl font-bold">{stats.experienceCount}</Text>
              <Text className="text-slate-400 text-xs mt-1">Milestones added</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: "48%" }}
            onPress={() => navigation.navigate("Messages")}
            activeOpacity={0.8}
            className="mb-3"
          >
            <Card className="p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold uppercase">Inquiries</Text>
                <Mail size={16} color="#e11d48" />
              </View>
              <Text className="text-slate-900 text-2xl font-bold">{stats.unreadMessages}</Text>
              <Text className="text-slate-400 text-xs mt-1">{stats.totalMessages} total received</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <SectionHeading
          title="Quick Navigation"
          description="Jump directly to portfolio management modules"
        />

        <View className="flex-row flex-wrap justify-between mb-6">
          {[
            { label: "Profile & Hero", icon: User, screen: "Profile" },
            { label: "About & Education", icon: GraduationCap, screen: "About" },
            { label: "Projects CMS", icon: FolderKanban, screen: "Projects" },
            { label: "Skills Matrix", icon: Wrench, screen: "Skills" },
            { label: "Experience", icon: Briefcase, screen: "Experience" },
            { label: "Contact Inbox", icon: Mail, screen: "Messages" },
            { label: "Social Links", icon: Share2, screen: "SocialLinks" },
            { label: "Media Assets", icon: Image, screen: "Media" },
            { label: "App & Theme Settings", icon: Settings, screen: "Settings" },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => navigation.navigate(item.screen)}
                style={{ width: "48%" }}
                className="mb-2.5"
                activeOpacity={0.7}
              >
                <View
                  style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderWidth: 1 }}
                  className="p-3 rounded-lg flex-row items-center justify-between shadow-sm"
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    <IconComp size={16} color="#64748b" />
                    <Text className="text-slate-800 text-xs font-medium ml-2 numberOfLines={1}">
                      {item.label}
                    </Text>
                  </View>
                  <ArrowRight size={14} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeading
          title="Recent Inquiries"
          description="Latest messages submitted from your contact form"
          action={
            <TouchableOpacity onPress={() => navigation.navigate("Messages")}>
              <Text style={{ color: accentColor || "#2563eb" }} className="text-xs font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          }
        />

        {recentMessages.length === 0 ? (
          <Card className="items-center py-6">
            <Mail size={24} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No contact messages received yet</Text>
          </Card>
        ) : (
          recentMessages.map((msg) => (
            <TouchableOpacity
              key={msg._id}
              onPress={() => navigation.navigate("Messages")}
              activeOpacity={0.8}
              className="mb-2.5"
            >
              <Card className="p-3.5">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-slate-800 text-sm font-semibold">{msg.name}</Text>
                  <Badge
                    label={msg.isRead ? "Read" : "New"}
                    variant={msg.isRead ? "secondary" : "default"}
                  />
                </View>
                <Text className="text-slate-500 text-xs font-medium mb-1">{msg.email}</Text>
                <Text numberOfLines={2} className="text-slate-600 text-xs">
                  {msg.message}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};
