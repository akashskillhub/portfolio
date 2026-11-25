import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadMediaFile } from "../../services/api";
import { toast } from "../../context/ToastContext";
import { ConfirmModal } from "./ConfirmModal";
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw } from "lucide-react-native";

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: number;
  shape?: "rounded" | "circle" | "banner";
  aspect?: [number, number];
  accentColor?: string;
  fileNamePrefix?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 16 / 9,
  shape = "rounded",
  aspect = [16, 9],
  accentColor = "#2563eb",
  fileNamePrefix = "upload",
  helperText,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [localUri, setLocalUri] = useState<string | null>(null);

  // Custom confirmation modals
  const [confirmRemoveVisible, setConfirmRemoveVisible] = useState(false);
  const [confirmChangeVisible, setConfirmChangeVisible] = useState(false);

  const launchPicker = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast.warning(
          "Media library access is needed to select an image from your device.",
          "Permission Required"
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect,
        quality: 0.85,
        base64: true,
      });

      if (res.canceled || !res.assets[0]?.uri) {
        return;
      }

      const asset = res.assets[0];
      setLocalUri(asset.uri);
      setUploading(true);
      setProgress(5);
      setStatusText("Initializing...");

      const uploadRes = await uploadMediaFile(
        asset.uri,
        `${fileNamePrefix}-${Date.now()}.jpg`,
        asset.mimeType || "image/jpeg",
        asset.base64,
        (percent, status) => {
          // Strictly clamp percentage between 0% and 100%
          const safePercent = Math.min(Math.max(Math.round(percent), 0), 100);
          setProgress(safePercent);
          // Sanitize any percentage text above 100%
          const safeStatus = status.replace(/\b(\d{3,})%/g, (match, digits) => {
            return parseInt(digits, 10) > 100 ? "100%" : match;
          });
          setStatusText(safeStatus);
        }
      );

      setUploading(false);

      if (uploadRes.success && uploadRes.url) {
        onChange(uploadRes.url);
        setLocalUri(null);
        toast.success("Image uploaded successfully.");
      } else {
        setLocalUri(null);
        toast.error(uploadRes.error || "Failed to upload image.", "Upload Error");
      }
    } catch (err: any) {
      setUploading(false);
      setLocalUri(null);
      toast.error(err?.message || "Failed to select image.");
    }
  };

  const handlePickPress = () => {
    if (value || localUri) {
      // Image already exists: ask confirmation before replacing
      setConfirmChangeVisible(true);
    } else {
      // Empty dropzone: pick directly
      launchPicker();
    }
  };

  const handleConfirmRemove = () => {
    onChange("");
    setLocalUri(null);
    setConfirmRemoveVisible(false);
    toast.info("Image removed.");
  };

  const displayUri = localUri || value;
  const isCircle = shape === "circle";
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, isCircle && styles.containerCentered]}>
      {label ? (
        <Text style={[styles.label, isCircle && styles.labelCentered]}>{label}</Text>
      ) : null}

      {displayUri ? (
        <View style={isCircle ? styles.circleWrapper : styles.rectWrapper}>
          {/* Preview Image Frame */}
          <View
            style={[
              styles.previewFrame,
              isCircle
                ? styles.circleFrame
                : { width: "100%", aspectRatio, borderRadius: 10 },
            ]}
          >
            <Image
              source={{ uri: displayUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            {/* Uploading Overlay */}
            {uploading ? (
              <View style={styles.progressOverlay}>
                <ActivityIndicator size="small" color="#ffffff" style={{ marginBottom: 6 }} />
                <Text style={styles.progressText}>{clampedProgress}%</Text>
                <Text style={styles.statusText} numberOfLines={1}>
                  {statusText}
                </Text>

                {/* Real-time Progress Bar Capped at 100% */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${clampedProgress}%`,
                        backgroundColor: accentColor || "#3b82f6",
                      },
                    ]}
                  />
                </View>
              </View>
            ) : null}
          </View>

          {/* Action Buttons: Positioned directly underneath for circle shape or below rectangular preview */}
          {!uploading && (
            <View style={isCircle ? styles.circleActionsRow : styles.rectActionsRow}>
              <TouchableOpacity
                onPress={() => setConfirmChangeVisible(true)}
                style={styles.actionBtnChange}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color="#334155" />
                <Text style={styles.actionBtnChangeText}>Change Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmRemoveVisible(true)}
                style={styles.actionBtnRemove}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color="#dc2626" />
                <Text style={styles.actionBtnRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePickPress}
          disabled={uploading}
          style={[
            styles.emptyDropzone,
            isCircle
              ? styles.circleFrame
              : { width: "100%", aspectRatio, borderRadius: 10 },
          ]}
          activeOpacity={0.7}
        >
          {uploading ? (
            <View style={styles.emptyUploadingContent}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={styles.emptyProgressText}>{clampedProgress}%</Text>
              <Text style={styles.emptyStatusText}>{statusText}</Text>
              <View style={styles.progressBarTrackLight}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${clampedProgress}%`,
                      backgroundColor: accentColor || "#2563eb",
                    },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.emptyContent}>
              <View style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]}>
                <UploadCloud size={24} color={accentColor || "#2563eb"} />
              </View>
              <Text style={styles.emptyTitle}>
                {isCircle ? "Select Avatar" : "Tap to select image"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isCircle ? "Square 1:1 format" : "JPG, PNG or WEBP"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {helperText ? (
        <Text style={[styles.helperText, isCircle && styles.helperTextCentered]}>
          {helperText}
        </Text>
      ) : null}

      {/* Custom Confirmation Modal: Remove Image */}
      <ConfirmModal
        visible={confirmRemoveVisible}
        title="Remove Photo?"
        message="Are you sure you want to remove this photo? You can select and upload a new one at any time."
        confirmText="Remove Photo"
        cancelText="Keep Photo"
        confirmVariant="destructive"
        iconType="delete"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveVisible(false)}
      />

      {/* Custom Confirmation Modal: Change Image */}
      <ConfirmModal
        visible={confirmChangeVisible}
        title="Change Photo?"
        message="Do you want to select a new image from your device to replace the current photo?"
        confirmText="Select Image"
        cancelText="Cancel"
        confirmVariant="primary"
        iconType="warning"
        onConfirm={() => {
          setConfirmChangeVisible(false);
          launchPicker();
        }}
        onCancel={() => setConfirmChangeVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  containerCentered: {
    alignItems: "center",
  },
  label: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  labelCentered: {
    textAlign: "center",
  },
  circleWrapper: {
    alignItems: "center",
  },
  rectWrapper: {
    width: "100%",
  },
  previewFrame: {
    position: "relative",
    backgroundColor: "#f1f5f9",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  circleFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  progressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  statusText: {
    color: "#cbd5e1",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
    textAlign: "center",
  },
  progressBarTrack: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressBarTrackLight: {
    width: 130,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 9999,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 9999,
  },
  circleActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  rectActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  actionBtnChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnChangeText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  actionBtnRemove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnRemoveText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyDropzone: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  emptyUploadingContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 1,
  },
  emptyProgressText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  emptyStatusText: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 6,
  },
  helperTextCentered: {
    textAlign: "center",
  },
});
