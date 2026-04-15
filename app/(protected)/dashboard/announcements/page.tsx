import { redirect } from "next/navigation";

export default async function DashboardAnnouncementsRedirectPage() {
  redirect("/announcements");
}
