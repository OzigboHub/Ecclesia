"use client";

import { setOrganizationContext } from "@/app/actions/super-admin.actions";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Building2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

interface OrganizationContextSwitcherProps {
	organizations: { id: string; name: string }[];
	currentOrgId?: string | null;
	queryParam?: string;
}

export function OrganizationContextSwitcher({
	organizations,
	currentOrgId,
}: OrganizationContextSwitcherProps) {
	const router = useRouter();
	const { data: session, update } = useSession();
	const [isPending, startTransition] = useTransition();
	const activeOrgId = currentOrgId || session?.user?.organizationId;
	const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
		activeOrgId,
	);
	const selectedOrgName = useMemo(
		() => organizations.find((org) => org.id === selectedOrgId)?.name,
		[organizations, selectedOrgId],
	);

	useEffect(() => {
		setSelectedOrgId(activeOrgId);
	}, [activeOrgId]);

	const handleSwitch = (value: string) => {
		setSelectedOrgId(value);
		startTransition(async () => {
			try {
				const result = await setOrganizationContext(value);
				if (result.success) {
					await update({
						user: {
							organizationId: value,
							organizationName: selectedOrgName ?? null,
						},
					});
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
					await update({
						user: {
							organizationId: null,
							organizationName: null,
						},
					});
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
			<div className="flex-1 min-w-0">
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
			</div>
			{selectedOrgId && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleClear}
					disabled={isPending}
					title="Clear Context"
					className="shrink-0"
				>
					<X className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
