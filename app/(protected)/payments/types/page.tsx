import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPaymentTypes } from "@/app/actions/payment-type.actions";
import { PaymentTypesClient } from "./payment-types-client";

export default async function PaymentTypesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const canManage = [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
  ].includes(session.user.role);
  if (!canManage) redirect("/dashboard");

  const canDelete = ["SUPER_ADMIN", "PARISH_ADMIN"].includes(session.user.role);

  const result = await getPaymentTypes();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Types</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage payment types that parishioners can use to make
            payments
          </p>
        </div>
      </div>
      <PaymentTypesClient
        initialPaymentTypes={
          result.success ? (result.data as PaymentTypeItem[]) : []
        }
        canDelete={canDelete}
      />
    </div>
  );
}

type PaymentTypeItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
};
