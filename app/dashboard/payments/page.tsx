'use client'

import * as React from 'react'
import { Plus, DollarSign, Download, Filter, Search } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PaymentForm } from '@/components/forms/payment-form'
import { cn } from '@/lib/utils'

// Mock data for payments
const MOCK_PAYMENTS = [
    { id: '1', amount: 25000, purpose: 'OFFERING', method: 'CASH', payer: 'John Doe', status: 'COMPLETED', date: '2026-01-13T09:00:00Z', ref: 'PAY-001' },
    { id: '2', amount: 50000, purpose: 'TITHE', method: 'BANK_TRANSFER', payer: 'Jane Smith', status: 'COMPLETED', date: '2026-01-12T14:30:00Z', ref: 'PAY-002' },
    { id: '3', amount: 150000, purpose: 'BUILDING_FUND', method: 'BANK_TRANSFER', payer: 'Anonymous', status: 'COMPLETED', date: '2026-01-12T11:00:00Z', ref: 'PAY-003' },
    { id: '4', amount: 5000, purpose: 'MASS_INTENTION', method: 'CASH', payer: 'Peter Obi', status: 'COMPLETED', date: '2026-01-11T16:45:00Z', ref: 'PAY-004' },
    { id: '5', amount: 10000, purpose: 'OTHER', method: 'MOBILE_MONEY', payer: 'Sarah Johnson', status: 'PENDING', date: '2026-01-13T10:15:00Z', ref: 'PAY-005' },
]

export default function PaymentsPage() {
    const [isRecordModalOpen, setIsRecordModalOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)

    // Columns for the payments table
    const columns = [
        {
            header: 'Ref',
            accessorKey: 'ref',
            cell: (row: any) => <span className="font-mono text-xs text-muted-foreground">{row.ref}</span>
        },
        {
            header: 'Payer',
            accessorKey: 'payer',
            cell: (row: any) => (
                <div className="font-medium text-foreground">
                    {row.payer}
                </div>
            )
        },
        {
            header: 'Purpose',
            accessorKey: 'purpose',
            cell: (row: any) => (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {row.purpose.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            cell: (row: any) => (
                <span className="font-bold text-foreground">
                    ₦{row.amount.toLocaleString()}
                </span>
            )
        },
        {
            header: 'Method',
            accessorKey: 'method',
            cell: (row: any) => <span className="text-muted-foreground text-xs">{row.method.replace('_', ' ')}</span>
        },
        {
            header: 'Date',
            accessorKey: 'date',
            cell: (row: any) => new Date(row.date).toLocaleDateString()
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row: any) => (
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    row.status === 'COMPLETED' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                )}>
                    {row.status}
                </span>
            )
        }
    ]

    const handleRecordPayment = (data: any) => {
        setIsLoading(true)
        console.log('Recording payment:', data)
        // Simulated API delay
        setTimeout(() => {
            setIsLoading(false)
            setIsRecordModalOpen(false)
        }, 1000)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Payments</h1>
                    <p className="text-muted-foreground mt-1">Track offerings, tithes, and donations.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button onClick={() => setIsRecordModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Record Payment
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Today's Revenue</p>
                    <p className="text-2xl font-bold text-foreground">₦35,000</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Monthly Total</p>
                    <p className="text-2xl font-bold text-foreground">₦2,450,000</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Pending Payments</p>
                    <p className="text-2xl font-bold text-yellow-600">12</p>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-background border border-border rounded-lg shadow-sm p-6">
                <DataTable
                    columns={columns}
                    data={MOCK_PAYMENTS}
                    isLoading={false}
                    actions={(row) => (
                        <div className="flex items-center justify-end">
                            <Button variant="ghost" size="sm" className="text-xs">
                                View Receipt
                            </Button>
                        </div>
                    )}
                />
            </div>

            {/* Record Payment Modal */}
            <Modal
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
                title="Record New Payment"
            >
                <PaymentForm
                    onSubmit={handleRecordPayment}
                    isLoading={isLoading}
                />
            </Modal>
        </div>
    )
}
