import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";
import { nairaToKobo } from "@/lib/paystack";
import { Prisma } from "@prisma/client";

function isValidSignature(body: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  return hash === signature;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!isValidSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: {
      status?: string;
      reference?: string;
      amount?: number;
      currency?: string;
      paid_at?: string;
      transfer_code?: string;
    } & Record<string, unknown>;
  };

  try {
    if (event.event === "charge.success" && event.data.reference) {
      const payment = await db.payment.findFirst({
        where: {
          OR: [
            { gatewayReference: event.data.reference },
            { transactionRef: event.data.reference },
          ],
        },
      });

      if (payment && payment.paymentStatus !== "COMPLETED") {
        const expectedGrossAmount = payment.grossAmount ?? payment.amount;
        const amountMatches =
          event.data.amount === nairaToKobo(expectedGrossAmount);

        await db.payment.update({
          where: { id: payment.id },
          data:
            event.data.status === "success" &&
            event.data.currency === payment.currency &&
            amountMatches
              ? {
                  paymentStatus: "COMPLETED",
                  gatewayStatus: event.data.status,
                  gatewayMeta: toPrismaJson(event.data),
                  paymentDate: event.data.paid_at
                    ? new Date(event.data.paid_at)
                    : undefined,
                }
              : {
                  paymentStatus: "FAILED",
                  gatewayStatus: event.data.status,
                  gatewayMeta: toPrismaJson(event.data),
                },
        });
      }
    }

    if (
      ["transfer.success", "transfer.failed", "transfer.reversed"].includes(
        event.event,
      ) &&
      event.data.reference
    ) {
      const withdrawal = await db.withdrawalRequest.findUnique({
        where: { transferReference: event.data.reference },
      });

      if (withdrawal) {
        const nextStatus =
          event.event === "transfer.success" ? "COMPLETED" : "FAILED";

        await db.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: {
            status: nextStatus,
            gatewayStatus: String(event.data.status || event.event),
            gatewayMeta: toPrismaJson(event.data),
            processedAt: new Date(),
            transferCode:
              typeof event.data.transfer_code === "string"
                ? event.data.transfer_code
                : withdrawal.transferCode,
            failureReason:
              nextStatus === "FAILED"
                ? String(event.data.status || event.event)
                : null,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);
    return NextResponse.json({ received: true });
  }
}
