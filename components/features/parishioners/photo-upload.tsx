'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateParishionerPhoto } from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, X, Link as LinkIcon } from 'lucide-react';

interface PhotoUploadProps {
	parishionerId: string;
	currentPhotoUrl?: string | null;
	parishionerName: string;
}

export function PhotoUpload({
	parishionerId,
	currentPhotoUrl,
	parishionerName,
}: PhotoUploadProps) {
	const [open, setOpen] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [photoUrl, setPhotoUrl] = useState('');
	const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl || '');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	const initials = parishionerName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image size must be less than 5MB');
			return;
		}

		setSelectedFile(file);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreviewUrl(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleUrlChange = (url: string) => {
		setPhotoUrl(url);
		setPreviewUrl(url);
		setSelectedFile(null);
	};

	const handleFileUpload = async () => {
		if (!selectedFile) {
			toast.error('Please select a file first');
			return;
		}

		setUploading(true);
		try {
			// Upload file to S3
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('parishionerId', parishionerId);

			const uploadResponse = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});

			const uploadResult = await uploadResponse.json();

			if (!uploadResult.success) {
				toast.error(uploadResult.message || 'Failed to upload file');
				return;
			}

			// Update parishioner with new photo URL
			const result = await updateParishionerPhoto(
				parishionerId,
				uploadResult.url
			);

			if (result.success) {
				toast.success('Photo uploaded successfully');
				setOpen(false);
				setSelectedFile(null);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to upload photo');
		} finally {
			setUploading(false);
		}
	};

	const handleUrlUpload = async () => {
		if (!photoUrl.trim()) {
			toast.error('Please enter a photo URL');
			return;
		}

		setUploading(true);
		try {
			const result = await updateParishionerPhoto(
				parishionerId,
				photoUrl
			);

			if (result.success) {
				toast.success(result.message);
				setOpen(false);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to update photo');
		} finally {
			setUploading(false);
		}
	};

	const handleRemove = async () => {
		setUploading(true);
		try {
			const result = await updateParishionerPhoto(parishionerId, '');

			if (result.success) {
				toast.success('Photo removed successfully');
				setPhotoUrl('');
				setPreviewUrl('');
				setSelectedFile(null);
				setOpen(false);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to remove photo');
		} finally {
			setUploading(false);
		}
	};

	const resetForm = () => {
		setPhotoUrl('');
		setPreviewUrl(currentPhotoUrl || '');
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	return (
		<>
			<div
				className='group relative cursor-pointer'
				onClick={() => setOpen(true)}
				title='Click to update photo'
			>
				<Avatar className='h-20 w-20 md:h-24 md:w-24'>
					<AvatarImage
						src={currentPhotoUrl || undefined}
						alt={parishionerName}
					/>
					<AvatarFallback className='text-xl md:text-2xl bg-primary/10 text-primary'>
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className='absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full'>
					<Camera className='h-5 w-5 md:h-6 md:w-6 text-white' />
				</div>
			</div>

			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) resetForm();
				}}
			>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Update Photo</DialogTitle>
						<DialogDescription>
							Upload a photo for {parishionerName}
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-6'>
						{/* Preview */}
						<div className='flex justify-center'>
							<Avatar className='h-32 w-32'>
								<AvatarImage
									src={previewUrl || undefined}
									alt={parishionerName}
								/>
								<AvatarFallback className='text-4xl bg-primary/10 text-primary'>
									{initials}
								</AvatarFallback>
							</Avatar>
						</div>

						<Tabs
							defaultValue='upload'
							className='w-full'
						>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value='upload'>
									<Upload className='mr-2 h-4 w-4' />
									Upload File
								</TabsTrigger>
								<TabsTrigger value='url'>
									<LinkIcon className='mr-2 h-4 w-4' />
									Enter URL
								</TabsTrigger>
							</TabsList>

							{/* File Upload Tab */}
							<TabsContent
								value='upload'
								className='space-y-4 mt-4'
							>
								<div className='space-y-2'>
									<Label htmlFor='photo-file'>
										Select Image
									</Label>
									<Input
										id='photo-file'
										ref={fileInputRef}
										type='file'
										accept='image/jpeg,image/png,image/webp'
										onChange={handleFileChange}
										disabled={uploading}
									/>
									<p className='text-xs text-muted-foreground'>
										Max file size: 5MB. Supported: JPG, PNG,
										WebP
									</p>
								</div>

								<Button
									onClick={handleFileUpload}
									disabled={uploading || !selectedFile}
									className='w-full'
								>
									{uploading ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Uploading...
										</>
									) : (
										<>
											<Upload className='mr-2 h-4 w-4' />
											Upload Photo
										</>
									)}
								</Button>
							</TabsContent>

							{/* URL Input Tab */}
							<TabsContent
								value='url'
								className='space-y-4 mt-4'
							>
								<div className='space-y-2'>
									<Label htmlFor='photo-url'>Photo URL</Label>
									<Input
										id='photo-url'
										type='url'
										value={photoUrl}
										onChange={(e) =>
											handleUrlChange(e.target.value)
										}
										placeholder='https://example.com/photo.jpg'
										disabled={uploading}
									/>
								</div>

								<Button
									onClick={handleUrlUpload}
									disabled={uploading || !photoUrl.trim()}
									className='w-full'
								>
									{uploading ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Saving...
										</>
									) : (
										<>
											<LinkIcon className='mr-2 h-4 w-4' />
											Save URL
										</>
									)}
								</Button>
							</TabsContent>
						</Tabs>

						{/* Remove Button */}
						{currentPhotoUrl && (
							<div className='pt-2 border-t'>
								<Button
									variant='destructive'
									onClick={handleRemove}
									disabled={uploading}
									className='w-full'
								>
									<X className='mr-2 h-4 w-4' />
									Remove Current Photo
								</Button>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
