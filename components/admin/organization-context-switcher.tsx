"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, X } from "lucide-react";
import { toast } from "sonner";
import { setOrganizationContext } from "@/app/actions/super-admin.actions";

interface OrganizationContextSwitcherProps {
	organizations: { id: string; name: string }[];
	currentOrgId?: string | null;
}

export function OrganizationContextSwitcher({
	organizations,
	currentOrgId,
}: OrganizationContextSwitcherProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
		currentOrgId || undefined,
	);

	const handleSwitch = (value: string) => {
		setSelectedOrgId(value);
		startTransition(async () => {
			try {
				const result = await setOrganizationContext(value);
				if (result.success) {
					toast.success(
						`Switching context to ${organizations.find((o) => o.id === value)?.name}`,
					);
					router.refresh();
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				toast.error("Failed to switch context");
			}
		});
	};

	const handleClear = () => {
		setSelectedOrgId(undefined);
		startTransition(async () => {
			try {
				const result = await setOrganizationContext(null);
				if (result.success) {
					toast.success("Context cleared");
					router.refresh();
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				toast.error("Failed to clear context");
			}
		});
	};

	return (
		<div className="flex items-center gap-2 w-full">
			<Select
				value={selectedOrgId}
				onValueChange={handleSwitch}
				disabled={isPending}
			>
				<SelectTrigger className="w-full">
					<Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
					<SelectValue placeholder="Select Organization Context" />
				</SelectTrigger>
				<SelectContent className=" bg-secondary">
					{organizations.map((org) => (
						<SelectItem key={org.id} value={org.id}>
							{org.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{selectedOrgId && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleClear}
					disabled={isPending}
					title="Clear Context"
				>
					<X className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
