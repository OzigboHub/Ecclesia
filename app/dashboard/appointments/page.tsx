'use client'

import * as React from 'react'
import { Plus, Calendar, Clock, CheckCircle2, XCircle, User, Info } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { AppointmentForm } from '@/components/forms/appointment-form'
import { cn } from '@/lib/utils'

// Mock data for appointments
const MOCK_APPOINTMENTS = [
    { id: '1', title: 'Wedding Counseling', requester: 'John & Jane Doe', assignedTo: 'Rev. Fr. John Doe', time: '2026-01-14T09:00:00', status: 'CONFIRMED', type: 'COUNSELING' },
    { id: '2', title: 'First Confession', requester: 'Little Timmy', assignedTo: 'Rev. Fr. John Doe', time: '2026-01-13T16:00:00', status: 'PENDING', type: 'CONFESSION' },
    { id: '3', title: 'Parish Council Meeting', requester: 'Council Secretary', assignedTo: 'Rev. Fr. Peter Smith', time: '2026-01-15T18:30:00', status: 'CONFIRMED', type: 'MEETING' },
    { id: '4', title: 'Bereavement Support', requester: 'The Smith Family', assignedTo: 'Parish Secretary', time: '2026-01-14T11:00:00', status: 'CANCELLED', type: 'COUNSELING' },
]

export default function AppointmentsPage() {
    const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)

    // Columns for the appointments table
    const columns = [
        {
            header: 'Date & Time',
            accessorKey: 'time',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{new Date(row.time).toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground">{new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            header: 'Appointment',
            accessorKey: 'title',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{row.title}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">{row.type}</span>
                </div>
            )
        },
        {
            header: 'Participants',
            accessorKey: 'requester',
            cell: (row: any) => (
                <div className="flex flex-col text-xs">
                    <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{row.requester}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-primary">
                        <Info className="h-3 w-3" />
                        <span>{row.assignedTo}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row: any) => (
                <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    row.status === 'CONFIRMED' ? "bg-green-100 text-green-800" :
                        row.status === 'PENDING' ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                )}>
                    {row.status === 'CONFIRMED' && <CheckCircle2 className="h-3 w-3" />}
                    {row.status === 'PENDING' && <Clock className="h-3 w-3" />}
                    {row.status === 'CANCELLED' && <XCircle className="h-3 w-3" />}
                    {row.status}
                </span>
            )
        }
    ]

    const handleScheduleAppointment = (data: any) => {
        setIsLoading(true)
        console.log('Scheduling appointment:', data)
        setTimeout(() => {
            setIsLoading(false)
            setIsScheduleModalOpen(false)
        }, 1000)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
                    <p className="text-muted-foreground mt-1">Schedule and coordinate parish meetings.</p>
                </div>
                <Button onClick={() => setIsScheduleModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Schedule New
                </Button>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background border border-border rounded-lg p-5 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Schedule</p>
                    <p className="text-3xl font-bold text-foreground mt-1">5</p>
                    <p className="text-[10px] text-green-600 mt-1 font-medium">Remaining: 2</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-5 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Requests</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">8</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">Require moderation</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-5 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available Staff</p>
                    <p className="text-3xl font-bold text-primary mt-1">3</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">Online now</p>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-background border border-border rounded-lg shadow-sm p-6">
                <DataTable
                    columns={columns}
                    data={MOCK_APPOINTMENTS}
                    isLoading={false}
                    actions={(row) => (
                        <div className="flex items-center justify-end gap-2">
                            {row.status === 'PENDING' && (
                                <Button variant="primary" size="sm" className="text-[10px] h-7 px-2">
                                    Approve
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2">
                                Reschedule
                            </Button>
                        </div>
                    )}
                />
            </div>

            {/* Schedule Modal */}
            <Modal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                title="Schedule New Appointment"
            >
                <AppointmentForm
                    onSubmit={handleScheduleAppointment}
                    isLoading={isLoading}
                />
            </Modal>
        </div>
    )
}
