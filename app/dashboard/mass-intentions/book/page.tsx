import { MassIntentionBooking } from "@/components/mass/mass-intention-booking";

export default function BookIntentionPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Book Mass Intention</h1>
                <p className="text-muted-foreground">Request prayers for your specific intentions.</p>
            </div>

            <MassIntentionBooking />
        </div>
    );
}
