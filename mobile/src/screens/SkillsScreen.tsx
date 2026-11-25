import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { ModalWrapper } from "../components/ui/ModalWrapper";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { Plus, Trash2, Edit2, Wrench, FolderPlus, FolderKanban } from "lucide-react-native";

export const SkillsScreen: React.FC = () => {
  const { accentColor } = useAuth();
  const [skills, setSkills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "",
    proficiency: "85",
    yearsOfExperience: "2",
  });

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [skillsRes, catsRes] = await Promise.all([
        apiRequest("/api/admin/skills"),
        apiRequest("/api/admin/skill-categories"),
      ]);

      const skillsList = skillsRes.data?.skills || (Array.isArray(skillsRes.data) ? skillsRes.data : []);
      const catsList = catsRes.data?.categories || (Array.isArray(catsRes.data) ? catsRes.data : []);

      setSkills(skillsList);
      setCategories(catsList);
    } catch (err) {
      console.error("Skills fetch error:", err);
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

  const openAddSkill = () => {
    setEditingSkill(null);
    setSkillForm({
      name: "",
      category: categories[0]?._id || categories[0]?.name || "",
      proficiency: "85",
      yearsOfExperience: "2",
    });
    setSkillModalVisible(true);
  };

  const openEditSkill = (skill: any) => {
    setEditingSkill(skill);
    const catVal = skill.categoryId?._id || skill.categoryId?.name || skill.categoryId || (typeof skill.category === "object" ? skill.category?._id || skill.category?.name : skill.category) || (categories[0]?._id || categories[0]?.name || "");
    setSkillForm({
      name: skill.name || "",
      category: catVal,
      proficiency: String(skill.proficiencyPercent || skill.proficiency || 85),
      yearsOfExperience: String(skill.yearsOfExperience || 2),
    });
    setSkillModalVisible(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert("Delete Category", `Are you sure you want to delete category "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiRequest(`/api/admin/skill-categories?id=${id}`, {
            method: "DELETE",
          });
          if (res.success) {
            toast.success("Category deleted successfully.");
            await fetchData();
          } else {
            toast.error(res.error || "Failed to delete category.");
          }
        },
      },
    ]);
  };

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim()) {
      toast.error("Skill name is required.", "Validation");
      return;
    }

    // Resolve categoryId
    let catId = skillForm.category;
    const matchedCat = categories.find((c) => c._id === skillForm.category || c.name === skillForm.category);
    if (matchedCat) {
      catId = matchedCat._id;
    } else if (categories[0]?._id) {
      catId = categories[0]._id;
    }

    const prof = parseInt(skillForm.proficiency, 10) || 80;

    const payload = {
      name: skillForm.name.trim(),
      categoryId: catId,
      category: skillForm.category,
      proficiency: prof,
      proficiencyPercent: prof,
      yearsOfExperience: parseFloat(skillForm.yearsOfExperience) || 1,
    };

    if (editingSkill) {
      const res = await apiRequest("/api/admin/skills", {
        method: "PUT",
        body: JSON.stringify({
          _id: editingSkill._id,
          ...payload,
        }),
      });
      if (!res.success) {
        toast.error(res.error || "Failed to update skill.");
        return;
      }
      toast.success("Skill updated successfully.");
    } else {
      const res = await apiRequest("/api/admin/skills", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        toast.error(res.error || "Failed to create skill.");
        return;
      }
      toast.success("Skill added successfully.");
    }

    setSkillModalVisible(false);
    await fetchData();
  };

  const handleDeleteSkill = (id: string, name: string) => {
    Alert.alert("Confirm Deletion", `Are you sure you want to delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiRequest(`/api/admin/skills?id=${id}`, { method: "DELETE" });
          if (res.success) {
            toast.success("Skill deleted successfully.");
            await fetchData();
          } else {
            toast.error(res.error || "Failed to delete skill.");
          }
        },
      },
    ]);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Category name is required.", "Validation");
      return;
    }

    const res = await apiRequest("/api/admin/skill-categories", {
      method: "POST",
      body: JSON.stringify({ name: newCatName.trim() }),
    });

    if (res.success) {
      toast.success("Category created successfully.");
      setNewCatName("");
      setCatModalVisible(false);
      await fetchData();
    } else {
      toast.error(res.error || "Failed to create category.");
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory === "all") return true;
    const catName = typeof s.category === "object" ? s.category?.name : s.category;
    return catName?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Skills & Capabilities"
        subtitle="Organize technical proficiencies, tools and capability categories"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }
      >
        <View className="flex-row items-center justify-between mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mr-2">
            <TouchableOpacity
              onPress={() => setSelectedCategory("all")}
              style={{
                backgroundColor: selectedCategory === "all" ? (accentColor || "#2563eb") : "#f1f5f9",
                borderColor: selectedCategory === "all" ? "transparent" : "#e2e8f0",
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginRight: 6,
              }}
            >
              <Text
                style={{
                  color: selectedCategory === "all" ? "#ffffff" : "#475569",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                All ({skills.length})
              </Text>
            </TouchableOpacity>

            {categories.map((c) => (
              <TouchableOpacity
                key={c._id || c.name}
                onPress={() => setSelectedCategory(c.name)}
                style={{
                  backgroundColor: selectedCategory === c.name ? (accentColor || "#2563eb") : "#f1f5f9",
                  borderColor: selectedCategory === c.name ? "transparent" : "#e2e8f0",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    color: selectedCategory === c.name ? "#ffffff" : "#475569",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setCatModalVisible(true)}
            className="p-2 bg-slate-100 border border-slate-200 rounded-lg"
          >
            <FolderPlus size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        <SectionHeading
          title="Capabilities List"
          description={`Showing ${filteredSkills.length} technical skills`}
          action={
            <Button
              title="Add Skill"
              size="sm"
              onPress={openAddSkill}
            />
          }
        />

        {filteredSkills.length === 0 ? (
          <Card className="items-center py-8">
            <Wrench size={32} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No technical skills in this category</Text>
          </Card>
        ) : (
          filteredSkills.map((skill) => {
            const catLabel = typeof skill.category === "object" ? skill.category?.name : skill.category;
            const proficiency = skill.proficiency || 80;
            return (
              <Card key={skill._id} className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1 pr-2">
                    <Text className="text-slate-900 text-sm font-semibold">{skill.name}</Text>
                    <Text className="text-slate-500 text-xs">
                      {catLabel || "General"} • {skill.yearsOfExperience || 1} yrs exp
                    </Text>
                  </View>

                  <View className="flex-row items-center space-x-1">
                    <TouchableOpacity onPress={() => openEditSkill(skill)} className="p-2 mr-1">
                      <Edit2 size={16} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSkill(skill._id, skill.name)}
                      className="p-2"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-slate-500 text-xs">Proficiency</Text>
                  <Text style={{ color: accentColor || "#2563eb" }} className="text-xs font-semibold">
                    {proficiency}%
                  </Text>
                </View>
                <View className="h-1.5 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${proficiency}%`,
                      backgroundColor: accentColor || "#2563eb",
                      height: "100%",
                      borderRadius: 9999,
                    }}
                  />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <ModalWrapper
        visible={skillModalVisible}
        onClose={() => setSkillModalVisible(false)}
        title={editingSkill ? "Edit Skill" : "Add Skill"}
      >
        <Input
          label="Skill Name"
          placeholder="e.g. TypeScript or Kubernetes"
          value={skillForm.name}
          onChangeText={(t) => setSkillForm((p) => ({ ...p, name: t }))}
        />

        <Select
          label="Skill Category"
          options={categories.map((c) => ({ label: c.name, value: c._id || c.name }))}
          value={skillForm.category}
          onValueChange={(val) => setSkillForm((p) => ({ ...p, category: val }))}
          placeholder="Select a category"
          onAddNew={() => {
            setSkillModalVisible(false);
            setCatModalVisible(true);
          }}
          addNewLabel="+ Manage Categories"
          accentColor={accentColor}
        />

        <Input
          label="Proficiency Percentage (1-100)"
          placeholder="85"
          keyboardType="numeric"
          value={skillForm.proficiency}
          onChangeText={(t) => setSkillForm((p) => ({ ...p, proficiency: t }))}
        />

        <Input
          label="Years of Practical Experience"
          placeholder="2"
          keyboardType="numeric"
          value={skillForm.yearsOfExperience}
          onChangeText={(t) => setSkillForm((p) => ({ ...p, yearsOfExperience: t }))}
        />

        <View className="flex-row justify-end space-x-2 mt-2">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setSkillModalVisible(false)}
            className="mr-2"
          />
          <Button
            title="Save Skill"
            onPress={handleSaveSkill}
          />
        </View>
      </ModalWrapper>

      <ModalWrapper
        visible={catModalVisible}
        onClose={() => setCatModalVisible(false)}
        title="Manage Skill Categories"
      >
        <View className="mb-4">
          <Text className="text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
            Create New Category
          </Text>
          <View className="flex-row items-center space-x-2">
            <View className="flex-1 mr-2">
              <Input
                placeholder="e.g. Cloud & DevOps"
                value={newCatName}
                onChangeText={setNewCatName}
                className="mb-0"
              />
            </View>
            <Button
              title="Add"
              size="sm"
              onPress={handleCreateCategory}
            />
          </View>
        </View>

        <View className="mt-3">
          <Text className="text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
            Existing Categories ({categories.length})
          </Text>
          {categories.length === 0 ? (
            <Text className="text-slate-400 text-xs py-2">No categories created yet</Text>
          ) : (
            categories.map((c) => (
              <View
                key={c._id || c.name}
                className="flex-row items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg mb-2"
              >
                <View className="flex-row items-center">
                  <FolderKanban size={16} color="#64748b" />
                  <Text className="text-slate-800 text-sm font-medium ml-2">{c.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(c._id, c.name)}
                  className="p-1.5 rounded-md bg-red-50"
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View className="flex-row justify-end mt-4">
          <Button
            title="Close"
            variant="outline"
            onPress={() => setCatModalVisible(false)}
          />
        </View>
      </ModalWrapper>
    </View>
  );
};
