import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
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
import { Plus, Trash2, Edit2, GraduationCap } from "lucide-react-native";

export const AboutScreen: React.FC = () => {
  const { accentColor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    bio: "",
    quote: "",
    philosophy: "",
    showPhone: true,
    showEmail: true,
    showLocation: true,
    education: [] as any[],
  });

  const [eduModalVisible, setEduModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [eduForm, setEduForm] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
    grade: "",
    description: "",
  });

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    setLoading(true);
    const res = await apiRequest("/api/admin/about");
    const about = res.data?.about || res.data;
    if (res.success && about) {
      setFormData({
        bio: about.biography || about.bio || "",
        quote: about.quote || "",
        philosophy: about.learningApproach?.philosophy || about.philosophy || "",
        showPhone: about.publicFieldToggles?.showPhone ?? about.showPhone ?? false,
        showEmail: about.publicFieldToggles?.showEmail ?? about.showEmail ?? true,
        showLocation: about.publicFieldToggles?.showLocation ?? about.showLocation ?? true,
        education: Array.isArray(about.education) ? about.education : [],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      biography: formData.bio,
      bio: formData.bio,
      learningApproach: { philosophy: formData.philosophy },
      philosophy: formData.philosophy,
      publicFieldToggles: {
        showEmail: formData.showEmail,
        showPhone: formData.showPhone,
        showLocation: formData.showLocation,
      },
      showEmail: formData.showEmail,
      showPhone: formData.showPhone,
      showLocation: formData.showLocation,
      quote: formData.quote,
      education: formData.education,
    };

    const res = await apiRequest("/api/admin/about", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.success) {
      toast.success("About & Education updated successfully.");
    } else {
      toast.error(res.error || "Failed to update about details.");
    }
  };

  const openAddEdu = () => {
    setEditingIndex(null);
    setEduForm({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      grade: "",
      description: "",
    });
    setEduModalVisible(true);
  };

  const openEditEdu = (index: number) => {
    setEditingIndex(index);
    const item = formData.education[index];
    setEduForm({
      institution: item.institution || "",
      degree: item.degree || "",
      fieldOfStudy: item.fieldOfStudy || "",
      startYear: String(item.startYear || ""),
      endYear: String(item.endYear || ""),
      grade: item.grade || "",
      description: item.description || "",
    });
    setEduModalVisible(true);
  };

  const saveEduItem = () => {
    if (!eduForm.institution.trim() || !eduForm.degree.trim()) {
      toast.error("Institution and Degree are required.", "Validation");
      return;
    }

    const newEduList = [...formData.education];
    if (editingIndex !== null) {
      newEduList[editingIndex] = { ...eduForm };
    } else {
      newEduList.push({ ...eduForm });
    }

    setFormData((prev) => ({ ...prev, education: newEduList }));
    setEduModalVisible(false);
  };

  const deleteEduItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="About & Education"
        subtitle="Professional narrative, public visibility preferences, and academic qualifications"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <SectionHeading
          title="Candidate Narrative"
          description="Detailed bio story and professional perspective"
        />

        <Card className="mb-5">
          <Input
            label="Biography & Professional Story"
            placeholder="Introduce your background, strengths and passions..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={formData.bio}
            onChangeText={(t) => setFormData((p) => ({ ...p, bio: t }))}
          />

          <Input
            label="Inspirational Quote / Motto"
            placeholder="e.g. Code is poetry written to solve real-world problems."
            value={formData.quote}
            onChangeText={(t) => setFormData((p) => ({ ...p, quote: t }))}
          />

          <Input
            label="Engineering Philosophy & Learning Approach"
            placeholder="Detail how you approach architecture, tests and craftsmanship..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.philosophy}
            onChangeText={(t) => setFormData((p) => ({ ...p, philosophy: t }))}
          />
        </Card>

        <SectionHeading
          title="Contact Visibility Controls"
          description="Choose which contact channels are publicly visible on your portfolio"
        />

        <Card className="mb-5">
          <SwitchItem
            label="Show Phone Number"
            description="Expose mobile contact number on the contact and header sections"
            value={formData.showPhone}
            onValueChange={(val) => setFormData((p) => ({ ...p, showPhone: val }))}
          />

          <SwitchItem
            label="Show Email Address"
            description="Expose email address for direct inquiries"
            value={formData.showEmail}
            onValueChange={(val) => setFormData((p) => ({ ...p, showEmail: val }))}
          />

          <SwitchItem
            label="Show Location"
            description="Expose city, state, or country on the portfolio"
            value={formData.showLocation}
            onValueChange={(val) => setFormData((p) => ({ ...p, showLocation: val }))}
          />
        </Card>

        <SectionHeading
          title="Academic Qualifications"
          description="Universities, degrees, and academic milestones"
          action={
            <Button
              title="Add Education"
              size="sm"
              onPress={openAddEdu}
            />
          }
        />

        {formData.education.length === 0 ? (
          <Card className="items-center py-6 mb-5">
            <GraduationCap size={28} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No education qualifications added yet</Text>
          </Card>
        ) : (
          formData.education.map((edu, idx) => (
            <Card key={idx} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-slate-900 text-sm font-semibold">{edu.degree}</Text>
                  <Text style={{ color: accentColor || "#2563eb" }} className="text-xs font-medium">
                    {edu.institution}
                  </Text>
                  {edu.fieldOfStudy ? (
                    <Text className="text-slate-500 text-xs mt-0.5">
                      Major: {edu.fieldOfStudy}
                    </Text>
                  ) : null}
                  {(edu.startYear || edu.endYear) ? (
                    <Text className="text-slate-400 text-xs mt-1">
                      {edu.startYear} - {edu.endYear || "Present"} {edu.grade ? `• Grade: ${edu.grade}` : ""}
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity onPress={() => openEditEdu(idx)} className="p-2 mr-1">
                    <Edit2 size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteEduItem(idx)} className="p-2">
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}

        <Button
          title={saving ? "Saving Changes..." : "Save About & Education"}
          onPress={handleSave}
          loading={saving}
          size="lg"
          className="mt-2"
        />
      </ScrollView>

      <ModalWrapper
        visible={eduModalVisible}
        onClose={() => setEduModalVisible(false)}
        title={editingIndex !== null ? "Edit Education" : "Add Education"}
      >
        <Input
          label="Institution / University"
          placeholder="e.g. Stanford University"
          value={eduForm.institution}
          onChangeText={(t) => setEduForm((p) => ({ ...p, institution: t }))}
        />
        <Input
          label="Degree"
          placeholder="e.g. Bachelor of Science"
          value={eduForm.degree}
          onChangeText={(t) => setEduForm((p) => ({ ...p, degree: t }))}
        />
        <Input
          label="Field of Study / Major"
          placeholder="e.g. Computer Science & Software Engineering"
          value={eduForm.fieldOfStudy}
          onChangeText={(t) => setEduForm((p) => ({ ...p, fieldOfStudy: t }))}
        />
        <View className="flex-row space-x-2">
          <View className="flex-1 mr-2">
            <Input
              label="Start Year"
              placeholder="2020"
              keyboardType="numeric"
              value={eduForm.startYear}
              onChangeText={(t) => setEduForm((p) => ({ ...p, startYear: t }))}
            />
          </View>
          <View className="flex-1">
            <Input
              label="End Year"
              placeholder="2024"
              keyboardType="numeric"
              value={eduForm.endYear}
              onChangeText={(t) => setEduForm((p) => ({ ...p, endYear: t }))}
            />
          </View>
        </View>
        <Input
          label="Grade / GPA (Optional)"
          placeholder="e.g. 3.9 / 4.0 or First Class Honors"
          value={eduForm.grade}
          onChangeText={(t) => setEduForm((p) => ({ ...p, grade: t }))}
        />
        <Input
          label="Description / Honors (Optional)"
          placeholder="e.g. Dean's List, Research Assistant in Distributed Systems"
          multiline
          numberOfLines={3}
          value={eduForm.description}
          onChangeText={(t) => setEduForm((p) => ({ ...p, description: t }))}
        />

        <View className="flex-row justify-end space-x-2 mt-2">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setEduModalVisible(false)}
            className="mr-2"
          />
          <Button
            title="Save Qualification"
            onPress={saveEduItem}
          />
        </View>
      </ModalWrapper>
    </View>
  );
};
