"use client";

import {
	commitRoster,
	previewRoster,
	type RosterPreview,
	type RosterRow,
} from "@/app/actions/roster.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNgPhone } from "@/lib/phone";
import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Roster import: pick a file, read the verdict, then commit.
 *
 * The preview is not a formality. Phone numbers in a parish register are
 * inconsistent enough that a silent import is a bad idea — the office needs to
 * see which rows will be skipped and why before anything is written.
 */

const HEADER_ALIASES: Record<string, keyof RosterRow> = {
	"first name": "firstName",
	firstname: "firstName",
	"given name": "firstName",
	"last name": "lastName",
	lastname: "lastName",
	surname: "lastName",
	"other names": "otherNames",
	othernames: "otherNames",
	"middle name": "otherNames",
	phone: "phone",
	"phone number": "phone",
	mobile: "phone",
	"mobile number": "phone",
	telephone: "phone",
	email: "email",
	"email address": "email",
	address: "address",
	gender: "gender",
	sex: "gender",
	occupation: "occupation",
};

/** Minimal CSV reader that copes with quoted fields containing commas. */
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];

		if (quoted) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 1;
				} else {
					quoted = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') quoted = true;
		else if (char === ",") {
			row.push(field);
			field = "";
		} else if (char === "\n") {
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else if (char !== "\r") {
			field += char;
		}
	}

	if (field || row.length) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((r) => r.some((cell) => cell.trim()));
}

function toRosterRows(text: string): { rows: RosterRow[]; missing: string[] } {
	const table = parseCsv(text);
	if (table.length < 2) return { rows: [], missing: ["first name", "last name", "phone"] };

	const headers = table[0].map((h) => h.trim().toLowerCase());
	const mapping = headers.map((h) => HEADER_ALIASES[h] ?? null);

	const missing: string[] = [];
	if (!mapping.includes("firstName")) missing.push("first name");
	if (!mapping.includes("lastName")) missing.push("last name");
	if (!mapping.includes("phone")) missing.push("phone");
	if (missing.length) return { rows: [], missing };

	const rows = table.slice(1).map((cells) => {
		const row = {} as RosterRow;
		mapping.forEach((key, index) => {
			if (!key) return;
			row[key] = (cells[index] ?? "").trim();
		});
		return row;
	});

	return { rows, missing: [] };
}

export function RosterImport() {
	const router = useRouter();
	const [rows, setRows] = useState<RosterRow[]>([]);
	const [preview, setPreview] = useState<RosterPreview | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [pending, startTransition] = useTransition();

	async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		setBusy(true);
		setPreview(null);
		setFileName(file.name);

		try {
			const text = await file.text();
			const { rows: parsed, missing } = toRosterRows(text);

			if (missing.length) {
				toast.error(
					`That file is missing a ${missing.join(", ")} column.`,
				);
				setRows([]);
				return;
			}

			setRows(parsed);
			const result = await previewRoster(parsed);
			if (!result.success || !result.data) {
				toast.error(result.message);
				return;
			}
			setPreview(result.data);
		} finally {
			setBusy(false);
		}
	}

	function commit() {
		startTransition(async () => {
			const result = await commitRoster(rows);
			if (!result.success) {
				toast.error(result.message);
				return;
			}
			toast.success(result.message);
			router.push("/parishioners");
			router.refresh();
		});
	}

	return (
		<div className="space-y-6">
			<div className="rounded-lg border border-border bg-background p-6">
				<label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
					<FileUp className="size-6 text-muted-foreground" aria-hidden />
					<span className="text-sm font-medium">
						{fileName ?? "Choose a CSV file"}
					</span>
					<span className="max-w-md text-xs text-muted-foreground">
						Needs a first name, last name and phone column. Other names,
						email, address, gender and occupation are optional. Phone
						numbers in any format — 0803…, +234803… — are read the same
						way.
					</span>
					<input
						type="file"
						accept=".csv,text/csv"
						onChange={onFile}
						className="sr-only"
					/>
				</label>
				{busy && (
					<p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Reading the file…
					</p>
				)}
			</div>

			{preview && (
				<div className="rounded-lg border border-border bg-background">
					<div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
						<Badge variant="secondary">{preview.total} rows</Badge>
						<Badge className="bg-emerald-600 text-white">
							{preview.toCreate} new
						</Badge>
						<Badge className="bg-sky-600 text-white">
							{preview.toUpdate} updated
						</Badge>
						{preview.toSkip > 0 && (
							<Badge className="bg-amber-600 text-white">
								{preview.toSkip} skipped
							</Badge>
						)}
					</div>

					{preview.toSkip > 0 && (
						<div className="flex items-start gap-2 border-b border-border bg-amber-500/10 p-4 text-sm">
							<AlertTriangle
								className="mt-0.5 size-4 shrink-0 text-amber-500"
								aria-hidden
							/>
							<p>
								Skipped rows are not imported. Anyone without a usable
								phone number cannot lock in — fix the number in the
								file and import again.
							</p>
						</div>
					)}

					<div className="max-h-96 overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-muted text-left text-xs uppercase text-muted-foreground">
								<tr>
									<th className="p-2 font-medium">Line</th>
									<th className="p-2 font-medium">Name</th>
									<th className="p-2 font-medium">Phone</th>
									<th className="p-2 font-medium">What happens</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{preview.rows.map((row) => (
									<tr key={row.line}>
										<td className="p-2 tabular-nums text-muted-foreground">
											{row.line}
										</td>
										<td className="p-2">{row.name}</td>
										<td className="p-2 tabular-nums">
											{row.phoneE164 ?
												formatNgPhone(row.phoneE164)
											:	<span className="text-muted-foreground line-through">
													{row.rawPhone || "—"}
												</span>
											}
										</td>
										<td className="p-2">
											<span
												className={
													row.outcome === "create" ?
														"text-emerald-500"
													: row.outcome === "update" ?
														"text-sky-500"
													:	"text-amber-500"
												}
											>
												{row.outcome === "create" ? "Add"
												: row.outcome === "update" ? "Update"
												: "Skip"}
											</span>
											{row.note && (
												<span className="ml-2 text-xs text-muted-foreground">
													{row.note}
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-border p-4">
						<Button
							variant="outline"
							onClick={() => {
								setPreview(null);
								setRows([]);
								setFileName(null);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={commit}
							disabled={pending || preview.toCreate + preview.toUpdate === 0}
						>
							{pending && (
								<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
							)}
							Import {preview.toCreate + preview.toUpdate} people
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
