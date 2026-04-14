import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File | null;
		const folderPrefix =
			(formData.get("folderPrefix") as string | null) || "user-avatar";
		const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
		const apiKey = process.env.CLOUDINARY_API_KEY;
		const apiSecret = process.env.CLOUDINARY_SECRET;

		if (!file) {
			return NextResponse.json(
				{ success: false, message: "No file provided" },
				{ status: 400 },
			);
		}

		if (!cloudName || !apiKey || !apiSecret) {
			return NextResponse.json(
				{ success: false, message: "Cloudinary is not configured" },
				{ status: 500 },
			);
		}

		if (!file.type.startsWith("image/")) {
			return NextResponse.json(
				{ success: false, message: "Only image files are allowed" },
				{ status: 400 },
			);
		}

		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ success: false, message: "File size must be less than 5MB" },
				{ status: 400 },
			);
		}

		const timestamp = Math.floor(Date.now() / 1000);
		const signatureBase = `folder=${folderPrefix}&timestamp=${timestamp}${apiSecret}`;
		const signature = crypto
			.createHash("sha1")
			.update(signatureBase)
			.digest("hex");

		const uploadForm = new FormData();
		uploadForm.append("file", file);
		uploadForm.append("api_key", apiKey);
		uploadForm.append("timestamp", timestamp.toString());
		uploadForm.append("signature", signature);
		uploadForm.append("folder", folderPrefix);

		const uploadResponse = await fetch(
			`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
			{
				method: "POST",
				body: uploadForm,
			},
		);

		const uploadResult = await uploadResponse.json();
		if (!uploadResponse.ok) {
			return NextResponse.json(
				{
					success: false,
					message: uploadResult?.error?.message || "Upload failed",
				},
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "File uploaded successfully",
			url: uploadResult.secure_url || uploadResult.url,
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to upload file" },
			{ status: 500 },
		);
	}
}
