import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getSocieties, SocietyWithRelations } from '@/app/actions/society.actions';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
} from '@/components/ui/empty';

export default async function SocietiesPage() {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	const result = await getSocieties();

	if (!result.success) {
		return (
			<div className='text-center py-10'>
				<p className='text-destructive'>{result.message}</p>
			</div>
		);
	}

	const societies: SocietyWithRelations[] = result.data ?? [];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>
						Societies
					</h1>
					<p className='text-muted-foreground'>
						Manage church societies, groups, and organizations.
					</p>
				</div>
				<Button asChild>
					<Link href='/dashboard/societies/new'>
						<PlusCircle className='mr-2 h-4 w-4' />
						New Society
					</Link>
				</Button>
			</div>

			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{societies.length === 0 ? (
					<div className='col-span-full'>
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No societies found</EmptyTitle>
								<EmptyDescription>
									Create your first society to get
									started.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
				) : (
					societies.map((society: SocietyWithRelations) => (
						<Card
							key={society.id}
							className='hover:shadow-md transition-shadow'
						>
							<CardHeader>
								<div className='flex justify-between items-start'>
									<CardTitle className='text-xl'>
										<Link
											href={`/dashboard/societies/${society.id}`}
											className='hover:underline'
										>
											{society.name}
										</Link>
									</CardTitle>
								</div>
								{society.description && (
									<CardDescription className='line-clamp-2'>
										{society.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className='space-y-3 text-sm'>
									<div className='flex items-center text-muted-foreground'>
										<Users className='mr-2 h-4 w-4' />
										<span>
											{society._count.members} Members
										</span>
									</div>

									{society.president && (
										<div className='pt-2 border-t'>
											<span className='font-medium'>
												President:
											</span>{' '}
											{society.president.firstName}{' '}
											{society.president.lastName}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
