import { MassScheduleManager } from "@/components/mass/mass-schedule-manager";

export default function MassSchedulePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mass Schedule</h1>
                <p className="text-muted-foreground">
                    Manage recurring mass schedules and templates.
                </p>
            </div>

            <MassScheduleManager />
        </div>
    );
}
