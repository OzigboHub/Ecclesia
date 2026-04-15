import { getAnnouncementsFiltered } from "@/app/actions/announcement.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AnnouncementsClient from "./announcements-client";

const ANNOUNCEMENT_WRITER_ROLES = [
  "SUPER_ADMIN",
  "PARISH_ADMIN",
  "PARISH_SECRETARY",
  "PARISH_STAFF",
  "OUTSTATION_ADMIN",
];

export default async function AnnouncementsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const searchParams = await searchParamsPromise;

  const result = await getAnnouncementsFiltered({
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 50,
    search: searchParams.search,
    status: searchParams.status as any,
  });

  if (!result.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-destructive">{result.message}</p>
        </div>
      </div>
    );
  }

  const { announcements, total } = result.data!;
  const canWrite = ANNOUNCEMENT_WRITER_ROLES.includes(session.user.role);
  const canDelete = ["SUPER_ADMIN", "PARISH_ADMIN"].includes(session.user.role);

  return (
    <div className="space-y-6">
      <AnnouncementsClient
        initialAnnouncements={announcements}
        total={total}
        canWrite={canWrite}
        canDelete={canDelete}
      />
    </div>
  );
}
