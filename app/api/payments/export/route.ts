import { auth } from "@/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const canExport = [
		"SUPER_ADMIN",
		"PARISH_ADMIN",
		"PARISH_SECRETARY",
	].includes(session.user.role);
	if (!canExport) {
		return NextResponse.json({ error: "Permission denied" }, { status: 403 });
	}

	const { searchParams } = request.nextUrl;
	const purpose = searchParams.get("purpose") || undefined;
	const status = searchParams.get("status") || undefined;
	const method = searchParams.get("method") || undefined;
	const dateFrom = searchParams.get("dateFrom");
	const dateTo = searchParams.get("dateTo");

	const where: Record<string, unknown> = {
		organizationId: session.user.organizationId,
	};

	if (purpose) where.purpose = purpose;
	if (status) where.paymentStatus = status;
	if (method) where.paymentMethod = method;
	if (dateFrom || dateTo) {
		where.paymentDate = {
			...(dateFrom ? { gte: new Date(dateFrom) } : {}),
			...(dateTo ? { lte: new Date(dateTo) } : {}),
		};
	}

	const payments = await db.payment.findMany({
		where,
		include: {
			parishioner: true,
			massIntention: true,
			donationCampaign: true,
		},
		orderBy: { paymentDate: "desc" },
		take: 10000,
	});

	const header = [
		"Receipt Number",
		"Date",
		"Payer Name",
		"Amount (NGN)",
		"Purpose",
		"Payment Method",
		"Status",
		"Transaction Ref",
		"Parishioner",
		"Mass Intention",
		"Campaign",
		"Notes",
	].join(",");

	const rows = payments.map((p) => {
		const cols = [
			p.receiptNumber || "",
			new Date(p.paymentDate).toISOString().split("T")[0],
			escapeCsv(p.payerName),
			p.amount.toFixed(2),
			p.purpose.replace(/_/g, " "),
			p.paymentMethod.replace(/_/g, " "),
			p.paymentStatus,
			p.transactionRef || "",
			p.parishioner
				? escapeCsv(
						`${p.parishioner.firstName} ${p.parishioner.lastName}`,
					)
				: "",
			p.massIntention ? escapeCsv(p.massIntention.intention) : "",
			p.donationCampaign ? escapeCsv(p.donationCampaign.name) : "",
			escapeCsv(p.notes || ""),
		];
		return cols.join(",");
	});

	const csv = [header, ...rows].join("\n");
	const today = new Date().toISOString().split("T")[0];

	return new NextResponse(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="payments-${today}.csv"`,
		},
	});
}

function escapeCsv(value: string): string {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}
