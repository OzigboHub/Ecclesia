'use client'

import * as React from 'react'
import { Plus, Users, Shield, MessageSquare, Edit2, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PiousOrganizationForm } from '@/components/forms/pious-organization-form'

// Mock data for pious organizations
const MOCK_ORGS = [
    { id: '1', name: 'Catholic Women Organization (CWO)', memberCount: 154, president: 'Mrs. Mary Magdalene', secretary: 'Mrs. Elizabeth Jude', description: 'Empowering women in faith and service.' },
    { id: '2', name: 'Catholic Men Organization (CMO)', memberCount: 120, president: 'Mr. Peter Paul', secretary: 'Mr. Matthew Mark', description: 'Building strong men in Christ.' },
    { id: '3', name: 'St. Vincent de Paul Society', memberCount: 45, president: 'Bro. Anthony Abbot', secretary: 'Sis. Catherine Sienna', description: 'Serving the poor and needy.' },
    { id: '4', name: 'Catholic Youth Organization (CYO)', memberCount: 210, president: 'Bro. David Jonathan', secretary: 'Sis. Ruth Naomi', description: 'Engaging youth in church mission.' },
]

export default function PiousOrganizationsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
    const [selectedOrg, setSelectedOrg] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(false)

    // Columns for the organizations table
    const columns = [
        {
            header: 'Organization Name',
            accessorKey: 'name',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{row.name}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{row.description}</span>
                </div>
            )
        },
        {
            header: 'Leadership',
            accessorKey: 'president',
            cell: (row: any) => (
                <div className="flex flex-col text-xs">
                    <div className="flex items-center gap-1 font-medium">
                        <Shield className="h-3 w-3 text-primary" />
                        <span>Pres: {row.president}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                        <MessageSquare className="h-3 w-3" />
                        <span>Sec: {row.secretary}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Members',
            accessorKey: 'memberCount',
            cell: (row: any) => (
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Users className="h-4 w-4" />
                    <span>{row.memberCount}</span>
                </div>
            )
        }
    ]

    const handleCreateOrg = (data: any) => {
        setIsLoading(true)
        console.log('Creating organization:', data)
        setTimeout(() => {
            setIsLoading(false)
            setIsCreateModalOpen(false)
        }, 1000)
    }

    const handleEditOrg = (data: any) => {
        setIsLoading(true)
        console.log('Updating organization:', data)
        setTimeout(() => {
            setIsLoading(false)
            setIsEditModalOpen(false)
            setSelectedOrg(null)
        }, 1000)
    }

    const openEditModal = (org: any) => {
        setSelectedOrg(org)
        setIsEditModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Pious Organizations</h1>
                    <p className="text-muted-foreground mt-1">Manage parish societies, groups, and their leadership.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Organization
                </Button>
            </div>

            {/* Table Section */}
            <div className="bg-background border border-border rounded-lg shadow-sm p-6">
                <DataTable
                    columns={columns}
                    data={MOCK_ORGS}
                    isLoading={false}
                    actions={(row) => (
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={() => openEditModal(row)}
                            >
                                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                />
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Register New Organization"
            >
                <PiousOrganizationForm
                    onSubmit={handleCreateOrg}
                    isLoading={isLoading}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setSelectedOrg(null)
                }}
                title="Edit Organization Details"
            >
                {selectedOrg && (
                    <PiousOrganizationForm
                        initialData={selectedOrg}
                        onSubmit={handleEditOrg}
                        isLoading={isLoading}
                    />
                )}
            </Modal>
        </div>
    )
}
