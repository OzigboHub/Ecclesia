import {
	getAppointmentAvailabilities,
	getAppointmentBookingWindow,
	getAppointmentsFiltered,
	getAppointmentUnavailableDays,
	getAvailableSlotsForParishioner,
} from "@/app/actions/appointment.actions";
import { getParishioners } from "@/app/actions/parishioner.actions";
import { getStaffMembers } from "@/app/actions/user.actions";
import { auth } from "@/auth";
import { ParishionerAppointmentBooking } from "@/components/features/appointments/parishioner-appointment-booking";
import { AppointmentAvailabilityManager } from "@/components/features/dashboard/appointment-availability-manager";
import { AppointmentBookingWindow } from "@/components/features/dashboard/appointment-booking-window";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppointmentsListClient from "./appointments-list-client";

export default async function AppointmentsPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const session = await auth();
	if (!session?.user) redirect("/auth/login");

	const searchParams = await searchParamsPromise;

	const parsedPage = Number.parseInt(searchParams.page ?? "1", 10);
	const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

	const safeDate = (value?: string) => {
		if (!value) return undefined;
		const ms = Date.parse(value);
		return Number.isNaN(ms) ? undefined : new Date(ms);
	};

	const isParishioner = session.user.role === "PARISHIONER";

	const [appointmentsResult, slotsResult, parishionersResult, staffResult] =
		await Promise.all([
			getAppointmentsFiltered({
				page,
				limit: 20,
				search: searchParams.search,
				type: searchParams.type as any,
				status: searchParams.status as any,
				dateFrom: safeDate(searchParams.dateFrom),
				dateTo: safeDate(searchParams.dateTo),
			}),
			isParishioner ?
				getAvailableSlotsForParishioner()
			:	Promise.resolve(null),
			isParishioner ? Promise.resolve(null) : getParishioners(),
			isParishioner ? Promise.resolve(null) : getStaffMembers(),
		]);

	if (!appointmentsResult.success) {
		return (
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Appointments</h1>
				<div className="rounded-lg border bg-card p-6">
					<p className="text-destructive">
						{appointmentsResult.message}
					</p>
				</div>
			</div>
		);
	}

	const { appointments, total } = appointmentsResult.data!;
	const availableSlots = slotsResult?.data ?? [];
	const parishioners =
		parishionersResult?.success ? (parishionersResult.data ?? []) : [];
	const staffMembers = staffResult?.success ? (staffResult.data ?? []) : [];

	if (isParishioner && !session.user.parishionerId) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
					Appointments
				</h1>
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
					<p className="text-sm font-medium text-amber-800 dark:text-amber-200">
						Your account is not linked to a parishioner record.
						Please contact your parish office to complete your
						registration before booking appointments.
					</p>
				</div>
			</div>
		);
	}

	if (isParishioner) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
						Appointments
					</h1>
					<p className="text-sm sm:text-base text-muted-foreground mt-1">
						Request and manage your parish appointments.
					</p>
				</div>

				<ParishionerAppointmentBooking
					parishionerName={session.user.name ?? "Parishioner"}
					availabilities={availableSlots}
				/>

				{appointments.length > 0 ?
					<AppointmentsListClient
						initialAppointments={appointments}
						total={total}
						searchParams={searchParams}
					/>
				:	<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
						You have no appointments yet.
					</div>
				}
			</div>
		);
	}

	const canManageBookingWindow = [
		"SUPER_ADMIN",
		"PARISH_ADMIN",
		"PARISH_SECRETARY",
	].includes(session.user.role);
	const bookingWindowResult =
		canManageBookingWindow ? await getAppointmentBookingWindow() : null;
	const appointmentAvailabilityResult =
		canManageBookingWindow ? await getAppointmentAvailabilities() : null;
	const unavailableDaysResult =
		canManageBookingWindow ? await getAppointmentUnavailableDays() : null;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const todayAppointments = appointments.filter((apt: any) => {
		const aptDate = new Date(apt.startTime);
		return aptDate >= today && aptDate < tomorrow;
	});

	const pendingCount = appointments.filter(
		(apt: any) => apt.status === "PENDING",
	).length;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
						Appointments
					</h1>
					<p className="text-sm sm:text-base text-muted-foreground mt-1">
						Schedule and coordinate parish meetings.
					</p>
				</div>
			</div>
			{session.user.role !== "PARISH_ADMIN" && (
				<div className="grid md:grid-cols-2 gap-2">
					<Button variant="outline" asChild className="w-full ">
						<Link href="/appointments/calendar">
							<CalendarIcon className="mr-2 h-4 w-4" /> Calendar
							View
						</Link>
					</Button>
					<AppointmentsListClient
						allowScheduling={true}
						parishioners={parishioners}
						staffMembers={staffMembers}
					>
						<Button className="w-full ">
							<Plus className="mr-2 h-4 w-4" /> Schedule New
						</Button>
					</AppointmentsListClient>
				</div>
			)}

			{canManageBookingWindow &&
				bookingWindowResult?.success &&
				bookingWindowResult.data && (
					<AppointmentBookingWindow
						initialOpenAt={
							bookingWindowResult.data.appointmentBookingOpensAt
						}
						initialCloseAt={
							bookingWindowResult.data.appointmentBookingClosesAt
						}
						initialUnavailableDays={
							(
								unavailableDaysResult?.success &&
								unavailableDaysResult.data
							) ?
								unavailableDaysResult.data.dates
							:	[]
						}
					/>
				)}

			{canManageBookingWindow &&
				appointmentAvailabilityResult?.success && (
					<AppointmentAvailabilityManager
						initialAvailabilities={
							appointmentAvailabilityResult.data ?? []
						}
					/>
				)}

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="bg-background border border-border rounded-lg p-5 shadow-sm">
					<p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
						Today&apos;s Schedule
					</p>
					<p className="text-3xl font-bold text-foreground mt-1">
						{todayAppointments.length}
					</p>
					<p className="text-[10px] text-green-600 mt-1 font-medium">
						{appointments.length - todayAppointments.length} other
					</p>
				</div>
				<div className="bg-background border border-border rounded-lg p-5 shadow-sm">
					<p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
						Pending Requests
					</p>
					<p className="text-3xl font-bold text-amber-600 mt-1">
						{pendingCount}
					</p>
					<p className="text-[10px] text-muted-foreground mt-1 font-medium">
						Require moderation
					</p>
				</div>
				<div className="bg-background border border-border rounded-lg p-5 shadow-sm">
					<p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
						Total Appointments
					</p>
					<p className="text-3xl font-bold text-primary mt-1">
						{total}
					</p>
					<p className="text-[10px] text-muted-foreground mt-1 font-medium">
						All time
					</p>
				</div>
			</div>
			<AppointmentsListClient
				initialAppointments={appointments}
				total={total}
				searchParams={searchParams}
				parishioners={parishioners}
				staffMembers={staffMembers}
			/>
		</div>
	);
}
