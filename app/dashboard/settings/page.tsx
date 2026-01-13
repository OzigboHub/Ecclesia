'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
    Shield as ShieldIcon,
    CreditCard as CreditCardIcon,
    Heart as HeartIcon,
    Share2 as ShareIcon,
    LayoutGrid as LayoutIcon,
    Save as SaveIcon
} from 'lucide-react'

export default function SettingsPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [features, setFeatures] = React.useState({
        // Core
        enableParishionerManagement: true,
        enableSacramentalRecords: true,
        enableFinancialManagement: true,
        // Payment
        enableOfferings: true,
        enableTithes: true,
        enableDonationCampaigns: true,
        enableOnlinePayments: false,
        // Spiritual
        enableMassIntentions: true,
        enableAppointments: true,
        enableConfessionBooking: true,
        // Communication
        enableAnnouncements: true,
        enableLiveStreaming: false,
        enableEmailNotifications: true,
        // Organization
        enablePiousOrganizations: true,
        enableEventManagement: true,
    })

    const handleToggle = (key: string) => {
        setFeatures(prev => ({ ...prev, [key]: !(prev as any)[key] }))
    }

    const handleSave = () => {
        setIsLoading(true)
        console.log('Saving settings:', features)
        setTimeout(() => {
            setIsLoading(false)
        }, 1000)
    }

    const sections = [
        {
            title: 'Core Management',
            icon: ShieldIcon,
            items: [
                { id: 'enableParishionerManagement', label: 'Parishioner Directory', description: 'Manage records for all parish members.' },
                { id: 'enableSacramentalRecords', label: 'Sacramental Records', description: 'Record Baptisms, Confirmations, and Marriages.' },
                { id: 'enableFinancialManagement', label: 'Financial Management', description: 'Enable general financial tracking and auditing.' },
            ]
        },
        {
            title: 'Spiritual & Ministry',
            icon: HeartIcon,
            items: [
                { id: 'enableMassIntentions', label: 'Mass Intentions', description: 'Allow booking of mass intentions and offerings.' },
                { id: 'enableAppointments', label: 'Appointment Scheduling', description: 'Coordinate meetings with priests and office staff.' },
                { id: 'enableConfessionBooking', label: 'Confession Schedule', description: 'Manage sacramental confession slots.' },
            ]
        },
        {
            title: 'Payments & Donations',
            icon: CreditCardIcon,
            items: [
                { id: 'enableOfferings', label: 'Weekly Offerings', description: 'Track Sunday offerings and collections.' },
                { id: 'enableTithes', label: 'Tithe Records', description: 'Manage individual and family tithes.' },
                { id: 'enableDonationCampaigns', label: 'Donation Campaigns', description: 'Create and track building funds or special appeals.' },
                { id: 'enableOnlinePayments', label: 'Online Payment Gateway', description: 'Accept donations via card and bank transfer.' },
            ]
        },
        {
            title: 'Communication & Content',
            icon: ShareIcon,
            items: [
                { id: 'enableAnnouncements', label: 'Parish Announcements', description: 'Broadcast news to all parishioners.' },
                { id: 'enableLiveStreaming', label: 'Live Streaming', description: 'Stream mass and events directly to the website.' },
                { id: 'enableEmailNotifications', label: 'Email Notifications', description: 'Automated alerts for bookings and payments.' },
            ]
        },
        {
            title: 'Organizational',
            icon: LayoutIcon,
            items: [
                { id: 'enablePiousOrganizations', label: 'Pious Organizations', description: 'Manage groups like CWO, CMO, and CYO.' },
                { id: 'enableEventManagement', label: 'Event Management', description: 'Schedule and coordinate parish-wide events.' },
            ]
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure Ecclesia features for your parish.</p>
                </div>
                <Button onClick={handleSave} isLoading={isLoading}>
                    <SaveIcon className="mr-2 h-4 w-4" /> Save Configuration
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-background border border-border rounded-lg shadow-sm overflow-hidden h-fit">
                        <div className="px-6 py-4 border-b border-border bg-slate-50/50 flex items-center gap-3">
                            <section.icon className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-foreground">{section.title}</h2>
                        </div>
                        <div className="p-6 space-y-2 divide-y divide-border/50">
                            {section.items.map((item) => (
                                <Switch
                                    key={item.id}
                                    label={item.label}
                                    description={item.description}
                                    checked={(features as any)[item.id]}
                                    onChange={() => handleToggle(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
