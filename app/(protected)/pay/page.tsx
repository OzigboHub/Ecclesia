import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActivePaymentTypes } from "@/app/actions/payment-type.actions";
import { PayClient } from "./pay-client";

export default async function PayPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const result = await getActivePaymentTypes();
  const paymentTypes = result.success ? (result.data as PaymentTypeData[]) : [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Make a Payment</h1>
        <p className="text-sm text-muted-foreground">
          Select a payment type below to make your contribution
        </p>
      </div>
      <PayClient
        paymentTypes={paymentTypes}
        userEmail={session.user.email || ""}
        userName={session.user.name || ""}
        parishionerId={session.user.parishionerId}
        organizationId={session.user.organizationId}
      />
    </div>
  );
}

type PaymentTypeData = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
};
