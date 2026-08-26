import { getGateStatus } from "@/app/actions/parish-gate.actions";
import { GateScreen } from "@/components/feed/gate/gate-screen";
import { notFound, redirect } from "next/navigation";

export const metadata = {
	title: "Parish code",
};

export default async function GatePage({
	params,
}: {
	params: Promise<{ parishId: string }>;
}) {
	const { parishId } = await params;
	const gate = await getGateStatus(parishId);

	if (!gate.success || !gate.data) notFound();

	// Already through, or the parish never gated its timeline in the first
	// place. Either way there is no door to show.
	if (!gate.data.required || gate.data.unlocked) {
		redirect("/feed");
	}

	return (
		<GateScreen
			organizationId={gate.data.organizationId}
			organizationName={gate.data.organizationName}
			contactPhone={gate.data.contactPhone}
		/>
	);
}
