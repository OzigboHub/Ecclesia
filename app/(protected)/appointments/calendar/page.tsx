import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAppointmentsFiltered } from '@/app/actions/appointment.actions';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import AppointmentsCalendarClient from './appointments-calendar-client';

export default async function AppointmentsCalendarPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const session = await auth();
	if (!session?.user) redirect('/auth/login');

	const searchParams = await searchParamsPromise;
	const month = searchParams.month
		? parseInt(searchParams.month)
		: new Date().getMonth() + 1;
	const year = searchParams.year
		? parseInt(searchParams.year)
		: new Date().getFullYear();

	// Get start and end of month
	const dateFrom = new Date(year, month - 1, 1);
	const dateTo = new Date(year, month, 0, 23, 59, 59);

	// Fetch appointments for the month
	// Using a higher limit to get all appointments for the month
	const appointmentsResult = await getAppointmentsFiltered({
		dateFrom,
		dateTo,
		limit: 500, // Should be enough for a month's appointments
		page: 1,
	});

	if (!appointmentsResult.success) {
		return (
			<div className='space-y-6'>
				<h1 className='text-3xl font-bold'>Appointments Calendar</h1>
				<div className='rounded-lg border bg-card p-6'>
					<p className='text-destructive'>
						{appointmentsResult.message}
					</p>
				</div>
			</div>
		);
	}

	const { appointments } = appointmentsResult.data!;

	// Group appointments by date
	const appointmentsByDate = new Map<string, typeof appointments>();
	appointments.forEach((apt) => {
		const dateKey = new Date(apt.startTime).toDateString();
		if (!appointmentsByDate.has(dateKey)) {
			appointmentsByDate.set(dateKey, []);
		}
		appointmentsByDate.get(dateKey)!.push(apt);
	});

	return (
		<div className='space-y-6'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold text-foreground'>
						Appointments Calendar
					</h1>
					<p className='text-muted-foreground mt-1'>
						View appointments in calendar format.
					</p>
				</div>
				<Button variant='outline' asChild>
					<Link href='/dashboard/appointments'>
						<ArrowLeft className='mr-2 h-4 w-4' /> Back to List
					</Link>
				</Button>
			</div>

			<AppointmentsCalendarClient
				appointments={appointments}
				initialMonth={month}
				initialYear={year}
			/>
		</div>
	);
}
