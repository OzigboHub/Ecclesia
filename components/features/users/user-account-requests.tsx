"use client";

import {
	approveUserAccountRequest,
	rejectUserAccountRequest,
	type RequestWithMeta,
} from "@/app/actions/user-account-request.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleLabels } from "@/lib/validators/user.schema";
import { useState } from "react";
import { toast } from "sonner";

interface UserAccountRequestsProps {
	requests: RequestWithMeta[];
}

export function UserAccountRequests({ requests }: UserAccountRequestsProps) {
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [passwords, setPasswords] = useState<Record<string, string>>({});

	const handleApprove = async (id: string) => {
		setLoadingId(id);
		const result = await approveUserAccountRequest(id);
		if (result.success && result.data) {
			toast.success(result.message);
			setPasswords((prev) => ({
				...prev,
				[id]: result.data!.temporaryPassword,
			}));
		} else {
			toast.error(result.message);
		}
		setLoadingId(null);
	};

	const handleReject = async (id: string) => {
		setLoadingId(id);
		const result = await rejectUserAccountRequest(id);
		if (result.success) {
			toast.success(result.message);
		} else {
			toast.error(result.message);
		}
		setLoadingId(null);
	};

	if (requests.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Pending User Account Requests</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{requests.map((request) => (
					<div
						key={request.id}
						className="rounded-lg border p-4 space-y-3"
					>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm font-semibold">
									{request.firstName} {request.lastName}
								</p>
								<p className="text-xs text-muted-foreground">
									{request.email} •{" "}
									{request.organization.name}
								</p>
							</div>
							<Badge variant="secondary">
								{roleLabels[request.role]}
							</Badge>
						</div>

						{request.message && (
							<p className="text-sm text-muted-foreground">
								{request.message}
							</p>
						)}

						{passwords[request.id] && (
							<div className="rounded-md border border-dashed p-3 text-sm">
								Temporary password:{" "}
								<strong>{passwords[request.id]}</strong>
							</div>
						)}

						<div className="flex gap-2">
							<Button
								variant="outline"
								disabled={loadingId === request.id}
								onClick={() => handleReject(request.id)}
							>
								Reject
							</Button>
							<Button
								disabled={loadingId === request.id}
								onClick={() => handleApprove(request.id)}
							>
								Approve
							</Button>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
