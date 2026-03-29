"use client";

import {
  cancelAppointment,
  updateAppointment,
} from "@/app/actions/appointment.actions";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Info,
  Plus,
  Search,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useTransition } from "react";

type AppointmentWithRelations = {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  type: string;
  status: string;
  source?: string;
  publicRequesterName?: string | null;
  publicRequesterEmail?: string | null;
  availability?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
  } | null;
  parishioner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

interface AppointmentsListClientProps {
  children?: React.ReactNode;
  initialAppointments?: AppointmentWithRelations[];
  total?: number;
  searchParams?: { [key: string]: string | undefined };
  userRole?: string;
  allowScheduling?: boolean;
}

export default function AppointmentsListClient({
  children,
  initialAppointments = [],
  total = 0,
  searchParams = {},
  userRole,
  allowScheduling = true,
}: AppointmentsListClientProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const showScheduledOnly = userRole === "PARISH_ADMIN";

  // Filter state
  const [search, setSearch] = React.useState(searchParams.search || "");
  const [statusFilter, setStatusFilter] = React.useState(
    showScheduledOnly ? "CONFIRMED" : searchParams.status || "all",
  );
  const [typeFilter, setTypeFilter] = React.useState(
    searchParams.type || "all",
  );

  // Update URL when filters change
  const updateFilters = React.useCallback(() => {
    const newParams = new URLSearchParams();
    if (search) newParams.set("search", search);
    if (statusFilter !== "all") newParams.set("status", statusFilter);
    if (typeFilter !== "all") newParams.set("type", typeFilter);
    const query = newParams.toString();
    router.push(query ? `/appointments?${query}` : "/appointments");
  }, [search, statusFilter, typeFilter, router]);

  React.useEffect(() => {
    updateFilters();
  }, [statusFilter, typeFilter, updateFilters]);

  React.useEffect(() => {
    if (showScheduledOnly) {
      setStatusFilter("CONFIRMED");
    }
  }, [showScheduledOnly]);

  const handleScheduleSuccess = () => {
    setIsScheduleModalOpen(false);
    router.refresh();
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await updateAppointment(id, { status: "CONFIRMED" });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      startTransition(async () => {
        const result = await cancelAppointment(id);
        if (result.success) {
          router.refresh();
        }
      });
    }
  };

  const getParticipantLabel = (appointment: AppointmentWithRelations) => {
    if (appointment.parishioner) {
      return `${appointment.parishioner.firstName} ${appointment.parishioner.lastName}`;
    }

    return appointment.publicRequesterName || "Public requester";
  };

  const getRequestSourceLabel = (appointment: AppointmentWithRelations) => {
    if (appointment.source === "PUBLIC") {
      return appointment.publicRequesterEmail || "Public request";
    }

    if (appointment.requestedBy) {
      return `${appointment.requestedBy.firstName} ${appointment.requestedBy.lastName}`;
    }

    return "Internal request";
  };

  // Columns for the appointments table
  const columns = [
    {
      header: "Date & Time",
      accessorKey: "startTime",
      cell: (row: AppointmentWithRelations) => (
        <div className="flex flex-col">
          <span className="font-semibold">
            {new Date(row.startTime).toLocaleDateString()}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Appointment",
      accessorKey: "title",
      cell: (row: AppointmentWithRelations) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.title}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
            {row.type.replace(/_/g, " ")}
          </span>
        </div>
      ),
    },
    {
      header: "Participants",
      accessorKey: "parishioner",
      cell: (row: AppointmentWithRelations) => (
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span>{getParticipantLabel(row)}</span>
          </div>
          <div className="mt-0.5 text-muted-foreground">
            {getRequestSourceLabel(row)}
          </div>
          {row.assignedTo && (
            <div className="flex items-center gap-1 mt-0.5 text-primary">
              <Info className="h-3 w-3" />
              <span>
                {row.assignedTo.firstName} {row.assignedTo.lastName}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: AppointmentWithRelations) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
            row.status === "CONFIRMED"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : row.status === "PENDING"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                : row.status === "COMPLETED"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
          )}>
          {row.status === "CONFIRMED" && <CheckCircle2 className="h-3 w-3" />}
          {row.status === "PENDING" && <Clock className="h-3 w-3" />}
          {row.status === "CANCELLED" && <XCircle className="h-3 w-3" />}
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <>
      {children && allowScheduling && (
        <div onClick={() => setIsScheduleModalOpen(true)}>{children}</div>
      )}

      {/* Filters */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CONFESSION">Confession</SelectItem>
                <SelectItem value="COUNSELING">Counseling</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  router.push("/appointments");
                }}
                className="w-full sm:w-auto">
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-6">
        {initialAppointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No appointments found</p>
            <Button
              onClick={() => setIsScheduleModalOpen(true)}
              className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Schedule First Appointment
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={initialAppointments}
            isLoading={isPending}
            actions={(row) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link href={`/appointments/${row.id}`}>View</Link>
                </Button>
                {row.status === "PENDING" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleApprove(row.id)}
                    disabled={isPending}>
                    Approve
                  </Button>
                )}
                {row.status !== "CANCELLED" && row.status !== "COMPLETED" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive"
                    onClick={() => handleCancel(row.id)}
                    disabled={isPending}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule New Appointment">
        <AppointmentForm onSuccess={handleScheduleSuccess} />
      </Modal>
    </>
  );
}
