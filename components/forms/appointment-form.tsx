'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface AppointmentFormProps {
    onSubmit: (data: any) => void
    isLoading?: boolean
}

const APPOINTMENT_TYPE_OPTIONS = [
    { label: 'Confession', value: 'CONFESSION' },
    { label: 'Counseling', value: 'COUNSELING' },
    { label: 'Meeting with Parish Priest', value: 'MEETING' },
    { label: 'Other', value: 'OTHER' },
]

const ASSIGNED_TO_OPTIONS = [
    { label: 'Rev. Fr. John Doe', value: 'fr-john' },
    { label: 'Rev. Fr. Peter Smith', value: 'fr-peter' },
    { label: 'Parish Secretary', value: 'secretary' },
]

export function AppointmentForm({ onSubmit, isLoading }: AppointmentFormProps) {
    const [formData, setFormData] = React.useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'MEETING',
        assignedToId: '',
        parishionerName: '',
        contactPhone: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Appointment Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Wedding Counseling"
                required
            />

            <div className="pt-2">
                <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e: any) => handleChange(e)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                    placeholder="Briefly describe the purpose of the meeting..."
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                    label="Appointment Type"
                    name="type"
                    options={APPOINTMENT_TYPE_OPTIONS}
                    value={formData.type}
                    onChange={handleChange}
                    required
                />
                <Select
                    label="Assign To"
                    name="assignedToId"
                    options={ASSIGNED_TO_OPTIONS}
                    value={formData.assignedToId}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Start Date & Time"
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="End Date & Time"
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Parishioner Name"
                    name="parishionerName"
                    value={formData.parishionerName}
                    onChange={handleChange}
                    placeholder="Who is visiting?"
                    required
                />
                <Input
                    label="Contact Phone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                    Schedule Appointment
                </Button>
            </div>
        </form>
    )
}
