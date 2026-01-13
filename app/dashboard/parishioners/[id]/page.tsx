'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Heart,
    ChevronLeft,
    Edit2,
    DollarSign,
    Church,
    Book
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Mock data for the profile
const MOCK_PARISHIONER = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    otherNames: 'Fitzgerald',
    email: 'john.doe@example.com',
    phone: '08012345678',
    address: '123 Faith Avenue, Victoria Island, Lagos',
    dateOfBirth: '1990-05-15',
    gender: 'MALE',
    maritalStatus: 'MARRIED',
    createdAt: '2026-01-10T10:00:00Z',
    sacraments: [
        { id: '1', type: 'BAPTISM', date: '1990-06-20', location: 'St. Peter\'s Cathedral' },
        { id: '2', type: 'CONFIRMATION', date: '2005-10-12', location: 'Holy Trinity Parish' }
    ],
    payments: [
        { id: '1', purpose: 'TITHE', amount: 5000, date: '2026-01-05', status: 'COMPLETED' },
        { id: '2', purpose: 'OFFERING', amount: 1000, date: '2026-01-12', status: 'COMPLETED' }
    ]
}

export default function ParishionerProfilePage() {
    const params = useParams()
    const id = params.id

    // In a real app, we would fetch data using the ID
    const parishioner = MOCK_PARISHIONER

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/parishioners">
                        <Button variant="outline" size="sm" className="p-2">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {parishioner.firstName} {parishioner.lastName}
                        </h1>
                        <p className="text-muted-foreground">Parishioner Profile</p>
                    </div>
                </div>
                <Button variant="outline">
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Personal Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-background border border-border rounded-lg shadow-sm p-6">
                        <div className="flex justify-center mb-6">
                            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-12 w-12 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                                    <p className="text-sm">{parishioner.email || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                                    <p className="text-sm">{parishioner.phone || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Address</p>
                                    <p className="text-sm">{parishioner.address || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">DOB</p>
                                        <p className="text-sm">{parishioner.dateOfBirth}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Heart className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Marital</p>
                                        <p className="text-sm">{parishioner.maritalStatus}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg shadow-sm p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Book className="h-5 w-5 text-primary" /> Sacramental History
                        </h3>
                        <div className="space-y-4">
                            {parishioner.sacraments.map((sac) => (
                                <div key={sac.id} className="border-l-2 border-primary pl-4 py-1">
                                    <p className="text-sm font-bold">{sac.type}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(sac.date).toLocaleDateString()}</p>
                                    <p className="text-xs italic">{sac.location}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Payments & Mass Intentions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-background border border-border rounded-lg shadow-sm">
                        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" /> Recent Payments
                            </h3>
                            <Button variant="ghost" size="sm">View All</Button>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3">Purpose</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {parishioner.payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-accent/50 transition-colors">
                                            <td className="px-6 py-4 font-medium">{payment.purpose}</td>
                                            <td className="px-6 py-4 text-foreground font-semibold">₦{payment.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg shadow-sm">
                        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Church className="h-5 w-5 text-primary" /> Mass Intentions
                            </h3>
                            <Button variant="ghost" size="sm">Book New</Button>
                        </div>
                        <div className="p-12 text-center">
                            <Church className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No mass intentions booked for this parishioner yet.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
