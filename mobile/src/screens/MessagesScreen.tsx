import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { ModalWrapper } from "../components/ui/ModalWrapper";
import { Badge } from "../components/ui/Badge";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { Mail, CheckCircle2, Clock, Trash2, Phone } from "lucide-react-native";

export const MessagesScreen: React.FC = () => {
  const { accentColor } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiRequest("/api/admin/messages");
      const list = res.data?.messages || (Array.isArray(res.data) ? res.data : []);
      setMessages(list);
    } catch (err) {
      console.error("Messages fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const toggleMessageStatus = async (msg: any) => {
    const newStatus = !msg.isRead;
    const res = await apiRequest("/api/admin/messages", {
      method: "PATCH",
      body: JSON.stringify({ id: msg._id, isRead: newStatus }),
    });

    if (res.success) {
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, isRead: newStatus } : m))
      );
      if (selectedMsg && selectedMsg._id === msg._id) {
        setSelectedMsg((p: any) => ({ ...p, isRead: newStatus }));
      }
      toast.success(newStatus ? "Marked as read." : "Marked as unread.");
    } else {
      toast.error(res.error || "Failed to update read status.");
    }
  };

  const handleDeleteMessage = (id: string, senderName: string) => {
    Alert.alert("Confirm Deletion", `Are you sure you want to delete inquiry from ${senderName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiRequest(`/api/admin/messages?id=${id}`, { method: "DELETE" });
          if (res.success) {
            toast.success("Inquiry removed successfully.");
            if (selectedMsg?._id === id) setSelectedMsg(null);
            await fetchMessages();
          } else {
            toast.error(res.error || "Failed to delete message.");
          }
        },
      },
    ]);
  };

  const openDetail = (msg: any) => {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      toggleMessageStatus(msg);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const filteredMessages =
    filter === "unread" ? messages.filter((m) => !m.isRead) : messages;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Contact Inquiries"
        subtitle="Manage and respond to direct client and recruiter messages"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }
      >
        <View className="flex-row items-center mb-4 space-x-2">
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={{
              backgroundColor: filter === "all" ? (accentColor || "#2563eb") : "#f1f5f9",
              borderColor: filter === "all" ? "transparent" : "#e2e8f0",
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              marginRight: 8,
            }}
          >
            <Text
              style={{
                color: filter === "all" ? "#ffffff" : "#475569",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              All Inquiries ({messages.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter("unread")}
            style={{
              backgroundColor: filter === "unread" ? (accentColor || "#2563eb") : "#f1f5f9",
              borderColor: filter === "unread" ? "transparent" : "#e2e8f0",
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: filter === "unread" ? "#ffffff" : "#475569",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        <SectionHeading
          title="Inquiries List"
          description={`Showing ${filteredMessages.length} inquiries`}
        />

        {filteredMessages.length === 0 ? (
          <Card className="items-center py-8">
            <Mail size={32} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No inquiries matching filter</Text>
          </Card>
        ) : (
          filteredMessages.map((msg) => (
            <TouchableOpacity
              key={msg._id}
              onPress={() => openDetail(msg)}
              activeOpacity={0.8}
              className="mb-3"
            >
              <Card
                style={[
                  !msg.isRead && {
                    borderColor: accentColor || "#2563eb",
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Text className="text-slate-900 text-sm font-bold mr-2">{msg.name}</Text>
                    <Badge
                      label={msg.isRead ? "Read" : "Unread"}
                      variant={msg.isRead ? "secondary" : "default"}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteMessage(msg._id, msg.name)}
                    className="p-1.5"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <Text className="text-slate-500 text-xs mb-1 font-medium">{msg.email}</Text>
                {msg.subject ? (
                  <Text className="text-slate-700 text-xs font-semibold mb-1">
                    Subj: {msg.subject}
                  </Text>
                ) : null}

                <Text numberOfLines={2} className="text-slate-600 text-xs leading-relaxed">
                  {msg.message}
                </Text>

                <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-slate-200">
                  <View className="flex-row items-center">
                    <Clock size={12} color="#64748b" />
                    <Text className="text-slate-400 text-xs ml-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ""}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleMessageStatus(msg)}
                    className="flex-row items-center"
                  >
                    <CheckCircle2
                      size={14}
                      color={msg.isRead ? "#64748b" : accentColor || "#2563eb"}
                    />
                    <Text
                      style={{ color: msg.isRead ? "#64748b" : accentColor || "#2563eb" }}
                      className="text-xs ml-1 font-medium"
                    >
                      {msg.isRead ? "Mark Unread" : "Mark as Read"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ModalWrapper
        visible={!!selectedMsg}
        onClose={() => setSelectedMsg(null)}
        title="Inquiry Details"
        subtitle={selectedMsg ? `Sent on ${new Date(selectedMsg.createdAt || Date.now()).toLocaleString()}` : ""}
      >
        {selectedMsg ? (
          <View>
            <View className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
              <Text className="text-slate-500 text-xs uppercase font-semibold">Sender</Text>
              <Text className="text-slate-900 text-base font-bold mt-0.5">{selectedMsg.name}</Text>
              <Text className="text-slate-700 text-xs mt-1">{selectedMsg.email}</Text>
              {selectedMsg.phone ? (
                <View className="flex-row items-center mt-1">
                  <Phone size={12} color="#64748b" />
                  <Text className="text-slate-700 text-xs ml-1">{selectedMsg.phone}</Text>
                </View>
              ) : null}
            </View>

            {selectedMsg.subject ? (
              <View className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                <Text className="text-slate-500 text-xs uppercase font-semibold">Subject</Text>
                <Text className="text-slate-900 text-sm font-semibold mt-0.5">
                  {selectedMsg.subject}
                </Text>
              </View>
            ) : null}

            <View className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              <Text className="text-slate-500 text-xs uppercase font-semibold mb-1">Message Body</Text>
              <Text className="text-slate-800 text-sm leading-relaxed">
                {selectedMsg.message}
              </Text>
            </View>

            <View className="flex-row justify-between space-x-2">
              <Button
                title={selectedMsg.isRead ? "Mark Unread" : "Mark Read"}
                variant="outline"
                onPress={() => toggleMessageStatus(selectedMsg)}
                className="flex-1 mr-2"
              />
              <Button
                title="Delete Inquiry"
                variant="destructive"
                onPress={() => handleDeleteMessage(selectedMsg._id, selectedMsg.name)}
                className="flex-1"
              />
            </View>
          </View>
        ) : null}
      </ModalWrapper>
    </View>
  );
};
