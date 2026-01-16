'use client';

import { useState, useMemo } from 'react';
import {
	ChevronLeft,
	ChevronRight,
	Dot,
	Clock,
	Users,
	AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Prisma } from '@prisma/client';
import { Modal } from '@/components/ui/modal';
import { MassIntentionForm } from '@/components/forms/mass-intention-form';

type MassIntention = Prisma.MassIntentionGetPayload<{
	include: {
		parishioner: true;
		organization: true;
	};
}>;

interface MassIntentionCalendarProps {
	intentions: MassIntention[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Standard mass times for parishes
const STANDARD_MASS_TIMES = [
	{ time: '06:00', name: 'Early Morning' },
	{ time: '08:00', name: 'Morning' },
	{ time: '10:00', name: 'Late Morning' },
	{ time: '12:00', name: 'Noon' },
	{ time: '18:00', name: 'Evening' },
	{ time: '19:30', name: 'Vigil' },
];

const MAX_INTENTIONS_PER_MASS = 5; // Configurable limit

export function MassIntentionCalendar({
	intentions,
}: MassIntentionCalendarProps) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedMassTime, setSelectedMassTime] = useState<string | null>(
		null
	);
	const [isBookingOpen, setIsBookingOpen] = useState(false);

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

	// Count intentions by date
	const intentionsByDate = useMemo(() => {
		const map = new Map<string, MassIntention[]>();

		intentions.forEach((intention) => {
			const dateKey = intention.massDate.toISOString().split('T')[0];
			if (!map.has(dateKey)) {
				map.set(dateKey, []);
			}
			map.get(dateKey)!.push(intention);
		});

		return map;
	}, [intentions]);

	// Count intentions by date and time
	const intentionsByDateAndTime = useMemo(() => {
		const map = new Map<string, Map<string, MassIntention[]>>();

		intentions.forEach((intention) => {
			const dateKey = intention.massDate.toISOString().split('T')[0];
			const timeKey = intention.massDate
				.toISOString()
				.split('T')[1]
				.slice(0, 5);

			if (!map.has(dateKey)) {
				map.set(dateKey, new Map());
			}

			const timeMap = map.get(dateKey)!;
			if (!timeMap.has(timeKey)) {
				timeMap.set(timeKey, []);
			}
			timeMap.get(timeKey)!.push(intention);
		});

		return map;
	}, [intentions]);

