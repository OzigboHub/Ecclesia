import { redirect } from "next/navigation";

interface EditSocietyPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditSocietyPage({
	params,
}: EditSocietyPageProps) {
	const { id } = await params;
	redirect(`/dashboard/societies/${id}/edit`);
}
