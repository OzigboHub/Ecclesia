'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface PaymentFormProps {
    onSubmit: (data: any) => void
    isLoading?: boolean
}

const PURPOSE_OPTIONS = [
    { label: 'Offering', value: 'OFFERING' },
    { label: 'Tithe', value: 'TITHE' },
    { label: 'Mass Intention', value: 'MASS_INTENTION' },
    { label: 'Donation Campaign', value: 'DONATION_CAMPAIGN' },
    { label: 'Building Fund', value: 'BUILDING_FUND' },
    { label: 'Other', value: 'OTHER' },
]

const METHOD_OPTIONS = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
    { label: 'Card', value: 'CARD' },
    { label: 'Mobile Money', value: 'MOBILE_MONEY' },
    { label: 'Check', value: 'CHECK' },
]

export function PaymentForm({ onSubmit, isLoading }: PaymentFormProps) {
    const [formData, setFormData] = React.useState({
        amount: '',
        purpose: '',
        paymentMethod: 'CASH',
        payerName: '',
        onBehalfOf: '',
        payerEmail: '',
        payerPhone: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
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
                    label="Amount (₦)"
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                />
                <Select
                    label="Purpose"
                    name="purpose"
                    options={PURPOSE_OPTIONS}
                    value={formData.purpose}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Payer Name"
                    name="payerName"
                    value={formData.payerName}
                    onChange={handleChange}
                    placeholder="Who is paying?"
                    required
                />
                <Input
                    label="On Behalf Of (Optional)"
                    name="onBehalfOf"
                    value={formData.onBehalfOf}
                    onChange={handleChange}
                    placeholder="e.g. The Doe Family"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                    label="Payment Method"
                    name="paymentMethod"
                    options={METHOD_OPTIONS}
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Payment Date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Email (Optional)"
                    type="email"
                    name="payerEmail"
                    value={formData.payerEmail}
                    onChange={handleChange}
                />
                <Input
                    label="Phone (Optional)"
                    name="payerPhone"
                    value={formData.payerPhone}
                    onChange={handleChange}
                />
            </div>

            <div className="pt-2">
                <label className="block text-sm font-medium mb-1.5">Notes (Optional)</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e: any) => handleChange(e)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                    placeholder="Any additional details..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                    Record Payment
                </Button>
            </div>
        </form>
    )
}
