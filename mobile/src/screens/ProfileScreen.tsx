import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, Image } from "react-native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { SwitchItem } from "../components/ui/SwitchItem";
import { ImageUploader } from "../components/ui/ImageUploader";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { Plus, Trash2, User } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadMediaFile } from "../services/api";

export const ProfileScreen: React.FC = () => {
  const { accentColor, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    tagline: "",
    email: "",
    phone: "",
    location: "",
    avatarUrl: "",
    resumeUrl: "",
    isAvailableForHire: true,
    bio: "",
    typingWords: [] as string[],
    highlightStats: [] as { label: string; value: string; order?: number }[],
  });

  const [newWord, setNewWord] = useState("");
  const [newStatLabel, setNewStatLabel] = useState("");
  const [newStatValue, setNewStatValue] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await apiRequest("/api/admin/profile");
    const p = res.data?.profile || res.data;
    if (res.success && p) {
      setFormData({
        name: p.name || "",
        title: p.professionalTitle || p.title || "",
        tagline: p.heroHeadline || p.tagline || "",
        email: p.email || "",
        phone: p.phone || "",
        location: p.location || "",
        avatarUrl: p.profileImageUrl || p.avatarUrl || "",
        resumeUrl: p.resumeUrl || "",
        isAvailableForHire: p.availabilityStatus ? p.availabilityStatus.toLowerCase().includes("available") : (p.isAvailableForHire ?? true),
        bio: p.heroIntroduction || p.bio || "",
        typingWords: Array.isArray(p.typingWords) ? p.typingWords : [],
        highlightStats: Array.isArray(p.highlightStats) ? p.highlightStats : [],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      professionalTitle: formData.title.trim() || "Professional Developer",
      heroHeadline: formData.tagline.trim() || `${formData.name.trim()} Portfolio`,
      heroIntroduction: formData.bio.trim().length >= 10
        ? formData.bio.trim()
        : (formData.bio.trim() ? `${formData.bio.trim()} - Professional Portfolio` : "Welcome to my portfolio and project showcase."),
      profileImageUrl: formData.avatarUrl,
      resumeUrl: formData.resumeUrl,
      location: formData.location,
      email: formData.email,
      phone: formData.phone,
      availabilityStatus: formData.isAvailableForHire ? "Available for new opportunities" : "Currently unavailable",
      typingWords: formData.typingWords,
      highlightStats: formData.highlightStats,
      // Backward compatibility fields
      title: formData.title,
      tagline: formData.tagline,
      bio: formData.bio,
      avatarUrl: formData.avatarUrl,
    };

    const res = await apiRequest("/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.success) {
      toast.success("Profile data updated successfully.");
      await refreshUser();
    } else {
      toast.error(res.error || "Failed to update profile.");
    }
  };

  const addTypingWord = () => {
    if (!newWord.trim()) return;
    setFormData((prev) => ({
      ...prev,
      typingWords: [...prev.typingWords, newWord.trim()],
    }));
    setNewWord("");
  };

  const removeTypingWord = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      typingWords: prev.typingWords.filter((_, i) => i !== index),
    }));
  };

  const addHighlightStat = () => {
    if (!newStatLabel.trim() || !newStatValue.trim()) {
      toast.error("Both metric value and label are required.", "Validation");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      highlightStats: [
        ...prev.highlightStats,
        {
          label: newStatLabel.trim(),
          value: newStatValue.trim(),
          order: prev.highlightStats.length + 1,
        },
      ],
    }));
    setNewStatLabel("");
    setNewStatValue("");
  };

  const removeHighlightStat = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlightStats: prev.highlightStats.filter((_, i) => i !== index),
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Profile & Hero"
        subtitle="Configure primary candidate info, hero titles and highlight metrics"
        showProfileAvatar={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Card className="mb-5 items-center">
          <ImageUploader
            label="Candidate Avatar Photo"
            value={formData.avatarUrl}
            onChange={(url) => setFormData((p) => ({ ...p, avatarUrl: url }))}
            shape="circle"
            aspect={[1, 1]}
            accentColor={accentColor}
            fileNamePrefix="avatar"
            helperText="Tap to select photo from camera roll"
          />

          <View className="w-full mt-2">
            <SwitchItem
              label="Available for Hire"
              description="Displays open-for-work status banner on the portfolio"
              value={formData.isAvailableForHire}
              onValueChange={(val) => setFormData((p) => ({ ...p, isAvailableForHire: val }))}
            />
          </View>
        </Card>

        <SectionHeading
          title="Personal Details"
          description="Fundamental candidate identification"
        />

        <Card className="mb-5">
          <Input
            label="Candidate Full Name"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
          />

          <Input
            label="Professional Title"
            placeholder="e.g. Full Stack Cloud Engineer"
            value={formData.title}
            onChangeText={(t) => setFormData((p) => ({ ...p, title: t }))}
          />

          <Input
            label="Hero Tagline"
            placeholder="e.g. Architecting high-concurrency systems"
            value={formData.tagline}
            onChangeText={(t) => setFormData((p) => ({ ...p, tagline: t }))}
          />

          <Input
            label="Email Address"
            placeholder="candidate@example.com"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(t) => setFormData((p) => ({ ...p, email: t }))}
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(t) => setFormData((p) => ({ ...p, phone: t }))}
          />

          <Input
            label="Location"
            placeholder="e.g. San Francisco, CA / Remote"
            value={formData.location}
            onChangeText={(t) => setFormData((p) => ({ ...p, location: t }))}
          />

          <Input
            label="Resume Document URL"
            placeholder="https://drive.google.com/... or Cloudinary URL"
            value={formData.resumeUrl}
            onChangeText={(t) => setFormData((p) => ({ ...p, resumeUrl: t }))}
          />
        </Card>

        <SectionHeading
          title="Hero Typing Words"
          description="Rotating words displayed in the animated hero header"
        />

        <Card className="mb-5">
          <View className="flex-row items-center space-x-2 mb-3">
            <View className="flex-1 mr-2">
              <Input
                placeholder="e.g. React Developer"
                value={newWord}
                onChangeText={setNewWord}
                style={{ marginBottom: 0 }}
              />
            </View>
            <Button title="Add" onPress={addTypingWord} size="md" />
          </View>

          <View className="flex-row flex-wrap">
            {formData.typingWords.map((word, idx) => (
              <View
                key={idx}
                className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 flex-row items-center mr-2 mb-2"
              >
                <Text className="text-slate-700 text-xs font-medium mr-1.5">{word}</Text>
                <TouchableOpacity onPress={() => removeTypingWord(idx)}>
                  <Trash2 size={12} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Card>

        <SectionHeading
          title="Hero Highlight Metrics"
          description="Custom achievement stats shown on the hero card (e.g. 10+ Completed Projects)"
        />

        <Card className="mb-5">
          <View className="mb-3">
            <Input
              label="Metric Value"
              placeholder="e.g. 10+ or 500+"
              value={newStatValue}
              onChangeText={setNewStatValue}
            />
            <Input
              label="Metric Label"
              placeholder="e.g. Completed Projects or LeetCode Solved"
              value={newStatLabel}
              onChangeText={setNewStatLabel}
            />
            <Button title="Add Metric" onPress={addHighlightStat} variant="secondary" />
          </View>

          {formData.highlightStats.map((stat, idx) => (
            <View
              key={idx}
              className="flex-row items-center justify-between py-2 border-b border-slate-200"
            >
              <View>
                <Text style={{ color: accentColor || "#2563eb" }} className="text-base font-bold">
                  {stat.value}
                </Text>
                <Text className="text-slate-500 text-xs">{stat.label}</Text>
              </View>
              <TouchableOpacity onPress={() => removeHighlightStat(idx)} className="p-2">
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        <Button
          title={saving ? "Saving Changes..." : "Save Profile Details"}
          onPress={handleSave}
          loading={saving}
          size="lg"
        />
      </ScrollView>
    </View>
  );
};
