import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { SwitchItem } from "../components/ui/SwitchItem";
import { ModalWrapper } from "../components/ui/ModalWrapper";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Select";
import { DatePicker } from "../components/ui/DatePicker";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { Plus, Trash2, Edit2, Briefcase, Calendar, MapPin } from "lucide-react-native";

const EMPLOYMENT_TYPES = [
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
  { label: "Internship", value: "Internship" },
  { label: "Freelance", value: "Freelance" },
];

export const ExperienceScreen: React.FC = () => {
  const { accentColor } = useAuth();
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingExp, setEditingExp] = useState<any | null>(null);

  const [form, setForm] = useState({
    role: "",
    company: "",
    location: "",
    type: "Full-time",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    highlights: [] as string[],
  });

  const [highlightInput, setHighlightInput] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest("/api/admin/experience");
      const list = res.data?.experiences || (Array.isArray(res.data) ? res.data : []);
      // Normalize properties for clean UI consumption
      const normalized = list.map((exp: any) => ({
        ...exp,
        role: exp.jobTitle || exp.role || "",
        company: exp.companyName || exp.company || "",
        type: exp.employmentType || exp.type || "Full-time",
        highlights: exp.responsibilities || exp.highlights || [],
      }));
      setExperiences(normalized);
    } catch (err) {
      console.error("Experience fetch error:", err);
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

  const openAddExp = () => {
    setEditingExp(null);
    setForm({
      role: "",
      company: "",
      location: "",
      type: "Full-time",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      highlights: [],
    });
    setHighlightInput("");
    setModalVisible(true);
  };

  const openEditExp = (item: any) => {
    setEditingExp(item);
    setForm({
      role: item.role || item.jobTitle || "",
      company: item.company || item.companyName || "",
      location: item.location || "",
      type: item.type || item.employmentType || "Full-time",
      startDate: item.startDate ? item.startDate.split("T")[0] : "",
      endDate: item.endDate ? item.endDate.split("T")[0] : "",
      isCurrent: !!item.isCurrent,
      description: item.description || "",
      highlights: Array.isArray(item.responsibilities)
        ? item.responsibilities
        : Array.isArray(item.highlights)
        ? item.highlights
        : [],
    });
    setHighlightInput("");
    setModalVisible(true);
  };

  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      highlights: [...prev.highlights, highlightInput.trim()],
    }));
    setHighlightInput("");
  };

  const removeHighlight = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveExp = async () => {
    const roleTrimmed = form.role.trim();
    const companyTrimmed = form.company.trim();
    const startDateTrimmed = form.startDate.trim();

    if (!roleTrimmed) {
      toast.error("Please enter the Job Role / Position.", "Required Field");
      return;
    }
    if (roleTrimmed.length < 2) {
      toast.error("Job Role must be at least 2 characters.", "Invalid Input");
      return;
    }
    if (!companyTrimmed) {
      toast.error("Please enter the Company / Organization name.", "Required Field");
      return;
    }
    if (companyTrimmed.length < 2) {
      toast.error("Company name must be at least 2 characters.", "Invalid Input");
      return;
    }
    if (!startDateTrimmed) {
      toast.error("Please select a Start Date using the calendar.", "Required Field");
      return;
    }
    if (!form.isCurrent && form.endDate.trim() && form.endDate.trim() < startDateTrimmed) {
      toast.error("End Date cannot be earlier than Start Date.", "Invalid Date");
      return;
    }

    const responsibilities = [
      ...(form.description.trim() ? [form.description.trim()] : []),
      ...form.highlights,
    ];

    const payload: any = {
      companyName: companyTrimmed,
      jobTitle: roleTrimmed,
      employmentType: form.type || "Full-time",
      location: form.location.trim() || undefined,
      startDate: startDateTrimmed,
      endDate: form.isCurrent ? undefined : form.endDate.trim() || undefined,
      isCurrent: !!form.isCurrent,
      responsibilities: responsibilities,
      achievements: form.highlights || [],
      technologies: [],
    };

    try {
      let res;
      if (editingExp) {
        res = await apiRequest("/api/admin/experience", {
          method: "PUT",
          body: JSON.stringify({
            _id: editingExp._id,
            ...payload,
          }),
        });
      } else {
        res = await apiRequest("/api/admin/experience", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (!res.success) {
        toast.error(res.error || "Failed to save experience.");
        return;
      }

      toast.success(
        editingExp ? "Career milestone updated successfully." : "Career milestone added successfully."
      );
      setModalVisible(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save experience.");
    }
  };

  const handleDeleteExp = (id: string, role: string, company: string) => {
    Alert.alert("Confirm Deletion", `Are you sure you want to delete "${role} at ${company}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiRequest(`/api/admin/experience?id=${id}`, { method: "DELETE" });
          if (res.success) {
            toast.success("Milestone removed successfully.");
            await fetchData();
          } else {
            toast.error(res.error || "Failed to delete experience.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Experience & Career"
        subtitle="Chronological work history, corporate positions and milestones"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }
      >
        <SectionHeading
          title="Career Timeline"
          description={`Showing ${experiences.length} positions and milestones`}
          action={
            <Button
              title="Add Experience"
              size="sm"
              onPress={openAddExp}
            />
          }
        />

        {experiences.length === 0 ? (
          <Card className="items-center py-8">
            <Briefcase size={32} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No career milestones recorded yet</Text>
          </Card>
        ) : (
          experiences.map((exp) => (
            <Card key={exp._id} className="mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="text-slate-900 text-base font-bold mr-2">{exp.role}</Text>
                    {exp.isCurrent ? (
                      <Badge label="Current Role" variant="success" />
                    ) : null}
                  </View>
                  <Text style={{ color: accentColor || "#2563eb" }} className="text-sm font-semibold mt-0.5">
                    {exp.company}
                  </Text>
                </View>

                <View className="flex-row items-center space-x-1">
                  <TouchableOpacity onPress={() => openEditExp(exp)} className="p-2 mr-1">
                    <Edit2 size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteExp(exp._id, exp.role, exp.company)}
                    className="p-2"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center space-x-3 mb-2">
                <View className="flex-row items-center mr-3">
                  <Calendar size={12} color="#64748b" />
                  <Text className="text-slate-500 text-xs ml-1">
                    {exp.startDate ? exp.startDate.substring(0, 7) : ""} -{" "}
                    {exp.isCurrent ? "Present" : exp.endDate ? exp.endDate.substring(0, 7) : "N/A"}
                  </Text>
                </View>
                {exp.location ? (
                  <View className="flex-row items-center">
                    <MapPin size={12} color="#64748b" />
                    <Text className="text-slate-500 text-xs ml-1">{exp.location}</Text>
                  </View>
                ) : null}
              </View>

              {exp.description ? (
                <Text className="text-slate-700 text-xs mb-2 leading-relaxed">
                  {exp.description}
                </Text>
              ) : null}

              {Array.isArray(exp.highlights) && exp.highlights.length > 0 ? (
                <View className="pt-2 border-t border-slate-200">
                  {exp.highlights.map((h: string, idx: number) => (
                    <View key={idx} className="flex-row items-start mb-1">
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: accentColor || "#2563eb",
                          marginTop: 6,
                          marginRight: 6,
                        }}
                      />
                      <Text className="text-slate-600 text-xs flex-1 leading-relaxed">{h}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      <ModalWrapper
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingExp ? "Edit Experience" : "Add Experience"}
      >
        <Input
          label="Job Role / Position"
          placeholder="e.g. Lead Software Architect"
          value={form.role}
          onChangeText={(t) => setForm((p) => ({ ...p, role: t }))}
        />

        <Input
          label="Company / Organization"
          placeholder="e.g. Google or Tech Startup"
          value={form.company}
          onChangeText={(t) => setForm((p) => ({ ...p, company: t }))}
        />

        <Input
          label="Location"
          placeholder="e.g. Mountain View, CA or Remote"
          value={form.location}
          onChangeText={(t) => setForm((p) => ({ ...p, location: t }))}
        />

        <Select
          label="Employment Type"
          value={form.type}
          options={EMPLOYMENT_TYPES}
          onValueChange={(val: string) => setForm((p) => ({ ...p, type: val }))}
        />

        <View className="flex-row space-x-2">
          <View className="flex-1 mr-2">
            <DatePicker
              label="Start Date"
              placeholder="Select date"
              value={form.startDate}
              onChange={(val) => setForm((p) => ({ ...p, startDate: val }))}
              required={true}
            />
          </View>
          <View className="flex-1">
            <DatePicker
              label="End Date"
              placeholder="Select date"
              value={form.endDate}
              disabled={form.isCurrent}
              disabledText="Present"
              onChange={(val) => setForm((p) => ({ ...p, endDate: val }))}
              allowClear={true}
            />
          </View>
        </View>

        <SwitchItem
          label="Currently Working Here"
          description="Sets end date to 'Present' on your profile"
          value={form.isCurrent}
          onValueChange={(val) =>
            setForm((p) => ({ ...p, isCurrent: val, endDate: val ? "" : p.endDate }))
          }
        />

        <Input
          label="General Description"
          placeholder="Core mission and scope of the role"
          multiline
          numberOfLines={3}
          value={form.description}
          onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
        />

        <View className="mb-4">
          <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
            Key Accomplishments & Bullet Points
          </Text>
          <View className="flex-row items-center mb-2">
            <View className="flex-1 mr-2">
              <Input
                placeholder="e.g. Reduced API latency by 42%..."
                value={highlightInput}
                onChangeText={setHighlightInput}
                style={{ marginBottom: 0 }}
              />
            </View>
            <Button title="Add" onPress={addHighlight} size="md" />
          </View>

          {form.highlights.map((h, idx) => (
            <View
              key={idx}
              className="flex-row items-center justify-between py-1.5 border-b border-slate-800"
            >
              <Text className="text-slate-300 text-xs flex-1 pr-2">{h}</Text>
              <TouchableOpacity onPress={() => removeHighlight(idx)} className="p-1">
                <Trash2 size={14} color="#f87171" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View className="flex-row justify-end space-x-2 mt-2">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setModalVisible(false)}
            className="mr-2"
          />
          <Button
            title="Save Milestone"
            onPress={handleSaveExp}
          />
        </View>
      </ModalWrapper>
    </View>
  );
};