	const handlePreviousMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
		);
		setSelectedDate(null);
		setSelectedMassTime(null);
	};

	const handleNextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
		);
		setSelectedDate(null);
		setSelectedMassTime(null);
	};

	const handleDateClick = (date: Date) => {
		setSelectedDate(date);
		setSelectedMassTime(null);
	};

	const handleMassTimeSelect = (time: string) => {
		setSelectedMassTime(time);
	};

	const handleBookingSuccess = () => {
		setIsBookingOpen(false);
		setSelectedDate(null);
		setSelectedMassTime(null);
	};

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const selectedDateKey = selectedDate
		? selectedDate.toISOString().split('T')[0]
		: null;

	const massesForSelectedDate = selectedDateKey
		? STANDARD_MASS_TIMES.map((massTime) => {
				const timeKey = massTime.time;
				const dateMap = intentionsByDateAndTime.get(selectedDateKey);
				const intentionsForTime = dateMap?.get(timeKey) || [];
				const isFull =
					intentionsForTime.length >= MAX_INTENTIONS_PER_MASS;
				return {
					...massTime,
					count: intentionsForTime.length,
					isFull,
					intentions: intentionsForTime,
				};
		  })
		: [];

	return (
		<div className='space-y-6'>
			{/* Calendar View */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>
							{currentDate.toLocaleDateString('en-US', {
								month: 'long',
								year: 'numeric',
							})}
						</CardTitle>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={handlePreviousMonth}
							>
								<ChevronLeft className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={handleNextMonth}
							>
								<ChevronRight className='h-4 w-4' />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Weekday Headers */}
					<div className='grid grid-cols-7 gap-2 mb-4'>
						{WEEKDAYS.map((day) => (
							<div
								key={day}
								className='text-center font-semibold text-sm text-muted-foreground py-2'
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
										'aspect-square rounded-lg border-2 p-2 transition-all text-sm flex flex-col items-start justify-start',
										isSelected
											? 'border-primary bg-primary/10'
											: 'border-border hover:border-primary/50',
										isPast
											? 'opacity-50 cursor-not-allowed'
											: 'cursor-pointer',
										isFull &&
											!isPast &&
											'border-destructive bg-destructive/5',
										isToday &&
											!isSelected &&
											'border-yellow-500'
									)}
									disabled={isPast}
								>
									<span className='font-semibold'>
										{date.getDate()}
									</span>
									{dayIntentions.length > 0 && (
										<div className='flex items-center gap-1 mt-1'>
											<Dot
												className={cn(
													'h-2 w-2',
													isFull
														? 'text-destructive'
														: 'text-green-600'
												)}
											/>
											<span className='text-xs text-muted-foreground'>
												{dayIntentions.length}
											</span>
										</div>
									)}
								</button>
							);
						})}
					</div>

					{/* Legend */}
					<div className='mt-6 flex flex-wrap gap-6 pt-4 border-t'>
						<div className='flex items-center gap-2'>
							<Dot className='h-3 w-3 text-green-600' />
							<span className='text-sm text-muted-foreground'>
								Available
							</span>
						</div>
						<div className='flex items-center gap-2'>
							<Dot className='h-3 w-3 text-destructive' />
							<span className='text-sm text-muted-foreground'>
								Full ({MAX_INTENTIONS_PER_MASS * 6}+ intentions)
							</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='w-3 h-3 rounded-full border-2 border-yellow-500' />
							<span className='text-sm text-muted-foreground'>
								Today
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Mass Times for Selected Date */}
			{selectedDate && (
				<Card>
					<CardHeader>
						<CardTitle className='text-lg'>
							{selectedDate.toLocaleDateString('en-US', {
								weekday: 'long',
								month: 'long',
								day: 'numeric',
								year: 'numeric',
							})}
						</CardTitle>
						<p className='text-sm text-muted-foreground'>
							Select a mass time to book an intention
						</p>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{massesForSelectedDate.map((mass) => (
								<button
									key={mass.time}
									onClick={() =>
										!mass.isFull &&
										handleMassTimeSelect(mass.time)
									}
									disabled={mass.isFull}
									className={cn(
										'p-4 rounded-lg border-2 transition-all text-left',
										selectedMassTime === mass.time
											? 'border-primary bg-primary/10'
											: 'border-border hover:border-primary/50',
										mass.isFull &&
											'opacity-50 cursor-not-allowed border-destructive'
									)}
								>
									<div className='flex items-start justify-between mb-2'>
										<div>
											<p className='font-semibold'>
												{mass.time}
											</p>
											<p className='text-xs text-muted-foreground'>
												{mass.name}
											</p>
										</div>
										{mass.isFull && (
											<Badge
												variant='destructive'
												className='text-xs'
											>
												Full
											</Badge>
										)}
									</div>

									<div className='flex items-center gap-1 text-sm text-muted-foreground'>
										<Users className='h-4 w-4' />
										<span>
											{mass.count} /{' '}
											{MAX_INTENTIONS_PER_MASS}
										</span>
									</div>

									{mass.count > 0 && (
										<div className='mt-3 pt-3 border-t'>
											<p className='text-xs font-medium text-muted-foreground mb-2'>
												Current intentions:
											</p>
											<div className='space-y-1 max-h-20 overflow-y-auto'>
												{mass.intentions
													.slice(0, 3)
													.map((intention) => (
														<p
															key={intention.id}
															className='text-xs truncate text-muted-foreground'
														>
															•{' '}
															{intention.intention.substring(
																0,
																30
															)}
															{intention.intention
																.length > 30
																? '...'
																: ''}
														</p>
													))}
												{mass.count > 3 && (
													<p className='text-xs text-muted-foreground italic'>
														+{mass.count - 3} more
													</p>
												)}
											</div>
										</div>
									)}
								</button>
							))}
						</div>

						{selectedMassTime && (
							<div className='mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30'>
								<div className='flex items-start gap-3'>
									<Clock className='h-5 w-5 text-primary mt-0.5 flex-shrink-0' />
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
											)}{' '}
											at{' '}
											{STANDARD_MASS_TIMES.find(
												(m) =>
													m.time === selectedMassTime
											)?.time || selectedMassTime}
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
						defaultValues={{
							massDate: selectedDate,
							timeSlot: selectedMassTime,
						}}
						onSuccess={handleBookingSuccess}
					/>
				)}
			</Modal>

			{/* Info Section */}
			<Card className='bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'>
				<CardHeader>
					<div className='flex items-start gap-3'>
						<AlertCircle className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
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
