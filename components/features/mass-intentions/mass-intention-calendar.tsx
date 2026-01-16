'use client';

import { useState, useMemo, useTransition } from 'react';
import {
	ChevronLeft,
	ChevronRight,
	Dot,
	Clock,
	AlertCircle,
	Building2,
	Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Prisma } from '@prisma/client';
import { Modal } from '@/components/ui/modal';
import { MassIntentionForm } from '@/components/forms/mass-intention-form';
import { OrganizationSelector } from '@/components/mass-intentions/organization-selector';
import { getMassesInRange } from '@/app/actions/mass.actions';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

type MassWithIntentions = Prisma.MassGetPayload<{
	include: {
		intentions: {
			include: {
				parishioner: true;
			};
		};
	};
}>;

type MassIntention = Prisma.MassIntentionGetPayload<{
	include: {
		parishioner: true;
		organization: true;
		mass: true;
	};
}>;

interface MassIntentionCalendarProps {
	intentions: MassIntention[];
	masses: MassWithIntentions[];
	initialOrganizationId?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_INTENTIONS_PER_MASS = 10; // Max intentions per mass time slot

export function MassIntentionCalendar({
	intentions,
	masses,
	initialOrganizationId,
}: MassIntentionCalendarProps) {
	const [isPending, startTransition] = useTransition();
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedMassId, setSelectedMassId] = useState<string | null>(null);
	const [isBookingOpen, setIsBookingOpen] = useState(false);
	const [selectedOrganizationId, setSelectedOrganizationId] = useState(
		initialOrganizationId || ''
	);
	const [displayMasses, setDisplayMasses] = useState<MassWithIntentions[]>(
		masses.filter((m) => m.organizationId === initialOrganizationId)
	);

	// Handle organization change
	const handleOrganizationChange = (orgId: string) => {
		setSelectedOrganizationId(orgId);

		// Fetch new masses for the selected organization
		startTransition(async () => {
			const result = await getMassesInRange(
				subMonths(startOfMonth(currentDate), 1),
				addMonths(endOfMonth(currentDate), 1),
				orgId
			);

			if (result.success && result.data) {
				setDisplayMasses(result.data);
			}
		});

		// Reset selections
		setSelectedDate(null);
		setSelectedMassId(null);
	};

