import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl, Image } from "react-native";
import { Header } from "../components/ui/Header";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SectionHeading } from "../components/ui/SectionHeading";
import { apiRequest, uploadMediaFile } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../context/ToastContext";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Image as ImageIcon, Trash2, Copy, Check } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

export const MediaScreen: React.FC = () => {
  const { accentColor } = useAuth();
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await apiRequest("/api/admin/media");
      const list = res.data?.assets || (Array.isArray(res.data) ? res.data : []);
      setMediaAssets(list);
    } catch (err) {
      console.error("Media fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedia();
    setRefreshing(false);
  };

  const handlePickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.warning("Media library permission is required to upload images.", "Permission");
      return;
    }

    const pickerRes = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!pickerRes.canceled && pickerRes.assets[0]?.uri) {
      setUploading(true);
      setUploadProgress(5);
      setUploadStatus("Starting upload...");
      const uploadRes = await uploadMediaFile(
        pickerRes.assets[0].uri,
        pickerRes.assets[0].fileName || "portfolio-asset.jpg",
        pickerRes.assets[0].mimeType || "image/jpeg",
        pickerRes.assets[0].base64,
        (pct, status) => {
          setUploadProgress(pct);
          setUploadStatus(status);
        }
      );
      setUploading(false);

      if (uploadRes.success) {
        toast.success("Asset uploaded to Cloudinary successfully.");
        await fetchMedia();
      } else {
        toast.error(uploadRes.error || "Failed to upload asset.");
      }
    }
  };

  const handleDeleteMedia = (publicId: string) => {
    setDeleteTargetId(publicId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const pid = deleteTargetId;
    setDeleteTargetId(null);
    const res = await apiRequest("/api/admin/media", {
      method: "DELETE",
      body: JSON.stringify({ public_id: pid }),
    });
    if (res.success) {
      toast.success("Asset deleted successfully.");
      await fetchMedia();
    } else {
      toast.error(res.error || "Failed to delete file.");
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    setCopiedId(id);
    toast.info("Asset URL copied to clipboard.");
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Header
        title="Media Assets"
        subtitle="Upload and manage Cloudinary media files, avatars, project screenshots and icons"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }
      >
        <SectionHeading
          title="Asset Library"
          description={`Showing ${mediaAssets.length} assets`}
          action={
            <Button
              title={uploading ? "Uploading..." : "Upload Asset"}
              size="sm"
              loading={uploading}
              onPress={handlePickAndUpload}
            />
          }
        />

        {uploading ? (
          <Card className="mb-4 p-4 border border-blue-200 bg-blue-50/50">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-slate-800 text-xs font-semibold">{uploadStatus}</Text>
              <Text style={{ color: accentColor || "#2563eb" }} className="text-xs font-bold">
                {uploadProgress}%
              </Text>
            </View>
            <View className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <View
                style={{
                  width: `${uploadProgress}%`,
                  backgroundColor: accentColor || "#2563eb",
                  height: "100%",
                  borderRadius: 9999,
                }}
              />
            </View>
          </Card>
        ) : null}

        {mediaAssets.length === 0 ? (
          <Card className="items-center py-8">
            <ImageIcon size={32} color="#94a3b8" className="mb-2" />
            <Text className="text-slate-500 text-xs">No media files uploaded yet</Text>
          </Card>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {mediaAssets.map((asset) => {
              const assetUrl = asset.url || asset.secure_url;
              const publicId = asset.public_id;
              return (
                <View key={publicId || assetUrl} style={{ width: "48%" }} className="mb-3">
                  <Card className="p-2">
                    <Image
                      source={{ uri: assetUrl }}
                      style={{ width: "100%", height: 110, borderRadius: 6, backgroundColor: "#f1f5f9" }}
                      resizeMode="cover"
                    />

                    <View className="flex-row items-center justify-between mt-2 pt-1 border-t border-slate-200">
                      <TouchableOpacity
                        onPress={() => handleCopyUrl(assetUrl, publicId)}
                        className="flex-row items-center p-1"
                      >
                        {copiedId === publicId ? (
                          <Check size={14} color="#059669" />
                        ) : (
                          <Copy size={14} color="#64748b" />
                        )}
                        <Text className="text-slate-500 text-[11px] ml-1">Copy</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteMedia(publicId)}
                        className="p-1"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Custom Confirmation Modal for Asset Deletion */}
      <ConfirmModal
        visible={!!deleteTargetId}
        title="Delete Asset?"
        message="Are you sure you want to permanently delete this media file from Cloudinary?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
        iconType="delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
};
