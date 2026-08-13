"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { LockInSheet } from "./lock-in-sheet";

/**
 * The gate between browsing and doing.
 *
 * A card asks for a private action; if the viewer is already a member it just
 * happens, and if not the lock-in sheet opens with the action held. The held
 * action runs by itself on success — the whole point of the flow is that
 * somebody who tapped "Give" ends up giving, not back at the top of a feed
 * they have to scroll again to find what they wanted.
 */

export type PendingAction = {
	/** Shown on the final step: "Give to Church roof repair". */
	label: string;
	run: () => void | Promise<void>;
};

type LockInContextValue = {
	isMember: boolean;
	requireMember: (action: PendingAction) => void;
};

const LockInContext = createContext<LockInContextValue | null>(null);

export function useLockIn(): LockInContextValue {
	const context = useContext(LockInContext);
	if (!context) {
		throw new Error("useLockIn must be used inside <LockInProvider>");
	}
	return context;
}

export function LockInProvider({
	isMember,
	organizationId,
	organizationName,
	children,
}: {
	isMember: boolean;
	organizationId: string | null;
	organizationName: string;
	children: React.ReactNode;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [label, setLabel] = useState<string | null>(null);
	const pending = useRef<PendingAction | null>(null);

	const requireMember = useCallback(
		(action: PendingAction) => {
			if (isMember) {
				void action.run();
				return;
			}
			// Nothing to lock in to yet — on the cross-parish highlights feed
			// there is no parish register to look anyone up in. Send them to
			// choose one rather than opening a sheet that cannot resolve.
			if (!organizationId) {
				router.push("/start");
				return;
			}
			pending.current = action;
			setLabel(action.label);
			setOpen(true);
		},
		[isMember, organizationId, router],
	);

	const handleSuccess = useCallback(() => {
		const action = pending.current;
		pending.current = null;
		// Let the sheet finish its exit before the action does whatever it
		// does — usually opening another sheet.
		setTimeout(() => {
			void action?.run();
		}, 180);
	}, []);

	const value = useMemo(
		() => ({ isMember, requireMember }),
		[isMember, requireMember],
	);

	return (
		<LockInContext.Provider value={value}>
			{children}
			{organizationId && (
				<LockInSheet
					open={open}
					onOpenChange={setOpen}
					organizationId={organizationId}
					organizationName={organizationName}
					pendingLabel={label}
					onSuccess={handleSuccess}
				/>
			)}
		</LockInContext.Provider>
	);
}
