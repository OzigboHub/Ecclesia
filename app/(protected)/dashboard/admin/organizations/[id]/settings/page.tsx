import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings } from 'lucide-react';
import { FeatureToggleClient } from '@/components/admin/feature-toggle-client';

interface OrganizationSettingsPageProps {
	params: Promise<{ id: string }>;
}

export default async function OrganizationSettingsPage({
	params,
}: OrganizationSettingsPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const { id } = await params;

	const organization = await db.organization.findUnique({
		where: { id },
		select: { name: true },
	});

	if (!organization) {
		notFound();
	}

	// Fetch feature settings for this organization
	// Note: we need a way to fetch settings for a specific org ID,
	// but currently getOrganizationFeatures uses session.user.organizationId.
	// I should probably add a getOrganizationFeaturesById action.

	const settings = await db.organizationFeatureSettings.findUnique({
		where: { organizationId: id },
	});

	if (!settings) {
		// Create default settings if they don't exist
		await db.organizationFeatureSettings.create({
			data: { organizationId: id },
		});
	}

	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<Link href={`/dashboard/admin/organizations/${id}`}>
					<Button variant='ghost' size='sm' className='mb-2'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to {organization.name}
					</Button>
				</Link>
				<h1 className='text-3xl font-bold tracking-tight'>
					Settings
				</h1>
				<p className='text-muted-foreground'>
					Manage configuration and features for {organization.name}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='h-5 w-5' />
						Feature Management
					</CardTitle>
					<CardDescription>
						Toggle system features for this organization.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FeatureToggleClient
						organizationId={id}
						initialSettings={settings as any}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
