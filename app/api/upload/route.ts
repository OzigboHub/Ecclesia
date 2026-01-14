import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadToS3, generateUniqueFileName } from '@/lib/s3';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401 }
			);
		}

		// Get the form data
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const parishionerId = formData.get('parishionerId') as string | null;

		if (!file) {
			return NextResponse.json(
				{ success: false, message: 'No file provided' },
				{ status: 400 }
			);
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return NextResponse.json(
				{ success: false, message: 'Only image files are allowed' },
				{ status: 400 }
			);
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ success: false, message: 'File size must be less than 5MB' },
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Generate unique filename
		const fileName = generateUniqueFileName(
			file.name,
			parishionerId || 'photo'
		);

		// Upload to S3
		const result = await uploadToS3(buffer, fileName, file.type);

		if (!result.success) {
			return NextResponse.json(
				{ success: false, message: result.error || 'Upload failed' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: 'File uploaded successfully',
			url: result.url,
		});
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json(
			{ success: false, message: 'Failed to upload file' },
			{ status: 500 }
		);
	}
}
