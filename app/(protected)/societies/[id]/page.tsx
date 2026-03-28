import { redirect } from "next/navigation";

interface SocietyDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function SocietyDetailPage({
	params,
}: SocietyDetailPageProps) {
	const { id } = await params;
	redirect(`/dashboard/societies/${id}`);
}
