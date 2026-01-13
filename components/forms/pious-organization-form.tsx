'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PiousOrganizationFormProps {
    initialData?: any
    onSubmit: (data: any) => void
    isLoading?: boolean
}

export function PiousOrganizationForm({ initialData, onSubmit, isLoading }: PiousOrganizationFormProps) {
    const [formData, setFormData] = React.useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        presidentName: initialData?.presidentName || '',
        secretaryName: initialData?.secretaryName || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                label="Organization Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Catholic Women Organization (CWO)"
                required
            />

            <div className="pt-2">
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                    placeholder="Describe the organization's purpose and activities..."
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                    label="President Name"
                    name="presidentName"
                    value={formData.presidentName}
                    onChange={handleChange}
                    placeholder="Current leader"
                />
                <Input
                    label="Secretary Name"
                    name="secretaryName"
                    value={formData.secretaryName}
                    onChange={handleChange}
                    placeholder="Administrative lead"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                    {initialData ? 'Update Organization' : 'Create Organization'}
                </Button>
            </div>
        </form>
    )
}