	// Get calendar grid for current month
	const calendarDays = useMemo(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();

		// First day of month and last day
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		// Starting weekday (0 = Sunday)
		const startingDayOfWeek = firstDay.getDay();
		const totalDays = lastDay.getDate();

		// Create grid
		const days: (Date | null)[] = [];

		// Fill in empty days before month starts
		for (let i = 0; i < startingDayOfWeek; i++) {
			days.push(null);
		}

		// Fill in days of month
		for (let day = 1; day <= totalDays; day++) {
			days.push(new Date(year, month, day));
		}

		return days;
	}, [currentDate]);

	// Count intentions by date (from mass dates)
	const intentionsByDate = useMemo(() => {
		const map = new Map<string, MassIntention[]>();

		intentions.forEach((intention) => {
			if (intention.mass) {
				const dateKey = new Date(intention.mass.date)
					.toISOString()
					.split('T')[0];
				if (!map.has(dateKey)) {
					map.set(dateKey, []);
				}
				map.get(dateKey)!.push(intention);
			}
		});

		return map;
	}, [intentions]);

	// Group masses by date
	const massesByDate = useMemo(() => {
		const map = new Map<string, MassWithIntentions[]>();

		displayMasses.forEach((mass) => {
			const dateKey = new Date(mass.date).toISOString().split('T')[0];
			if (!map.has(dateKey)) {
				map.set(dateKey, []);
			}
			map.get(dateKey)!.push(mass);
		});

		// Sort masses by time for each date
		map.forEach((massesForDate) => {
			massesForDate.sort((a, b) => a.time.localeCompare(b.time));
		});

		return map;
	}, [displayMasses]);

	const handlePreviousMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
		);
		setSelectedDate(null);
		setSelectedMassId(null);
	};

	const handleNextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
		);
		setSelectedDate(null);
		setSelectedMassId(null);
	};

	const handleDateClick = (date: Date) => {
		setSelectedDate(date);
		setSelectedMassId(null);
	};

	const handleMassSelect = (massId: string) => {
		setSelectedMassId(massId);
	};

	const handleBookingSuccess = () => {
		setIsBookingOpen(false);
		setSelectedDate(null);
		setSelectedMassId(null);
	};

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const selectedDateKey = selectedDate
		? selectedDate.toISOString().split('T')[0]
		: null;

	const massesForSelectedDate = selectedDateKey
		? massesByDate.get(selectedDateKey) || []
		: [];

	const selectedMassTime = selectedMassId
		? massesForSelectedDate.find((m) => m.id === selectedMassId)?.time
		: null;

	return (
		<div className='space-y-6'>
			{/* Step 1: Organization Selection */}
			<Card className='border-l-4 border-l-primary shadow-sm'>
				<CardHeader className='bg-gradient-to-r from-primary/5 to-transparent pb-4'>
					<div className='flex items-center gap-3'>
						<div className='p-2 rounded-lg bg-primary/10'>
							<Building2 className='h-5 w-5 text-primary' />
						</div>
						<div className='flex-1'>
							<CardTitle className='text-lg font-bold'>
								Step 1: Select Parish / Outstation
							</CardTitle>
							<p className='text-xs text-muted-foreground mt-0.5'>
								Choose where the mass will take place
							</p>
						</div>
						<Badge
							variant='default'
							className='ml-auto text-sm'
						>
							{selectedDate ? '✓ Complete' : 'Active'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className='pt-6'>
					<OrganizationSelector
						value={selectedOrganizationId}
						onChange={handleOrganizationChange}
					/>
					{isPending && (
						<div className='mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950'>
							<p className='text-sm text-blue-700 dark:text-blue-200 flex items-center gap-2'>
								<span className='animate-spin'>⏳</span>
								Loading available masses...
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Step 2: Calendar View */}
			<Card className='border-l-4 border-l-blue-500 shadow-sm'>
				<CardHeader className='bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950 pb-4 border-b'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3 flex-1'>
							<div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900'>
								<Calendar className='h-5 w-5 text-blue-600 dark:text-blue-300' />
							</div>
							<div>
								<CardTitle className='text-lg font-bold'>
									Step 2: Select Date
								</CardTitle>
								<p className='text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1'>
									{currentDate.toLocaleDateString('en-US', {
										month: 'long',
										year: 'numeric',
									})}
								</p>
							</div>
						</div>
						<Badge
							variant='secondary'
							className='text-sm'
						>
							{selectedDate ? '✓ Selected' : 'Pending'}
						</Badge>
					</div>
					<div className='flex gap-2 mt-4'>
						<Button
							variant='outline'
							size='sm'
							onClick={handlePreviousMonth}
							className='hover:bg-blue-50 dark:hover:bg-blue-950'
						>
							<ChevronLeft className='h-4 w-4' />
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={handleNextMonth}
							className='hover:bg-blue-50 dark:hover:bg-blue-950'
						>
							<ChevronRight className='h-4 w-4' />
						</Button>
					</div>
				</CardHeader>
				<CardContent className='pt-6'>
					{/* Weekday Headers */}
					<div className='grid grid-cols-7 gap-2 mb-4'>
						{WEEKDAYS.map((day) => (
							<div
								key={day}
								className='text-center font-bold text-sm text-blue-700 dark:text-blue-300 py-3 bg-blue-50 dark:bg-blue-950 rounded-md'
							>
								{day}
							</div>
						))}
					</div>

					{/* Calendar Days Grid */}
					<div className='grid grid-cols-7 gap-2'>
						{calendarDays.map((date, index) => {
							if (!date) {
								return (
									<div
										key={`empty-${index}`}
										className='aspect-square'
									/>
								);
							}

							const dateKey = date.toISOString().split('T')[0];
							const dayIntentions =
								intentionsByDate.get(dateKey) || [];
							const isSelected =
								selectedDate &&
								selectedDate.toISOString().split('T')[0] ===
									dateKey;
							const isToday =
								date.toISOString().split('T')[0] ===
								today.toISOString().split('T')[0];
							const isPast = date < today;
							const isFull =
								dayIntentions.length >=
								MAX_INTENTIONS_PER_MASS * 6; // 6 mass times

							return (
								<button
									key={dateKey}
									onClick={() => handleDateClick(date)}
									className={cn(
										'aspect-square rounded-lg border-2 p-2 transition-all text-sm flex flex-col items-start justify-start font-semibold',
										isSelected
											? 'border-primary bg-primary text-primary-foreground shadow-lg scale-105'
											: isFull && !isPast
											? 'border-destructive bg-red-50 dark:bg-red-950 text-destructive'
											: isToday && !isPast
											? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950 hover:shadow-md'
											: isPast
											? 'opacity-40 cursor-not-allowed border-gray-300'
											: 'border-border hover:border-blue-400 hover:shadow-md hover:bg-blue-50 dark:hover:bg-blue-950'
									)}
									disabled={isPast}
								>
									<span className='text-lg'>
										{date.getDate()}
									</span>
									{dayIntentions.length > 0 && (
										<div className='flex items-center gap-1 mt-auto'>
											<Dot
												className={cn(
													'h-2.5 w-2.5',
													isFull
														? 'text-destructive'
														: 'text-green-600'
												)}
											/>
											<span className='text-xs font-bold'>
												{dayIntentions.length}
											</span>
										</div>
									)}
								</button>
							);
						})}
					</div>

					{/* Legend */}
					<div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950 rounded-lg border border-blue-200 dark:border-blue-800'>
						<p className='text-xs font-bold text-blue-900 dark:text-blue-100 mb-3'>
							Legend:
						</p>
						<div className='flex flex-wrap gap-6'>
							<div className='flex items-center gap-2'>
								<Dot className='h-4 w-4 text-green-600 animate-pulse' />
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Available Spaces
								</span>
							</div>
							<div className='flex items-center gap-2'>
								<Dot className='h-4 w-4 text-destructive' />
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Full
								</span>
							</div>
							<div className='flex items-center gap-2'>
								<div className='w-4 h-4 rounded-full border-2 border-yellow-400 bg-yellow-100 dark:bg-yellow-900' />
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Today
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Step 3: Mass Times for Selected Date */}
			{selectedDate && (
				<Card className='border-l-4 border-l-purple-500 shadow-sm'>
					<CardHeader className='bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950 pb-4 border-b'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<div className='p-2 rounded-lg bg-purple-100 dark:bg-purple-900'>
									<Clock className='h-5 w-5 text-purple-600 dark:text-purple-300' />
								</div>
								<div>
									<CardTitle className='text-lg font-bold'>
										Step 3: Select Mass Time
									</CardTitle>
									<p className='text-sm font-semibold text-purple-700 dark:text-purple-300 mt-1'>
										{selectedDate.toLocaleDateString(
											'en-US',
											{
												weekday: 'short',
												month: 'short',
												day: 'numeric',
											}
										)}
									</p>
								</div>
							</div>
							<Badge
								variant='secondary'
								className='text-sm'
							>
								{selectedMassId ? '✓ Selected' : 'Pending'}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className='pt-6'>
						{massesForSelectedDate.length === 0 ? (
							<div className='text-center py-12 text-gray-500'>
								<div className='p-4 bg-orange-100 dark:bg-orange-950 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
									<AlertCircle className='h-8 w-8 text-orange-600 dark:text-orange-300' />
								</div>
								<p className='font-bold text-lg text-gray-900 dark:text-white'>
									No masses available
								</p>
								<p className='text-sm mt-2'>
									Try selecting a different date or contact
									your parish office
								</p>
							</div>
						) : (
							<div className='space-y-3'>
								{massesForSelectedDate.map((mass) => {
									const isFull =
										mass.intentions.length >=
										mass.maxIntentions;
									const isCancelled =
										mass.status === 'CANCELLED';
									const availableSlots = Math.max(
										0,
										mass.maxIntentions -
											mass.intentions.length
									);

									return (
										<button
											key={mass.id}
											onClick={() =>
												!isFull &&
												!isCancelled &&
												handleMassSelect(mass.id)
											}
											disabled={isFull || isCancelled}
											className={cn(
												'w-full p-5 rounded-lg border-2 transition-all text-left',
												selectedMassId === mass.id
													? 'border-purple-500 bg-purple-50 dark:bg-purple-950 shadow-lg scale-105'
													: isFull
													? 'border-destructive bg-red-50 dark:bg-red-950 opacity-60 cursor-not-allowed'
													: isCancelled
													? 'border-muted opacity-50 cursor-not-allowed'
													: 'border-purple-300 hover:border-purple-500 hover:shadow-md hover:bg-purple-50 dark:hover:bg-purple-950'
											)}
										>
											<div className='flex items-start justify-between mb-3'>
												<div className='flex-1'>
													<div className='flex items-center gap-2'>
														<Clock className='h-4 w-4 text-muted-foreground' />
														<p className='font-semibold text-lg'>
															{mass.time}
														</p>
													</div>
													<p className='text-sm text-muted-foreground mt-1'>
														{mass.massType
															.split('_')
															.map(
																(word) =>
																	word.charAt(
																		0
																	) +
																	word
																		.slice(
																			1
																		)
																		.toLowerCase()
															)
															.join(' ')}
														{mass.language &&
															` • ${mass.language}`}
													</p>
													{mass.location && (
														<p className='text-xs text-muted-foreground mt-1'>
															📍 {mass.location}
														</p>
													)}
												</div>
												<div className='flex flex-col items-end gap-2'>
													{isFull && (
														<Badge
															variant='destructive'
															className='text-xs'
														>
															Full
														</Badge>
													)}
													{isCancelled && (
														<Badge
															variant='outline'
															className='text-xs'
														>
															Cancelled
														</Badge>
													)}
													{!isFull &&
														!isCancelled && (
															<Badge
																variant='default'
																className='text-xs'
															>
																Open
															</Badge>
														)}
												</div>
											</div>

											{/* Capacity Display */}
											<div className='space-y-2'>
												<div className='flex justify-between text-xs'>
													<span className='font-medium text-muted-foreground'>
														Available Slots
													</span>
													<span className='font-semibold'>
														{availableSlots} /{' '}
														{mass.maxIntentions}
													</span>
												</div>
												<div className='w-full h-2 bg-secondary rounded-full overflow-hidden'>
													<div
														className={cn(
															'h-full transition-all rounded-full',
															isFull
																? 'bg-destructive'
																: availableSlots >
																  mass.maxIntentions *
																		0.5
																? 'bg-green-600'
																: 'bg-yellow-600'
														)}
														style={{
															width: `${
																100 -
																(availableSlots /
																	mass.maxIntentions) *
																	100
															}%`,
														}}
													/>
												</div>
											</div>

											{mass.intentions.length > 0 && (
												<div className='mt-3 pt-3 border-t'>
													<p className='text-xs font-medium text-muted-foreground mb-2'>
														Current intentions:
													</p>
													<div className='space-y-1 max-h-20 overflow-y-auto'>
														{mass.intentions
															.slice(0, 3)
															.map(
																(intention) => (
																	<p
																		key={
																			intention.id
																		}
																		className='text-xs truncate text-muted-foreground'
																	>
																		•{' '}
																		{intention.intention.substring(
																			0,
																			30
																		)}
																		{intention
																			.intention
																			.length >
																		30
																			? '...'
																			: ''}
																	</p>
																)
															)}
														{mass.intentions
															.length > 3 && (
															<p className='text-xs text-muted-foreground italic'>
																+
																{mass.intentions
																	.length -
																	3}{' '}
																more
															</p>
														)}
													</div>
												</div>
											)}
										</button>
									);
								})}
							</div>
						)}

						{selectedMassId && (
							<div className='mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30'>
								<div className='flex items-start gap-3'>
									<Clock className='h-5 w-5 text-primary mt-0.5 shrink-0' />
									<div>
										<p className='font-semibold text-sm'>
											Ready to book?
										</p>
										<p className='text-sm text-muted-foreground mt-1'>
											Complete the form below to book your
											intention for{' '}
											{selectedDate.toLocaleDateString(
												'en-US',
												{
													month: 'short',
													day: 'numeric',
												}
											)}
											{' at '}
											{
												massesForSelectedDate.find(
													(m) =>
														m.id === selectedMassId
												)?.time
											}
										</p>
										<Button
											size='sm'
											className='mt-3'
											onClick={() =>
												setIsBookingOpen(true)
											}
										>
											Book Intention
										</Button>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Booking Modal */}
			<Modal
				isOpen={isBookingOpen && !!selectedDate && !!selectedMassTime}
				onClose={() => setIsBookingOpen(false)}
				title={`Book Mass Intention - ${selectedDate?.toLocaleDateString(
					'en-US',
					{ month: 'short', day: 'numeric' }
				)} at ${selectedMassTime}`}
			>
				{selectedDate && selectedMassTime && (
					<MassIntentionForm
						organizationId={selectedOrganizationId}
						defaultValues={{
							massDate: selectedDate,
							massId: selectedMassId || undefined,
						}}
						onSuccess={handleBookingSuccess}
					/>
				)}
			</Modal>

			{/* Info Section */}
			<Card className='bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'>
				<CardHeader>
					<div className='flex items-start gap-3'>
						<AlertCircle className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0' />
						<div>
							<CardTitle className='text-base'>
								How to Book
							</CardTitle>
							<p className='text-sm text-blue-700 dark:text-blue-300 mt-2'>
								1. Select a date from the calendar above
								<br />
								2. Choose an available mass time (green dot =
								available, red = full)
								<br />
								3. Click &quot;Book Intention&quot; and fill in
								your details
								<br />
								4. The intention will be added to the mass
								schedule
							</p>
						</div>
					</div>
				</CardHeader>
			</Card>
		</div>
	);
}
