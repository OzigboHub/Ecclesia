import { Suspense } from "react";

import VerifyTwoFactorClient from "./verify-two-factor-client";

export default function VerifyTwoFactorPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
					<div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-6 text-sm text-muted-foreground">
						Loading verification...
					</div>
				</div>
			}
		>
			<VerifyTwoFactorClient />
		</Suspense>
	);
}
