import { getAppointment } from "@/app/actions/appointment.actions";
import { auth } from "@/auth";
import { AppointmentEditForm } from "@/components/forms/appointment-edit-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditAppointmentPage({ params }: PageProps) {
	const session = await auth();
	if (!session?.user) {
		redirect("/auth/login");
	}

	const { id } = await params;
	const result = await getAppointment(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const appointment = result.data;

	// Check if user has permission to edit appointments
	const allowedRoles = [
		"SUPER_ADMIN",
		"PARISH_ADMIN",
		"PARISH_SECRETARY",
		"PARISH_STAFF",
		"OUTSTATION_ADMIN",
	];

	if (!allowedRoles.includes(session.user.role)) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold">Access Denied</h2>
				<p className="text-muted-foreground mt-2">
					You don&apos;t have permission to edit appointments.
				</p>
				<Link href={`/dashboard/appointments/${id}`} className="mt-4">
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Appointment
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href={`/dashboard/appointments/${id}`}>
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-5 w-5" />
					</Button>
				</Link>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
						Edit Appointment
					</h1>
					<p className="text-muted-foreground mt-1">
						Update appointment details
					</p>
				</div>
			</div>

			{/* Form */}
			<AppointmentEditForm
				appointment={{
					id: appointment.id,
					title: appointment.title,
					description: appointment.description,
					startTime: appointment.startTime,
					endTime: appointment.endTime,
					type: appointment.type,
					status: appointment.status,
					source: appointment.source,
					publicRequesterName: appointment.publicRequesterName,
					parishionerId: appointment.parishioner?.id || null,
					assignedToId: appointment.assignedTo?.id || null,
				}}
			/>
		</div>
	);
}
