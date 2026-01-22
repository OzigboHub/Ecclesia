'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createAnnouncementSchema,
	type CreateAnnouncementInput,
	hierarchyLevelEnum,
} from '@/lib/validators/announcement.schema';
import {
	createAnnouncement,
	updateAnnouncement,
} from '@/app/actions/announcement.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type AnnouncementFormValues = CreateAnnouncementInput;

type AnnouncementFormData = AnnouncementFormValues & {
	id?: string;
	isPublished?: boolean;
};

interface AnnouncementFormProps {
	announcement?: AnnouncementFormData;
	onSuccess?: () => void;
}

const audienceOptions = [
	{ value: 'PARISH', label: 'Parish' },
	{ value: 'OUTSTATION', label: 'Outstation' },
] as const;

function formatDateTimeLocal(value?: Date) {
	if (!value) return '';
	const date = new Date(value);
	const offset = date.getTimezoneOffset();
	const local = new Date(date.getTime() - offset * 60000);
	return local.toISOString().slice(0, 16);
}

export function AnnouncementForm({
	announcement,
	onSuccess,
}: AnnouncementFormProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<AnnouncementFormValues>({
		resolver: zodResolver(
			createAnnouncementSchema
		) as Resolver<AnnouncementFormValues>,
		defaultValues: {
			title: announcement?.title ?? '',
			content: announcement?.content ?? '',
			targetLevels:
				announcement?.targetLevels?.length
					? announcement.targetLevels
					: [hierarchyLevelEnum.enum.PARISH],
			publishAt: announcement?.publishAt ?? new Date(),
			expiresAt: announcement?.expiresAt ?? undefined,
		},
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setError,
		setValue,
		watch,
	} = form;

	const selectedTargets = watch('targetLevels') ?? [];

	const toggleTarget = (value: (typeof audienceOptions)[number]['value']) => {
		const updated = selectedTargets.includes(value)
			? selectedTargets.filter((level) => level !== value)
			: [...selectedTargets, value];
		setValue('targetLevels', updated, { shouldValidate: true });
	};

	const onSubmit = (data: CreateAnnouncementInput) => {
		startTransition(async () => {
			const result =
				announcement?.id ?
					await updateAnnouncement(announcement.id, data)
				:	await createAnnouncement(data);

			if (result.success) {
				toast.success(result.message);
				router.refresh();
				onSuccess?.();
			} else {
				toast.error(result.message);
				if (result.errors) {
					Object.entries(result.errors).forEach(([field, messages]) => {
						setError(field as keyof CreateAnnouncementInput, {
							type: 'server',
							message: messages[0],
						});
					});
				}
			}
		});
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-4'
		>
			<div className='space-y-2'>
				<Label htmlFor='title'>Title *</Label>
				<Input
					id='title'
					{...register('title')}
					placeholder='Announcement title'
					disabled={isPending}
					aria-invalid={!!errors.title}
				/>
				{errors.title && (
					<p className='text-sm text-destructive'>{errors.title.message}</p>
				)}
			</div>

			<div className='space-y-2'>
				<Label htmlFor='content'>Message *</Label>
				<Textarea
					id='content'
					{...register('content')}
					placeholder='Write the announcement details...'
					rows={5}
					disabled={isPending}
				/>
				{errors.content && (
					<p className='text-sm text-destructive'>
						{errors.content.message}
					</p>
				)}
			</div>

			<div className='space-y-2'>
				<Label>Target Audience *</Label>
				<div className='grid gap-3 sm:grid-cols-2'>
					{audienceOptions.map((option) => (
						<label
							key={option.value}
							className='flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm'
						>
							<Checkbox
								checked={selectedTargets.includes(option.value)}
								onCheckedChange={() => toggleTarget(option.value)}
								disabled={isPending}
							/>
							<span>{option.label}</span>
						</label>
					))}
				</div>
				{errors.targetLevels && (
					<p className='text-sm text-destructive'>
						{errors.targetLevels.message}
					</p>
				)}
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<Label htmlFor='publishAt'>Publish Date *</Label>
					<Controller
						name='publishAt'
						control={control}
						render={({ field }) => (
							<Input
								id='publishAt'
								type='datetime-local'
								value={formatDateTimeLocal(field.value)}
								onChange={(event) => {
									const value = event.target.value;
									field.onChange(value ? new Date(value) : undefined);
								}}
								disabled={isPending}
								aria-invalid={!!errors.publishAt}
							/>
						)}
					/>
					{errors.publishAt && (
						<p className='text-sm text-destructive'>
							{errors.publishAt.message as string}
						</p>
					)}
				</div>
				<div className='space-y-2'>
					<Label htmlFor='expiresAt'>Expiry Date (Optional)</Label>
					<Controller
						name='expiresAt'
						control={control}
						render={({ field }) => (
							<Input
								id='expiresAt'
								type='datetime-local'
								value={formatDateTimeLocal(field.value)}
								onChange={(event) => {
									const value = event.target.value;
									field.onChange(value ? new Date(value) : undefined);
								}}
								disabled={isPending}
								aria-invalid={!!errors.expiresAt}
							/>
						)}
					/>
					{errors.expiresAt && (
						<p className='text-sm text-destructive'>
							{errors.expiresAt.message as string}
						</p>
					)}
				</div>
			</div>

			<div className='flex justify-end'>
				<Button
					type='submit'
					disabled={isPending}
				>
					{announcement?.id ? 'Update Announcement' : 'Create Announcement'}
				</Button>
			</div>
		</form>
	);
}
