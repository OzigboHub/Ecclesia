import PublicFooter from "@/components/layout/public-footer";
import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
	return (
		<div className="pt-16">
			{children}
			<PublicFooter />
		</div>
	);
}
