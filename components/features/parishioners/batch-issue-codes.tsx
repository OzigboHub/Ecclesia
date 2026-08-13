"use client";

import { batchIssueAccessCodes } from "@/app/actions/parish-code.actions";
import { formatAccessCode } from "@/lib/access-code";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Issue codes for the whole register and print them as slips.
 *
 * For handing out after Mass. The PDF is generated in the browser and never
 * touches the server or disk — same guarantee as single issuance, just at
 * scale: the plaintext exists once, in the document the office prints.
 */
export function BatchIssueCodes() {
	const [confirming, setConfirming] = useState(false);
	const [pending, startTransition] = useTransition();

	function run() {
		startTransition(async () => {
			const result = await batchIssueAccessCodes();
			if (!result.success || !result.data) {
				toast.error(result.message);
				return;
			}

			const { jsPDF } = await import("jspdf");
			const doc = new jsPDF({ unit: "mm", format: "a4" });

			const perPage = 10;
			result.data.forEach((entry, index) => {
				if (index > 0 && index % perPage === 0) doc.addPage();
				const slot = index % perPage;
				const y = 22 + slot * 26;

				doc.setFontSize(11);
				doc.setTextColor(40);
				doc.text(entry.parishionerName, 18, y);

				doc.setFontSize(18);
				doc.setTextColor(0);
				doc.text(formatAccessCode(entry.code), 18, y + 9);

				doc.setFontSize(8);
				doc.setTextColor(120);
				doc.text(
					`Works once · expires ${new Intl.DateTimeFormat("en-NG", {
						weekday: "long",
						hour: "numeric",
						minute: "2-digit",
					}).format(new Date(entry.expiresAt))}`,
					18,
					y + 15,
				);

				doc.setDrawColor(210);
				doc.line(14, y + 19, 196, y + 19);
			});

			doc.save(`parish-access-codes-${new Date().toISOString().slice(0, 10)}.pdf`);
			toast.success(result.message);
			setConfirming(false);
		});
	}

	if (!confirming) {
		return (
			<Button variant="outline" onClick={() => setConfirming(true)}>
				<Printer className="mr-2 size-4" aria-hidden />
				Issue codes for everyone
			</Button>
		);
	}

	return (
		<div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
			<p className="text-sm">
				This issues a fresh code for every person on the register with a
				usable phone number, and <strong>cancels any code issued
				before</strong>. Anyone mid-way through signing in will need the new
				one. The codes download as a PDF — they cannot be recovered
				afterwards.
			</p>
			<div className="mt-3 flex gap-2">
				<Button onClick={run} disabled={pending}>
					{pending && (
						<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
					)}
					Issue and download
				</Button>
				<Button variant="ghost" onClick={() => setConfirming(false)}>
					Cancel
				</Button>
			</div>
		</div>
	);
}
