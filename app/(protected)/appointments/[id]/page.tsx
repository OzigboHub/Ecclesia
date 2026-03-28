import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import {
  getAppointment,
  updateAppointment,
  cancelAppointment,
} from "@/app/actions/appointment.actions";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import AppointmentDetailClient from "./appointment-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppointmentDetailPage({ params }: PageProps) {
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

  // Format date and time
  const formatDateTime = (date: Date | string) => {
    return format(new Date(date), "EEEE, MMMM d, yyyy");
  };

  const formatTime = (date: Date | string) => {
    return format(new Date(date), "h:mm a");
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
          icon: CheckCircle2,
          label: "Confirmed",
        };
      case "PENDING":
        return {
          color:
            "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
          icon: Clock,
          label: "Pending",
        };
      case "COMPLETED":
        return {
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
          icon: CheckCircle2,
          label: "Completed",
        };
      case "CANCELLED":
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
          label: status,
        };
    }
  };

  const statusInfo = getStatusInfo(appointment.status);
  const StatusIcon = statusInfo.icon;

  // Check permissions
  const canEdit = [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
  ].includes(session.user.role);

  const canCancel =
    canEdit &&
    appointment.status !== "CANCELLED" &&
    appointment.status !== "COMPLETED";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Appointment Details
            </h1>
            <p className="text-muted-foreground mt-1">{appointment.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canCancel && (
            <AppointmentDetailClient appointmentId={appointment.id}>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive">
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </AppointmentDetailClient>
          )}
          {canEdit && (
            <Link href={`/appointments/${appointment.id}/edit`}>
              <Button variant="outline">
                <Edit2 className="mr-2 h-4 w-4" /> Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Appointment Information</CardTitle>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase",
                statusInfo.color,
              )}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date & Time */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date & Time
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Date
                </p>
                <p className="text-base font-medium">
                  {formatDateTime(appointment.startTime)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Time
                </p>
                <p className="text-base font-medium">
                  {formatTime(appointment.startTime)} -{" "}
                  {formatTime(appointment.endTime)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duration
                </p>
                <p className="text-base font-medium">
                  {Math.round(
                    (new Date(appointment.endTime).getTime() -
                      new Date(appointment.startTime).getTime()) /
                      (1000 * 60),
                  )}{" "}
                  minutes
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Type
                </p>
                <p className="text-base font-medium">
                  {appointment.type.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Participants */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Participants
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Parishioner
                </p>
                <Link
                  href={`/dashboard/parishioners/${appointment.parishioner.id}`}
                  className="text-base font-medium text-primary hover:underline">
                  {appointment.parishioner.firstName}{" "}
                  {appointment.parishioner.lastName}
                </Link>
                {appointment.parishioner.email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {appointment.parishioner.email}
                  </p>
                )}
                {appointment.parishioner.phone && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.parishioner.phone}
                  </p>
                )}
              </div>
              {appointment.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned To
                  </p>
                  <p className="text-base font-medium">
                    {appointment.assignedTo.firstName}{" "}
                    {appointment.assignedTo.lastName}
                  </p>
                  {appointment.assignedTo.email && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {appointment.assignedTo.email}
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Requested By
                </p>
                <p className="text-base font-medium">
                  {appointment.requestedBy.firstName}{" "}
                  {appointment.requestedBy.lastName}
                </p>
                {appointment.requestedBy.email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {appointment.requestedBy.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {appointment.description && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </h3>
                <p className="text-base text-muted-foreground whitespace-pre-wrap">
                  {appointment.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Metadata</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created At
                </p>
                <p className="text-base">
                  {formatDateTime(appointment.createdAt)} at{" "}
                  {formatTime(appointment.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p className="text-base">
                  {formatDateTime(appointment.updatedAt)} at{" "}
                  {formatTime(appointment.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
