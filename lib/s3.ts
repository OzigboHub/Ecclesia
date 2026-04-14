import crypto from "crypto";

const IMAGES_FOLDER = process.env.IMAGES_FOLDER || "uploads";

/**
 * Upload a file to Cloudinary using signed upload (REST API)
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return { success: false, error: "Cloudinary is not configured" };
    }

    const folder = IMAGES_FOLDER;
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureBase)
      .digest("hex");

    const blob = new Blob([new Uint8Array(file)], { type: contentType });
    const uploadForm = new FormData();
    uploadForm.append("file", blob, fileName);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp.toString());
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm },
    );

    const result = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || "Upload failed",
      };
    }

    return { success: true, url: result.secure_url || result.url };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a file from Cloudinary using signed API call
 */
export async function deleteFromS3(
  fileUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return { success: false, error: "Cloudinary is not configured" };
    }

    // Extract public_id from Cloudinary URL
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/upload/");
    if (parts.length < 2) {
      return { success: false, error: "Invalid Cloudinary URL" };
    }
    const afterUpload = parts[1].replace(/^v\d+\//, "");
    const publicId = afterUpload.replace(/\.[^/.]+$/, "");

    const timestamp = Math.floor(Date.now() / 1000);
    const signatureBase = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureBase)
      .digest("hex");

    const deleteForm = new FormData();
    deleteForm.append("public_id", publicId);
    deleteForm.append("api_key", apiKey);
    deleteForm.append("timestamp", timestamp.toString());
    deleteForm.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", body: deleteForm },
    );

    const result = await response.json();
    if (result.result !== "ok") {
      return { success: false, error: "Failed to delete image" };
    }

    return { success: true };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Generate a unique filename for uploads
 */
export function generateUniqueFileName(
  originalName: string,
  prefix: string = "",
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9-]/g, "");

  return `${
    sanitizedPrefix ? `${sanitizedPrefix}-` : ""
  }${timestamp}-${randomString}.${extension}`;
}
