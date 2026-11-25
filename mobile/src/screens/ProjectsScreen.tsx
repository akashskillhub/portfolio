import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl, Image } from "react-native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { SwitchItem } from "../components/ui/SwitchItem";
import { ModalWrapper } from "../components/ui/ModalWrapper";
import { Badge } from "../components/ui/Badge";
import { ImageUploader } from "../components/ui/ImageUploader";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { Plus, Trash2, Edit2, FolderKanban, ExternalLink, Code2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const ProjectsScreen: React.FC = () => {
  const { accentColor } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    category: "",
    thumbnailUrl: "",
    liveUrl: "",
    githubUrl: "",
    isFeatured: false,
    technologies: [] as string[],
  });

  const [techInput, setTechInput] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, catsRes] = await Promise.all([
        apiRequest("/api/admin/projects"),
        apiRequest("/api/admin/project-categories"),
      ]);

      const projectsList = projectsRes.data?.projects || (Array.isArray(projectsRes.data) ? projectsRes.data : []);
      const catsList = catsRes.data?.categories || (Array.isArray(catsRes.data) ? catsRes.data : []);

      setProjects(projectsList);
      setCategories(catsList);
    } catch (err) {
      console.error("Projects fetch error:", err);
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

  const openAddProject = () => {
    setEditingProject(null);
    setForm({
      title: "",
      slug: "",
      shortDescription: "",
      longDescription: "",
      category: categories[0]?._id || categories[0]?.name || "",
      thumbnailUrl: "",
      liveUrl: "",
      githubUrl: "",
      isFeatured: false,
      technologies: [],
    });
    setTechInput("");
    setModalVisible(true);
  };

  const handleTitleChange = (t: string) => {
    setForm((p) => {
      const isAuto = !p.slug || p.slug === slugify(p.title);
      return {
        ...p,
        title: t,
        slug: isAuto ? slugify(t) : p.slug,
      };
    });
  };

  const openEditProject = (p: any) => {
    setEditingProject(p);
    const catVal = p.categoryId?._id || p.categoryId?.name || p.categoryId || p.category?.name || p.category || (categories[0]?._id || "");
    setForm({
      title: p.title || "",
      slug: p.slug || "",
      shortDescription: p.shortDescription || "",
      longDescription: p.fullDescription || p.longDescription || "",
      category: catVal,
      thumbnailUrl: p.heroImageUrl || p.thumbnailUrl || "",
      liveUrl: p.liveUrl || "",
      githubUrl: p.sourceUrl || p.githubUrl || "",
      isFeatured: !!p.isFeatured,
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
    });
    setTechInput("");
    setModalVisible(true);
  };

  const addTechChip = () => {
    if (!techInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      technologies: [...prev.technologies, techInput.trim()],
    }));
    setTechInput("");
  };

  const removeTechChip = (index: number) => {
    setForm((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index),
    }));
  };

  const handleSaveProject = async () => {
    if (!form.title.trim() || !form.shortDescription.trim()) {
      toast.error("Title and short description are required.", "Validation");
      return;
    }

    // Resolve categoryId
    let catId = form.category;
    const matchedCat = categories.find((c) => c._id === form.category || c.name === form.category);
    if (matchedCat) {
      catId = matchedCat._id;
    } else if (categories[0]?._id) {
      catId = categories[0]._id;
    }

    const fullDesc = form.longDescription.trim().length >= 20
      ? form.longDescription.trim()
      : (form.shortDescription.trim().length >= 20 ? form.shortDescription.trim() : `${form.shortDescription.trim()} - Detailed project overview and implementation details.`);

    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      shortDescription: form.shortDescription.trim().length >= 10 ? form.shortDescription.trim() : `${form.shortDescription.trim()} overview`,
      fullDescription: fullDesc,
      categoryId: catId,
      heroImageUrl: form.thumbnailUrl,
      sourceUrl: form.githubUrl,
      technologies: form.technologies.length > 0 ? form.technologies : ["TypeScript"],
    };

    if (editingProject) {
      const res = await apiRequest("/api/admin/projects", {
        method: "PUT",
        body: JSON.stringify({
          _id: editingProject._id,
          ...payload,
        }),
      });
      if (!res.success) {
        toast.error(res.error || "Failed to update project.");
        return;
      }
      toast.success("Project updated successfully.");
    } else {
      const res = await apiRequest("/api/admin/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        toast.error(res.error || "Failed to create project.");
        return;
      }
      toast.success("Project published successfully.");
    }

    setModalVisible(false);
    await fetchData();
  };

  const handleDeleteProject = (id: string, title: string) => {
    Alert.alert("Confirm Deletion", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiRequest(`/api/admin/projects?id=${id}`, { method: "DELETE" });
          if (res.success) {
            toast.success("Project deleted successfully.");
            await fetchData();
          } else {
            toast.error(res.error || "Failed to delete project.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Projects Portfolio"
        subtitle="Manage software projects, live deployments, repository links and tech stacks"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }
      >
        <SectionHeading
          title="Project Showcase"
          description={`Total of ${projects.length} projects configured`}
          action={
            <Button
              title="Add Project"
              size="sm"
              onPress={openAddProject}
            />
          }
        />

        {projects.length === 0 ? (
          <Card className="items-center py-8">
            <FolderKanban size={32} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No projects created yet</Text>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project._id} className="mb-4">
              {project.thumbnailUrl ? (
                <Image
                  source={{ uri: project.thumbnailUrl }}
                  style={{ width: "100%", height: 140, borderRadius: 8, marginBottom: 10 }}
                  resizeMode="cover"
                />
              ) : null}

              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <Text className="text-slate-900 text-base font-bold mr-2">
                      {project.title}
                    </Text>
                    {project.isFeatured ? (
                      <Badge label="Featured" variant="default" />
                    ) : null}
                  </View>
                  <Text style={{ color: accentColor || "#2563eb" }} className="text-xs font-semibold mt-0.5">
                    {typeof project.category === "object" ? project.category?.name : project.category || "Full Stack"}
                  </Text>
                </View>

                <View className="flex-row items-center space-x-1">
                  <TouchableOpacity onPress={() => openEditProject(project)} className="p-2 mr-1">
                    <Edit2 size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProject(project._id, project.title)}
                    className="p-2"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-slate-500 text-xs mb-3 leading-relaxed">
                {project.shortDescription}
              </Text>

              {Array.isArray(project.technologies) && project.technologies.length > 0 ? (
                <View className="flex-row flex-wrap mb-3">
                  {project.technologies.map((tech: string, idx: number) => (
                    <View
                      key={idx}
                      className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md mr-1.5 mb-1.5"
                    >
                      <Text className="text-slate-700 text-xs font-medium">{tech}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View className="flex-row items-center space-x-3 pt-2 border-t border-slate-800">
                {project.liveUrl ? (
                  <View className="flex-row items-center mr-4">
                    <ExternalLink size={13} color="#2563eb" />
                    <Text className="text-sky-400 text-xs ml-1 font-medium">Live Demo</Text>
                  </View>
                ) : null}
                {project.githubUrl ? (
                  <View className="flex-row items-center">
                    <Code2 size={13} color="#cbd5e1" />
                    <Text className="text-slate-300 text-xs ml-1 font-medium">Repository</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <ModalWrapper
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingProject ? "Edit Project" : "Add Project"}
      >
        <Input
          label="Project Title"
          placeholder="e.g. Distributed Cloud Platform"
          value={form.title}
          onChangeText={handleTitleChange}
        />

        <Input
          label="URL Slug (Auto-generated)"
          placeholder="e.g. distributed-cloud-platform"
          value={form.slug}
          onChangeText={(t) => setForm((p) => ({ ...p, slug: t }))}
          helperText="Auto-generated from title, or enter a custom slug"
        />

        <Input
          label="Short Summary"
          placeholder="Crisp overview of the architecture and features"
          multiline
          numberOfLines={2}
          value={form.shortDescription}
          onChangeText={(t) => setForm((p) => ({ ...p, shortDescription: t }))}
        />

        <Input
          label="Detailed Description"
          placeholder="In-depth explanation of problem statement, architecture and impact"
          multiline
          numberOfLines={4}
          value={form.longDescription}
          onChangeText={(t) => setForm((p) => ({ ...p, longDescription: t }))}
        />

        <Select
          label="Category"
          options={categories.map((c) => ({ label: c.name, value: c._id || c.name }))}
          value={form.category}
          onValueChange={(val) => setForm((p) => ({ ...p, category: val }))}
          placeholder="Select a project category"
          accentColor={accentColor}
        />

        <ImageUploader
          label="Project Thumbnail"
          value={form.thumbnailUrl}
          onChange={(url) => setForm((p) => ({ ...p, thumbnailUrl: url }))}
          aspectRatio={16 / 9}
          aspect={[16, 9]}
          accentColor={accentColor}
          fileNamePrefix="project-thumb"
        />

        <Input
          label="Live Deployment URL"
          placeholder="https://example.com"
          value={form.liveUrl}
          onChangeText={(t) => setForm((p) => ({ ...p, liveUrl: t }))}
        />

        <Input
          label="GitHub / Source Code URL"
          placeholder="https://github.com/user/project"
          value={form.githubUrl}
          onChangeText={(t) => setForm((p) => ({ ...p, githubUrl: t }))}
        />

        <View className="mb-4">
          <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
            Technologies & Frameworks
          </Text>
          <View className="flex-row items-center mb-2">
            <View className="flex-1 mr-2">
              <Input
                placeholder="e.g. Next.js, Redis, Tailwind"
                value={techInput}
                onChangeText={setTechInput}
                style={{ marginBottom: 0 }}
              />
            </View>
            <Button title="Add" onPress={addTechChip} size="md" />
          </View>
          <View className="flex-row flex-wrap">
            {form.technologies.map((tech, idx) => (
              <View
                key={idx}
                className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1 flex-row items-center mr-2 mb-2"
              >
                <Text className="text-slate-200 text-xs font-medium mr-1.5">{tech}</Text>
                <TouchableOpacity onPress={() => removeTechChip(idx)}>
                  <Trash2 size={12} color="#f87171" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <SwitchItem
          label="Featured Project"
          description="Pin to top spotlight on the homepage and mobile portfolio"
          value={form.isFeatured}
          onValueChange={(val) => setForm((p) => ({ ...p, isFeatured: val }))}
        />

        <View className="flex-row justify-end space-x-2 mt-4">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setModalVisible(false)}
            className="mr-2"
          />
          <Button
            title="Save Project"
            onPress={handleSaveProject}
          />
        </View>
      </ModalWrapper>
    </View>
  );
};
