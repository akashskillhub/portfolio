import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG } from "../config/app";

let cachedToken: string | null = null;
let cachedApiUrl: string = (APP_CONFIG.apiUrl || "").replace(/\/+$/, "");

export async function initApiService(): Promise<void> {
  try {
    const [storedToken, storedUrl] = await Promise.all([
      AsyncStorage.getItem(APP_CONFIG.storageKeys.authToken).catch(() => null),
      AsyncStorage.getItem(APP_CONFIG.storageKeys.apiUrl).catch(() => null),
    ]);
    if (storedToken) cachedToken = storedToken;
    if (storedUrl) cachedApiUrl = storedUrl.replace(/\/+$/, "");
  } catch (error) {
    console.warn("AsyncStorage unavailable, falling back to memory:", error);
  }
}

export function setCachedToken(token: string | null) {
  cachedToken = token;
}

export function setCachedApiUrl(url: string) {
  cachedApiUrl = url.replace(/\/+$/, "");
}

export function getCachedApiUrl(): string {
  return cachedApiUrl;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; rawResponse?: Response }> {
  const method = options.method || "GET";
  const startTime = Date.now();
  try {
    if (!cachedApiUrl) {
      const missingUrlMsg = "API URL is not set. Please set EXPO_PUBLIC_API_URL in .env or provide it on the login screen.";
      if (__DEV__) {
        console.warn(`[HTTP ${method} FAIL] ${endpoint}: ${missingUrlMsg}`);
      }
      return {
        success: false,
        error: missingUrlMsg,
      };
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${cachedApiUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Send session cookie (works directly with unmodified Next.js cookies())
    // and Authorization header as fallback
    if (cachedToken) {
      headers["Cookie"] = `skillhub_admin_session=${cachedToken}`;
      headers["Authorization"] = `Bearer ${cachedToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    if (__DEV__) {
      if (response.ok) {
        console.log(`[HTTP ${method}] ${cleanEndpoint} -> ${response.status} (${duration}ms)`);
      } else {
        console.warn(`[HTTP ${method} FAIL] ${cleanEndpoint} -> ${response.status} (${duration}ms)`, data);
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `Request failed with status ${response.status}`,
        rawResponse: response,
      };
    }

    return {
      success: true,
      data: data?.data !== undefined ? data.data : data,
      rawResponse: response,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (__DEV__) {
      console.error(`[HTTP ${method} ERROR] ${endpoint} (${duration}ms):`, error?.message);
    }
    return {
      success: false,
      error: error?.message || "Network error. Please check your server connection.",
    };
  }
}

// Media upload to Cloudinary via backend-signed upload token with real-time progress
export async function uploadMediaFile(
  uri: string,
  fileName: string = "upload.jpg",
  mimeType: string = "image/jpeg",
  base64?: string | null,
  onProgress?: (percent: number, status: string) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!cachedApiUrl) {
      return {
        success: false,
        error: "API URL is not set. Please set EXPO_PUBLIC_API_URL in .env.",
      };
    }

    onProgress?.(15, "Authorizing upload...");

    // 1. Fetch backend signed token
    const signRes = await apiRequest<{
      apiKey: string;
      timestamp: number;
      signature: string;
      folder: string;
      cloudName: string;
    }>("/api/admin/media/sign", {
      method: "POST",
      body: JSON.stringify({ folder: "skillhub-portfolio" }),
    });

    if (!signRes.success || !signRes.data) {
      return {
        success: false,
        error: signRes.error || "Failed to generate signed upload token. Please check Cloudinary credentials on the web server.",
      };
    }

    const { apiKey, timestamp, signature, folder, cloudName } = signRes.data;

    onProgress?.(30, "Preparing image...");

    // 2. Build Cloudinary FormData
    const cloudFormData = new FormData();

    if (base64) {
      cloudFormData.append("file", `data:${mimeType};base64,${base64}`);
    } else {
      let blobAppended = false;
      try {
        const fileRes = await fetch(uri);
        const blob = await fileRes.blob();
        cloudFormData.append("file", blob, fileName);
        blobAppended = true;
      } catch (e) {
        // Fallback for native engine
      }

      if (!blobAppended) {
        // @ts-ignore
        cloudFormData.append("file", {
          uri,
          name: fileName,
          type: mimeType,
        });
      }
    }

    cloudFormData.append("api_key", apiKey);
    cloudFormData.append("timestamp", timestamp.toString());
    cloudFormData.append("signature", signature);
    cloudFormData.append("folder", folder);

    const cloudUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    onProgress?.(45, "Uploading to Cloudinary...");

    // 3. Upload directly to Cloudinary using XMLHttpRequest for byte-level progress
    const cloudData: any = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", cloudUploadUrl);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const ratio = Math.min(Math.max(event.loaded / event.total, 0), 1);
            const overallPct = Math.min(Math.round(45 + ratio * 45), 90);
            const uploadPct = Math.min(Math.round(ratio * 100), 100);
            onProgress(overallPct, `Uploading (${uploadPct}%)...`);
          }
        };
      }

      xhr.onload = () => {
        try {
          const resp = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(resp);
          } else {
            reject(new Error(resp?.error?.message || `Upload failed with status ${xhr.status}`));
          }
        } catch (e: any) {
          reject(new Error(`Failed to parse upload response: ${e?.message}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during Cloudinary upload"));
      };

      xhr.send(cloudFormData);
    }).catch(async (xhrError) => {
      // Fallback to fetch if XHR encounters an unexpected runtime error
      const fetchRes = await fetch(cloudUploadUrl, {
        method: "POST",
        body: cloudFormData,
      });
      const data = await fetchRes.json().catch(() => null);
      if (!fetchRes.ok || !data) {
        throw new Error(data?.error?.message || xhrError?.message || "Upload failed");
      }
      return data;
    });

    onProgress?.(92, "Registering media asset...");

    const fileUrl = cloudData.secure_url || cloudData.url;

    // 4. Register asset in backend database
    await apiRequest("/api/admin/media", {
      method: "POST",
      body: JSON.stringify({
        publicId: cloudData.public_id,
        url: cloudData.url,
        secureUrl: fileUrl,
        format: cloudData.format || fileName.split(".").pop() || "jpg",
        bytes: cloudData.bytes || 0,
        folder,
        assetType: "image",
        originalFilename: fileName,
      }),
    });

    onProgress?.(100, "Complete!");

    return {
      success: true,
      url: fileUrl,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error("[UPLOAD ERROR]", error);
    }
    return {
      success: false,
      error: error?.message || "Image upload failed. Check connection.",
    };
  }
}
