import { redirect } from "next/navigation";

export default async function AppointmentsCalendarPage({
  searchParams: _searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  redirect("/appointments");
}
