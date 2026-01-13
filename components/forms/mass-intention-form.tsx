'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface MassIntentionFormProps {
    onSubmit: (data: any) => void
    isLoading?: boolean
}

const INTENTION_TYPE_OPTIONS = [
    { label: 'Thanksgiving', value: 'THANKSGIVING' },
    { label: 'Requiem (For the Dead)', value: 'REQUIEM' },
    { label: 'Special Intention', value: 'SPECIAL_INTENTION' },
]

export function MassIntentionForm({ onSubmit, isLoading }: MassIntentionFormProps) {
    const [formData, setFormData] = React.useState({
        intention: '',
        intentionType: 'THANKSGIVING',
        requestedBy: '',
        contactEmail: '',
        contactPhone: '',
        massDate: new Date().toISOString().split('T')[0],
        stipend: '',
        notes: '',
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
            <div className="pt-2">
                <label className="block text-sm font-medium mb-1.5">Intention Details</label>
                <textarea
                    name="intention"
                    value={formData.intention}
                    onChange={(e: any) => handleChange(e)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                    placeholder="E.g. For the soul of... / In thanksgiving for..."
                    required
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                    label="Intention Type"
                    name="intentionType"
                    options={INTENTION_TYPE_OPTIONS}
                    value={formData.intentionType}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Requested By"
                    name="requestedBy"
                    value={formData.requestedBy}
                    onChange={handleChange}
                    placeholder="Name of requester"
                    required
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Mass Date"
                    type="date"
                    name="massDate"
                    value={formData.massDate}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Stipend Amount (Optional)"
                    type="number"
                    name="stipend"
                    value={formData.stipend}
                    onChange={handleChange}
                    placeholder="0.00"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Contact Phone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                />
                <Input
                    label="Contact Email"
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                    Book Intention
                </Button>
            </div>
        </form>
    )
}
