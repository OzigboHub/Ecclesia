"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type AppointmentWithRelations = {
	id: string;
	title: string;
	description: string | null;
	startTime: Date;
	endTime: Date;
	type: string;
	status: string;
	publicRequesterName?: string | null;
	parishioner: {
		id: string;
		firstName: string;
		lastName: string;
	} | null;
	assignedTo: {
		id: string;
		firstName: string;
		lastName: string;
	} | null;
};

interface AppointmentsCalendarClientProps {
	appointments: AppointmentWithRelations[];
	initialMonth: number;
	initialYear: number;
}

export default function AppointmentsCalendarClient({
	appointments,
	initialMonth,
	initialYear,
}: AppointmentsCalendarClientProps) {
	const router = useRouter();
	const params = useSearchParams();
	const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
		params.get("date") ? new Date(params.get("date")!) : undefined,
	);
	const [currentMonth, setCurrentMonth] = React.useState(
		new Date(initialYear, initialMonth - 1, 1),
	);

	// Group appointments by date
	const appointmentsByDate = React.useMemo(() => {
		const map = new Map<string, AppointmentWithRelations[]>();
		appointments.forEach((apt) => {
			const dateKey = format(new Date(apt.startTime), "yyyy-MM-dd");
			if (!map.has(dateKey)) {
				map.set(dateKey, []);
			}
			map.get(dateKey)!.push(apt);
		});
		return map;
	}, [appointments]);

	// Get appointments for selected date
	const selectedDateAppointments = React.useMemo(() => {
		if (!selectedDate) return [];
		const dateKey = format(selectedDate, "yyyy-MM-dd");
		return appointmentsByDate.get(dateKey) || [];
	}, [selectedDate, appointmentsByDate]);

	// Custom day renderer to show appointment count
	const modifiers = React.useMemo(() => {
		const modifiers: Record<string, Date[]> = {};
		appointmentsByDate.forEach((apts, dateKey) => {
			modifiers[`has-appointments-${apts.length}`] = [new Date(dateKey)];
		});
		return modifiers;
	}, [appointmentsByDate]);

	const modifiersClassNames = React.useMemo(() => {
		const classNames: Record<string, string> = {};
		appointmentsByDate.forEach((apts, dateKey) => {
			const count = apts.length;
			classNames[`has-appointments-${count}`] = cn(
				"relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full",
				count >= 5 ? "after:bg-red-500"
				: count >= 3 ? "after:bg-amber-500"
				: "after:bg-green-500",
			);
		});
		return classNames;
	}, [appointmentsByDate]);

	const handleMonthChange = (date: Date) => {
		setCurrentMonth(date);
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		router.push(
			`/dashboard/appointments/calendar?month=${month}&year=${year}`,
		);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "CONFIRMED":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
			case "PENDING":
				return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
			case "COMPLETED":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
			case "CANCELLED":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "CONFIRMED":
				return <CheckCircle2 className="h-3 w-3" />;
			case "PENDING":
				return <Clock className="h-3 w-3" />;
			case "CANCELLED":
				return <XCircle className="h-3 w-3" />;
			default:
				return null;
		}
	};

	const getParticipantLabel = (appointment: AppointmentWithRelations) => {
		if (appointment.parishioner) {
			return `${appointment.parishioner.firstName} ${appointment.parishioner.lastName}`;
		}

		return appointment.publicRequesterName || "Public requester";
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Calendar */}
			<div className="lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle>Calendar</CardTitle>
					</CardHeader>
					<CardContent className="grid justify-center p-6">
						<div className="w-full max-w-3xl">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={(date) => {
									setSelectedDate(date);
									if (date) {
										router.push(
											`/dashboard/appointments/calendar?date=${format(date, "yyyy-MM-dd")}`,
										);
									}
								}}
								month={currentMonth}
								onMonthChange={handleMonthChange}
								modifiers={modifiers}
								modifiersClassNames={modifiersClassNames}
								className="rounded-md border w-full [--cell-size:3rem]"
								classNames={{
									months: "w-full",
									month: "w-full",
									month_caption: "text-xl font-semibold",
									day: "h-12 w-12 text-base",
									day_button: "h-12 w-12 text-base",
									weekday: "text-sm font-medium",
								}}
							/>
						</div>
						<div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-green-500" />
								<span>1-2 appointments</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-amber-500" />
								<span>3-4 appointments</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-red-500" />
								<span>5+ appointments</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Selected Date Appointments */}
			<div className="lg:col-span-1">
				<Card>
					<CardHeader>
						<CardTitle>
							{selectedDate ?
								format(selectedDate, "EEEE, MMMM d, yyyy")
							:	"Select a date"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{selectedDate ?
							selectedDateAppointments.length > 0 ?
								<div className="space-y-3">
									{selectedDateAppointments.map((apt) => (
										<Link
											key={apt.id}
											href={`/dashboard/appointments/${apt.id}`}
											className="block p-3 rounded-lg border hover:bg-accent transition-colors"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-medium text-sm truncate">
															{apt.title}
														</span>
														<span
															className={cn(
																"inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
																getStatusColor(
																	apt.status,
																),
															)}
														>
															{getStatusIcon(
																apt.status,
															)}
															{apt.status}
														</span>
													</div>
													<p className="text-xs text-muted-foreground">
														{format(
															new Date(
																apt.startTime,
															),
															"h:mm a",
														)}{" "}
														-{" "}
														{format(
															new Date(
																apt.endTime,
															),
															"h:mm a",
														)}
													</p>
													<p className="text-xs text-muted-foreground mt-1">
														{getParticipantLabel(
															apt,
														)}
													</p>
													{apt.assignedTo && (
														<p className="text-xs text-primary mt-1">
															With:{" "}
															{
																apt.assignedTo
																	.firstName
															}{" "}
															{
																apt.assignedTo
																	.lastName
															}
														</p>
													)}
												</div>
											</div>
										</Link>
									))}
								</div>
							:	<p className="text-sm text-muted-foreground text-center py-8">
									No appointments scheduled for this date
								</p>

						:	<p className="text-sm text-muted-foreground text-center py-8">
								Click on a date to view appointments
							</p>
						}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
