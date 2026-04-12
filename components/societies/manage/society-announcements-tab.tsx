"use client";

import {
  createSocietyAnnouncement,
  approveSocietyAnnouncement,
  rejectSocietyAnnouncement,
} from "@/app/actions/announcement.actions";
import { canApproveAnnouncements } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  Megaphone,
  Plus,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  approvalStatus: string;
  rejectionReason: string | null;
  societyId: string | null;
};

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: Clock,
    variant: "secondary" as const,
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    icon: Clock,
    variant: "outline" as const,
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    variant: "default" as const,
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    variant: "destructive" as const,
  },
};

interface SocietyAnnouncementsTabProps {
  societyId: string;
  announcements: AnnouncementItem[];
  userRole: string;
}

export function SocietyAnnouncementsTab({
  societyId,
  announcements,
  userRole,
}: SocietyAnnouncementsTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectTarget, setRejectTarget] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const isApprover = canApproveAnnouncements(userRole);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    startTransition(async () => {
      const result = await createSocietyAnnouncement(societyId, {
        title: title.trim(),
        content: content.trim(),
      });
      if (result.success) {
        toast.success(result.message);
        setCreateOpen(false);
        setTitle("");
        setContent("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveSocietyAnnouncement(id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    startTransition(async () => {
      const result = await rejectSocietyAnnouncement(
        rejectTarget,
        rejectReason.trim() || undefined,
      );
      if (result.success) {
        toast.success(result.message);
        setRejectOpen(false);
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Society Announcements</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Announcements created here require approval from a Parish Admin or
          Secretary before they are published.
        </p>
      </div>

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No announcements yet.</p>
            <Button
              variant="link"
              className="mt-1"
              onClick={() => setCreateOpen(true)}
            >
              Create your first announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const config =
              STATUS_CONFIG[a.approvalStatus as keyof typeof STATUS_CONFIG] ||
              STATUS_CONFIG.DRAFT;
            const StatusIcon = config.icon;
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDate(a.createdAt)}
                        {a.publishedAt &&
                          ` · Published ${formatDate(a.publishedAt)}`}
                      </p>
                    </div>
                    <Badge variant={config.variant} className="shrink-0">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {a.content}
                  </p>

                  {a.approvalStatus === "REJECTED" && a.rejectionReason && (
                    <div className="mt-3 rounded border border-destructive/30 bg-destructive/5 p-2">
                      <p className="text-xs font-medium text-destructive">
                        Rejection reason:
                      </p>
                      <p className="text-xs text-destructive/80 mt-0.5">
                        {a.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Admin approval actions */}
                  {isApprover && a.approvalStatus === "PENDING_APPROVAL" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(a.id)}
                        disabled={isPending}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectTarget(a.id);
                          setRejectOpen(true);
                        }}
                        disabled={isPending}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Announcement Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              This announcement will be submitted for approval by the Parish
              Admin or Secretary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                maxLength={150}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement..."
                rows={5}
                maxLength={4000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/4000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Announcement</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this announcement being rejected?"
              rows={3}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
