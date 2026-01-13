'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface ParishionerFormProps {
    initialData?: any
    onSubmit: (data: any) => void
    isLoading?: boolean
}

const GENDER_OPTIONS = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
]

const MARITAL_STATUS_OPTIONS = [
    { label: 'Single', value: 'SINGLE' },
    { label: 'Married', value: 'MARRIED' },
    { label: 'Widowed', value: 'WIDOWED' },
    { label: 'Divorced', value: 'DIVORCED' },
]

export function ParishionerForm({ initialData, onSubmit, isLoading }: ParishionerFormProps) {
    const [formData, setFormData] = React.useState({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        otherNames: initialData?.otherNames || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: initialData?.gender || '',
        maritalStatus: initialData?.maritalStatus || '',
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                />
            </div>

            <Input
                label="Other Names"
                name="otherNames"
                value={formData.otherNames}
                onChange={handleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                />
                <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                />
            </div>

            <Input
                label="Home Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                    label="Date of Birth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                />
                <Select
                    label="Gender"
                    name="gender"
                    options={GENDER_OPTIONS}
                    value={formData.gender}
                    onChange={handleChange}
                />
                <Select
                    label="Marital Status"
                    name="maritalStatus"
                    options={MARITAL_STATUS_OPTIONS}
                    value={formData.maritalStatus}
                    onChange={handleChange}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'Update Parishioner' : 'Add Parishioner'}
                </Button>
            </div>
        </form>
    )
}
