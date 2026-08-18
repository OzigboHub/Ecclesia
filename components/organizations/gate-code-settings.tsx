"use client";

import { disableGateCode, setGateCode } from "@/app/actions/parish-gate.actions";
import { ACCESS_CODE_LENGTH, generateAccessCode } from "@/lib/access-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * The parish gate: a shared code that must be entered before anyone can see
 * this parish's public timeline.
 *
 * Off by default. Rotating the code does not sign existing devices out — they
 * hold a signed pass, not the code — so rotation stops new people getting in
 * without punishing the congregation.
 */
export function GateCodeSettings({
	enabled,
	hasCode,
}: {
	enabled: boolean;
	hasCode: boolean;
}) {
	const router = useRouter();
	const [on, setOn] = useState(enabled && hasCode);
	const [code, setCode] = useState("");
	const [pending, startTransition] = useTransition();

	function save() {
		startTransition(async () => {
			const result = await setGateCode(code);
			if (!result.success) {
				toast.error(result.message);
				return;
			}
			toast.success(result.message);
			setCode("");
			setOn(true);
			router.refresh();
		});
	}

	function toggle(next: boolean) {
		if (next) {
			setOn(true);
			return;
		}
		startTransition(async () => {
			const result = await disableGateCode();
			if (!result.success) {
				toast.error(result.message);
				return;
			}
			setOn(false);
			toast.success(result.message);
			router.refresh();
		});
	}

	return (
		<div className="rounded-lg border border-border bg-background p-6">
			<div className="flex items-start justify-between gap-6">
				<div>
					<h3 className="text-sm font-semibold">Parish gate code</h3>
					<p className="mt-1 max-w-prose text-sm text-muted-foreground">
						Ask for a shared code before anyone can see this parish&rsquo;s
						public timeline. Most parishes leave this off — being findable
						is usually the point. Turn it on if your parish would rather
						keep its notices among its own community.
					</p>
				</div>
				<Switch
					checked={on}
					onCheckedChange={toggle}
					disabled={pending}
					aria-label="Require a parish gate code"
				/>
			</div>

			{on && (
				<div className="mt-5 border-t border-border pt-5">
					<Label htmlFor="gate-code" className="text-sm">
						{hasCode ? "Change the code" : "Set the code"}
					</Label>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<Input
							id="gate-code"
							value={code}
							onChange={(event) =>
								setCode(event.target.value.toUpperCase())
							}
							maxLength={ACCESS_CODE_LENGTH}
							placeholder="6 characters"
							className="w-40 font-mono tracking-[0.18em]"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={() => setCode(generateAccessCode())}
							title="Generate one"
						>
							<Shuffle className="size-4" aria-hidden />
							<span className="sr-only">Generate a code</span>
						</Button>
						<Button
							onClick={save}
							disabled={code.length !== ACCESS_CODE_LENGTH || pending}
						>
							{pending && (
								<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
							)}
							Save
						</Button>
					</div>
					<p className="mt-2 text-xs text-muted-foreground">
						Changing the code doesn&rsquo;t sign anyone out — devices that
						already entered the old one stay in. It only affects people
						arriving from now on.
					</p>
				</div>
			)}
		</div>
	);
}
