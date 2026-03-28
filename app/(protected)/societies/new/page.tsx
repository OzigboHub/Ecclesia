import { redirect } from "next/navigation";

export default async function NewSocietyPage() {
	redirect("/dashboard/societies/new");
}
