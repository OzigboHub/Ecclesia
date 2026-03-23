import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * S3 client configuration (works with AWS S3, DigitalOcean Spaces, etc.)
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";
const IMAGES_FOLDER = process.env.IMAGES_FOLDER || "uploads";

/**
 * Upload a file to S3/Spaces
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const key = `${IMAGES_FOLDER}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: "public-read",
    });

    await s3Client.send(command);

    // Construct the public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { success: true, url };
  } catch (error) {
    console.error("S3 upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a file from S3/Spaces
 */
export async function deleteFromS3(
  fileUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.slice(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error("S3 delete error:", error);
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
