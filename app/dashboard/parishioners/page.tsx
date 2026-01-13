'use client'

import * as React from 'react'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ParishionerForm } from '@/components/forms/parishioner-form'

// Mock data for demonstration since we are skipping the DB for now
const MOCK_PARISHIONERS = [
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '08012345678', gender: 'MALE', maritalStatus: 'MARRIED', createdAt: '2026-01-10' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '08087654321', gender: 'FEMALE', maritalStatus: 'SINGLE', createdAt: '2026-01-11' },
    { id: '3', firstName: 'Peter', lastName: 'Obi', email: 'peter.obi@example.com', phone: '08011122233', gender: 'MALE', maritalStatus: 'MARRIED', createdAt: '2026-01-12' },
]

export default function ParishionersPage() {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
    const [selectedParishioner, setSelectedParishioner] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(false)

    // Columns definition for DataTable
    const columns = [
        {
            header: 'Name',
            accessorKey: 'firstName',
            cell: (row: any) => (
                <div className="font-medium text-foreground">
                    {row.firstName} {row.lastName}
                </div>
            )
        },
        { header: 'Email', accessorKey: 'email' },
        { header: 'Phone', accessorKey: 'phone' },
        {
            header: 'Status',
            accessorKey: 'maritalStatus',
            cell: (row: any) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                    {row.maritalStatus}
                </span>
            )
        },
        {
            header: 'Joined',
            accessorKey: 'createdAt',
            cell: (row: any) => new Date(row.createdAt).toLocaleDateString()
        }
    ]

    const handleAddParishioner = (data: any) => {
        setIsLoading(true)
        console.log('Adding parishioner:', data)
        // Simulated API delay
        setTimeout(() => {
            setIsLoading(false)
            setIsAddModalOpen(false)
        }, 1000)
    }

    const handleEditParishioner = (data: any) => {
        setIsLoading(true)
        console.log('Updating parishioner:', data)
        // Simulated API delay
        setTimeout(() => {
            setIsLoading(false)
            setIsEditModalOpen(false)
            setSelectedParishioner(null)
        }, 1000)
    }

    const openEditModal = (parishioner: any) => {
        setSelectedParishioner(parishioner)
        setIsEditModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Parishioners</h1>
                    <p className="text-muted-foreground mt-1">Manage all registered members of your parish.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Parishioner
                </Button>
            </div>

            <div className="bg-background border border-border rounded-lg shadow-sm p-6">
                <DataTable
                    columns={columns}
                    data={MOCK_PARISHIONERS}
                    isLoading={false}
                    actions={(row) => (
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => window.location.href = `/dashboard/parishioners/${row.id}`}
                                className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                                title="View Profile"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => openEditModal(row)}
                                className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                className="p-2 rounded-md hover:bg-accent text-destructive transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Add Parishioner Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Parishioner"
            >
                <ParishionerForm
                    onSubmit={handleAddParishioner}
                    isLoading={isLoading}
                />
            </Modal>

            {/* Edit Parishioner Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setSelectedParishioner(null)
                }}
                title="Edit Parishioner"
            >
                {selectedParishioner && (
                    <ParishionerForm
                        initialData={selectedParishioner}
                        onSubmit={handleEditParishioner}
                        isLoading={isLoading}
                    />
                )}
            </Modal>
        </div>
    )
}
