import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getParishioner } from '@/app/actions/parishioner.actions';
import type { Sacrament, Payment } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
	ArrowLeft,
	Edit2,
	Mail,
	Phone,
	MapPin,
	Calendar,
	User,
	Heart,
} from 'lucide-react';
import Link from 'next/link';
import { DeleteParishionerButton } from '@/components/features/parishioners/delete-parishioner-button';
import { PhotoUpload } from '@/components/features/parishioners/photo-upload';
import { IssueAccessCode } from '@/components/features/parishioners/issue-access-code';
import { canManageParishioners } from '@/lib/permissions';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function ParishionerDetailPage({ params }: PageProps) {
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	const { id } = await params;
	const result = await getParishioner(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const parishioner = result.data;

	// Check edit/delete permissions
	const canEdit = [
		'SUPER_ADMIN',
		'PARISH_ADMIN',
		'PARISH_SECRETARY',
		'PARISH_STAFF',
		'OUTSTATION_ADMIN',
	].includes(session.user.role);

	const canDelete = ['SUPER_ADMIN', 'PARISH_ADMIN'].includes(
		session.user.role
	);

	// Format date
	const formatDate = (date: Date | null) => {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-NG', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	// Calculate age
	const calculateAge = (dob: Date | null) => {
		if (!dob) return null;
		const today = new Date();
		const birthDate = new Date(dob);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birthDate.getDate())
		) {
			age--;
		}
		return age;
	};

	const age = calculateAge(parishioner.dateOfBirth);

	return (
		<div className='space-y-6 max-w-4xl'>
			{/* Header */}
			<div className='flex items-start justify-between gap-4'>
				<div className='flex items-start gap-4'>
					<Link href='/dashboard/parishioners'>
						<Button
							variant='ghost'
							size='icon'
						>
							<ArrowLeft className='h-5 w-5' />
						</Button>
					</Link>

					{/* Photo Upload */}
					<PhotoUpload
						parishionerId={parishioner.id}
						currentPhotoUrl={parishioner.photoUrl}
						parishionerName={`${parishioner.firstName} ${parishioner.lastName}`}
					/>

					<div>
						<h1 className='text-2xl md:text-3xl font-bold tracking-tight'>
							{parishioner.firstName} {parishioner.lastName}
						</h1>
						<p className='text-muted-foreground mt-1'>
							Parishioner Details
						</p>
					</div>
				</div>

				{canEdit && (
					<div className='flex gap-2'>
						<Link
							href={`/dashboard/parishioners/${parishioner.id}/edit`}
						>
							<Button variant='outline'>
								<Edit2 className='mr-2 h-4 w-4' />
								Edit
							</Button>
						</Link>
						{canDelete && (
							<DeleteParishionerButton
								parishionerId={parishioner.id}
								parishionerName={`${parishioner.firstName} ${parishioner.lastName}`}
							/>
						)}
					</div>
				)}
			</div>

			{canManageParishioners(session.user.role) && (
				<IssueAccessCode
					parishionerId={parishioner.id}
					parishionerName={`${parishioner.firstName} ${parishioner.lastName}`}
					hasPhone={Boolean(parishioner.phoneE164)}
					allowCodeSignIn={parishioner.user?.allowCodeSignIn ?? true}
				/>
			)}

			{/* Personal Information Card */}
			<div className='rounded-lg border bg-card p-6 space-y-6'>
				<div>
					<h2 className='text-lg font-semibold mb-4'>
						Personal Information
					</h2>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='flex items-start gap-3'>
							<User className='h-5 w-5 text-muted-foreground mt-0.5' />
							<div>
								<p className='text-sm text-muted-foreground'>
									Gender
								</p>
								<p className='font-medium'>
									{parishioner.gender}
								</p>
							</div>
						</div>

						<div className='flex items-start gap-3'>
							<Calendar className='h-5 w-5 text-muted-foreground mt-0.5' />
							<div>
								<p className='text-sm text-muted-foreground'>
									Date of Birth
								</p>
								<p className='font-medium'>
									{formatDate(parishioner.dateOfBirth)}
									{age && (
										<span className='text-muted-foreground ml-2'>
											({age} years)
										</span>
									)}
								</p>
							</div>
						</div>

						{parishioner.maritalStatus && (
							<div className='flex items-start gap-3'>
								<Heart className='h-5 w-5 text-muted-foreground mt-0.5' />
								<div>
									<p className='text-sm text-muted-foreground'>
										Marital Status
									</p>
									<p className='font-medium'>
										{parishioner.maritalStatus}
									</p>
								</div>
							</div>
						)}

						{parishioner.occupation && (
							<div className='flex items-start gap-3'>
								<User className='h-5 w-5 text-muted-foreground mt-0.5' />
								<div>
									<p className='text-sm text-muted-foreground'>
										Occupation
									</p>
									<p className='font-medium'>
										{parishioner.occupation}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className='border-t pt-6'>
					<h2 className='text-lg font-semibold mb-4'>
						Contact Information
					</h2>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='flex items-start gap-3'>
							<Mail className='h-5 w-5 text-muted-foreground mt-0.5' />
							<div>
								<p className='text-sm text-muted-foreground'>
									Email
								</p>
								<a
									href={`mailto:${parishioner.email}`}
									className='font-medium hover:underline'
								>
									{parishioner.email}
								</a>
							</div>
						</div>

						{parishioner.phone && (
							<div className='flex items-start gap-3'>
								<Phone className='h-5 w-5 text-muted-foreground mt-0.5' />
								<div>
									<p className='text-sm text-muted-foreground'>
										Phone
									</p>
									<a
										href={`tel:${parishioner.phone}`}
										className='font-medium hover:underline'
									>
										{parishioner.phone}
									</a>
								</div>
							</div>
						)}

						{parishioner.address && (
							<div className='flex items-start gap-3 md:col-span-2'>
								<MapPin className='h-5 w-5 text-muted-foreground mt-0.5' />
								<div>
									<p className='text-sm text-muted-foreground'>
										Address
									</p>
									<p className='font-medium'>
										{parishioner.address}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className='border-t pt-6'>
					<h2 className='text-lg font-semibold mb-4'>
						Record Information
					</h2>
					<div className='grid gap-4 md:grid-cols-2 text-sm'>
						<div>
							<p className='text-muted-foreground'>
								Member Since
							</p>
							<p className='font-medium'>
								{formatDate(parishioner.createdAt)}
							</p>
						</div>
						<div>
							<p className='text-muted-foreground'>
								Last Updated
							</p>
							<p className='font-medium'>
								{formatDate(parishioner.updatedAt)}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Related Information */}
			<div className='grid gap-6 md:grid-cols-2'>
				{/* Sacraments Card */}
				<div className='rounded-lg border bg-card p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h2 className='text-lg font-semibold'>Sacraments</h2>
						{parishioner.sacraments &&
							parishioner.sacraments.length > 0 && (
								<Link
									href={`/dashboard/sacraments?parishioner=${parishioner.id}`}
								>
									<Button
										variant='ghost'
										size='sm'
										className='text-xs'
									>
										View All
									</Button>
								</Link>
							)}
					</div>
					{parishioner.sacraments &&
					parishioner.sacraments.length > 0 ? (
						<ul className='space-y-2'>
							{parishioner.sacraments.map((sacrament: Sacrament) => (
								<li
									key={sacrament.id}
									className='flex justify-between items-center'
								>
									<span>{sacrament.type}</span>
									<span className='text-sm text-muted-foreground'>
										{formatDate(sacrament.dateReceived)}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className='text-muted-foreground text-sm'>
							No sacraments recorded
						</p>
					)}
				</div>

				{/* Payments Card */}
				<div className='rounded-lg border bg-card p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h2 className='text-lg font-semibold'>
							Recent Payments
						</h2>
						{parishioner.payments &&
							parishioner.payments.length > 0 && (
								<Link
									href={`/dashboard/payments?parishioner=${parishioner.id}`}
								>
									<Button
										variant='ghost'
										size='sm'
										className='text-xs'
									>
										View All
									</Button>
								</Link>
							)}
					</div>
					{parishioner.payments && parishioner.payments.length > 0 ? (
						<ul className='space-y-2'>
							{parishioner.payments.slice(0, 5).map((payment: Payment) => (
								<li
									key={payment.id}
									className='flex justify-between items-center'
								>
									<span className='text-sm'>
										{payment.purpose}
									</span>
									<span className='font-medium'>
										₦{payment.amount.toLocaleString()}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className='text-muted-foreground text-sm'>
							No payments recorded
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
