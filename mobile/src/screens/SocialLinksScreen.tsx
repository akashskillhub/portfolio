import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { SwitchItem } from "../components/ui/SwitchItem";
import { ModalWrapper } from "../components/ui/ModalWrapper";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { Plus, Trash2, Edit2, Share2 } from "lucide-react-native";

export const SocialLinksScreen: React.FC = () => {
  const { accentColor } = useAuth();
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState<any | null>(null);

  const [form, setForm] = useState({
    platform: "GitHub",
    url: "",
    username: "",
    isVisible: true,
    order: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest("/api/admin/social-links");
      const list = res.data?.links || (Array.isArray(res.data) ? res.data : []);
      setSocialLinks(list);
    } catch (err) {
      console.error("Social links fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openAddLink = () => {
    setEditingLink(null);
    setForm({
      platform: "GitHub",
      url: "",
      username: "",
      isVisible: true,
      order: socialLinks.length + 1,
    });
    setModalVisible(true);
  };

  const openEditLink = (link: any) => {
    setEditingLink(link);
    setForm({
      platform: link.platform || "GitHub",
      url: link.url || "",
      username: link.username || "",
      isVisible: link.isVisible ?? true,
      order: link.order || 0,
    });
    setModalVisible(true);
  };

  const handleSaveLink = async () => {
    if (!form.platform.trim() || !form.url.trim()) {
      toast.error("Platform name and URL are required.", "Validation");
      return;
    }

    const payload = {
      ...form,
      platform: form.platform.trim(),
      url: form.url.trim(),
      order: Number(form.order) || 0,
    };

    if (editingLink) {
      const res = await apiRequest("/api/admin/social-links", {
        method: "PUT",
        body: JSON.stringify({
          _id: editingLink._id,
          ...payload,
        }),
      });
      if (!res.success) {
        toast.error(res.error || "Failed to update link.");
        return;
      }
      toast.success("Social profile updated successfully.");
    } else {
      const res = await apiRequest("/api/admin/social-links", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        toast.error(res.error || "Failed to create link.");
        return;
      }
      toast.success("Social profile linked successfully.");
    }

    setModalVisible(false);
    await fetchData();
  };

  const handleDeleteLink = (id: string, platform: string) => {
    Alert.alert("Confirm Deletion", `Are you sure you want to delete ${platform} link?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiRequest(`/api/admin/social-links?id=${id}`, { method: "DELETE" });
          if (res.success) {
            toast.success("Social link removed successfully.");
            await fetchData();
          } else {
            toast.error(res.error || "Failed to delete link.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Social Profiles"
        subtitle="Manage public developer accounts, handles and external portfolio links"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }
      >
        <SectionHeading
          title="Social Accounts"
          description={`Showing ${socialLinks.length} connected accounts`}
          action={
            <Button
              title="Add Link"
              size="sm"
              onPress={openAddLink}
            />
          }
        />

        {socialLinks.length === 0 ? (
          <Card className="items-center py-8">
            <Share2 size={32} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No social profile links configured yet</Text>
          </Card>
        ) : (
          socialLinks.map((link) => (
            <Card key={link._id} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <Text className="text-slate-900 text-sm font-bold mr-2">
                      {link.platform}
                    </Text>
                    {!link.isVisible ? (
                      <View className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        <Text className="text-slate-500 text-[10px] font-medium">Hidden</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    numberOfLines={1}
                    style={{ color: accentColor || "#2563eb" }}
                    className="text-xs font-medium mt-0.5"
                  >
                    {link.url}
                  </Text>

                  {link.username ? (
                    <Text className="text-slate-500 text-xs mt-0.5">
                      Handle: @{link.username}
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row items-center space-x-1">
                  <TouchableOpacity onPress={() => openEditLink(link)} className="p-2 mr-1">
                    <Edit2 size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteLink(link._id, link.platform)}
                    className="p-2"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <ModalWrapper
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingLink ? "Edit Social Link" : "Add Social Link"}
      >
        <Input
          label="Platform Name"
          placeholder="GitHub, LinkedIn, Twitter/X, LeetCode, YouTube"
          value={form.platform}
          onChangeText={(t) => setForm((p) => ({ ...p, platform: t }))}
        />

        <Input
          label="Profile URL"
          placeholder="https://github.com/your-username"
          keyboardType="url"
          autoCapitalize="none"
          value={form.url}
          onChangeText={(t) => setForm((p) => ({ ...p, url: t }))}
        />

        <Input
          label="Username / Handle (Optional)"
          placeholder="e.g. john_doe"
          autoCapitalize="none"
          value={form.username}
          onChangeText={(t) => setForm((p) => ({ ...p, username: t }))}
        />

        <Input
          label="Display Order"
          placeholder="1"
          keyboardType="numeric"
          value={String(form.order)}
          onChangeText={(t) => setForm((p) => ({ ...p, order: Number(t) || 0 }))}
        />

        <SwitchItem
          label="Visible on Portfolio"
          description="Display link icon on header and contact sections"
          value={form.isVisible}
          onValueChange={(val) => setForm((p) => ({ ...p, isVisible: val }))}
        />

        <View className="flex-row justify-end space-x-2 mt-4">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setModalVisible(false)}
            className="mr-2"
          />
          <Button
            title="Save Link"
            onPress={handleSaveLink}
          />
        </View>
      </ModalWrapper>
    </View>
  );
};
