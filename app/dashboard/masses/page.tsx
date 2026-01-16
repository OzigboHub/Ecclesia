'use client';

import { MassCalendar } from "@/components/mass/mass-calendar";
import { Button } from "@/components/ui/button";
import { runMassGeneration } from "@/app/actions/mass.actions";
import { useTransition } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

export default function MassesPage() {
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        if (!confirm('This will generate masses for the next 30 days based on your templates. Continue?')) return;

        startTransition(async () => {
            const res = await runMassGeneration();
            if (res.success) {
                toast.success(res.message);
                window.location.reload(); // Simple refresh to see new masses
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mass Calendar</h1>
                    <p className="text-muted-foreground">View and manage daily masses.</p>
                </div>
                <Button onClick={handleGenerate} disabled={isPending} variant="secondary">
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isPending ? 'Generating...' : 'Generate Masses'}
                </Button>
            </div>

            <MassCalendar />
        </div>
    );
}
