import {
  getJoinRequestsForSociety,
  getSociety,
  JoinRequestWithParishioner,
} from "@/app/actions/society.actions";
import { auth } from "@/auth";
import { AddMemberDialog } from "@/components/societies/add-member-dialog";
import { CreateMeetingDialog } from "@/components/societies/create-meeting-dialog";
import { JoinRequestButton } from "@/components/societies/join-request-button";
import { JoinRequestsPanel } from "@/components/societies/join-requests-panel";
import { MemberListItem } from "@/components/societies/member-list-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db";
import { canManageSocieties } from "@/lib/permissions";
import { ArrowLeft, Edit2, Settings, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface SocietyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SocietyDetailPage({
  params,
}: SocietyDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const result = await getSociety(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const society = result.data;
  const isParishioner = session.user.role === "PARISHIONER";
  const isSecretary = session.user.role === "PARISH_SECRETARY";
  const canManage = canManageSocieties(session.user.role);
  const isSocietyLeader =
    society.presidentId === session.user.id ||
    society.secretaryId === session.user.id;
  const canReviewRequests = canManage || isSocietyLeader;
  const canEdit = canManage || isSocietyLeader;
  const isViewOnly = isParishioner || isSecretary;

  let joinStatus: "NONE" | "PENDING" | "MEMBER" | "REJECTED" = "NONE";
  if (isParishioner && session.user.parishionerId) {
    const [membership, joinRequest] = await Promise.all([
      db.societyMembership.findUnique({
        where: {
          parishionerId_societyId: {
            parishionerId: session.user.parishionerId,
            societyId: id,
          },
        },
        select: { parishionerId: true },
      }),
      db.societyJoinRequest.findUnique({
        where: {
          parishionerId_societyId: {
            parishionerId: session.user.parishionerId,
            societyId: id,
          },
        },
        select: { status: true },
      }),
    ]);

    if (membership) {
      joinStatus = "MEMBER";
    } else if (joinRequest) {
      joinStatus = joinRequest.status as "PENDING" | "REJECTED";
    }
  }

  let joinRequests: JoinRequestWithParishioner[] = [];
  let joinRequestsError: string | null = null;
  if (canReviewRequests) {
    const requestsResult = await getJoinRequestsForSociety(id);
    if (requestsResult.success && requestsResult.data) {
      joinRequests = requestsResult.data;
    } else if (!requestsResult.success) {
      joinRequestsError = requestsResult.message;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/societies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{society.name}</h1>
          <div className="flex items-center text-muted-foreground mt-1 gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {society.members.length} Members
            </span>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/societies/${society.id}/manage`}>
                <Settings className="mr-2 h-4 w-4" /> Manage
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/societies/${society.id}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          </div>
        )}
        {isParishioner && (
          <JoinRequestButton
            societyId={society.id}
            initialStatus={joinStatus}
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {society.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="members" className="w-full">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="events">Events & Activities</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              {canReviewRequests && (
                <TabsTrigger value="join-requests">
                  Join Requests
                  {joinRequests.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs leading-none text-primary-foreground">
                      {joinRequests.length}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="members" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Members List</CardTitle>
                  {!isViewOnly && <AddMemberDialog societyId={society.id} />}
                </CardHeader>
                <CardContent>
                  {society.members.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <p>No members registered yet.</p>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {society.members.map((membership: any) => (
                        <MemberListItem
                          key={membership.parishionerId}
                          societyId={society.id}
                          membership={membership}
                          readOnly={isViewOnly}
                        />
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="events" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Upcoming Events</CardTitle>
                  {!isViewOnly && (
                    <CreateMeetingDialog societyId={society.id} />
                  )}
                </CardHeader>
                <CardContent>
                  {society.events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No events scheduled.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {society.events.map((event: any) => (
                        <li key={event.id} className="rounded-md border p-3">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.startTime).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <div className="p-4 text-center text-sm text-muted-foreground">
                Coming soon...
              </div>
            </TabsContent>
            {canReviewRequests && (
              <TabsContent value="join-requests" className="mt-4">
                {joinRequestsError && (
                  <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {joinRequestsError}
                  </div>
                )}
                <JoinRequestsPanel requests={joinRequests} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leadership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  President
                </p>
                <p className="font-medium">
                  {society.president
                    ? `${society.president.firstName} ${society.president.lastName}`
                    : "Vacant"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Secretary
                </p>
                <p className="font-medium">
                  {society.secretary
                    ? `${society.secretary.firstName} ${society.secretary.lastName}`
                    : "Vacant"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
