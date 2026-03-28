import { auth } from "@/auth";
import { MassCalendar } from "@/components/mass/mass-calendar";
import { MassCreateDialog } from "@/components/mass/mass-create-dialog";
import { MassGenerateDialog } from "@/components/mass/mass-generate-dialog";
import { canManageMassIntentions } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const MASS_GENERATE_ROLES = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];

export default async function MassesPage() {
  const session = await auth();
  const canGenerate = MASS_GENERATE_ROLES.includes(session?.user?.role ?? "");
  const canManage = canManageMassIntentions(session?.user?.role ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mass Calendar</h1>
          <p className="text-muted-foreground">View and manage daily masses.</p>
        </div>
        {canGenerate && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/mass-schedule">Manage Templates</Link>
            </Button>
            <MassCreateDialog />
            <MassGenerateDialog />
          </div>
        )}
      </div>

      <MassCalendar canManage={canManage} />
    </div>
  );
}
