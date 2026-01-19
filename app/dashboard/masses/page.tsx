'use client';

import { MassCalendar } from "@/components/mass/mass-calendar";
import { MassGenerateDialog } from "@/components/mass/mass-generate-dialog";

export default function MassesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mass Calendar</h1>
                    <p className="text-muted-foreground">View and manage daily masses.</p>
                </div>
                <MassGenerateDialog />
            </div>

            <MassCalendar />
        </div>
    );
}
