import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getParishioner } from "@/app/actions/parishioner.actions";
import { ParishionerEditForm } from "@/components/forms/parishioner-edit-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditParishionerPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const result = await getParishioner(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const parishioner = result.data;

  // Check if user has permission to edit parishioners
  const allowedRoles = [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
  ];

  if (!allowedRoles.includes(session.user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          You don&apos;t have permission to edit parishioners.
        </p>
        <Link href={`/dashboard/parishioners/${id}`} className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </Link>
      </div>
    );
  }

  // Check if user can transfer parishioners to other organizations
  const canTransfer = ["SUPER_ADMIN", "PARISH_ADMIN"].includes(
    session.user.role,
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/parishioners/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Edit Parishioner
          </h1>
          <p className="text-muted-foreground mt-1">
            Update {parishioner.firstName} {parishioner.lastName}
            &apos;s information
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-card p-6">
        <ParishionerEditForm
          parishioner={parishioner}
          canTransferOrganization={canTransfer}
          currentOrganizationId={session.user.organizationId}
          userRole={session.user.role}
        />
      </div>
    </div>
  );
}
