"use client";

import {
  deleteAnnouncement,
  updateAnnouncement,
} from "@/app/actions/announcement.actions";
import { AnnouncementForm } from "@/components/forms/announcement-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
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
  publishedAt: Date | string | null;
  expiresAt: Date | string | null;
  createdAt: Date | string;
};

interface AnnouncementsClientProps {
  initialAnnouncements: AnnouncementItem[];
  total: number;
  canWrite: boolean;
  canDelete: boolean;
}

function getStatus(
  a: AnnouncementItem,
): "draft" | "scheduled" | "active" | "expired" {
  const now = new Date();
  if (!a.isPublished) return "draft";
  const publishedAt = a.publishedAt ? new Date(a.publishedAt) : null;
  const expiresAt = a.expiresAt ? new Date(a.expiresAt) : null;
  if (publishedAt && publishedAt > now) return "scheduled";
  if (expiresAt && expiresAt <= now) return "expired";
  return "active";
}

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    icon: EyeOff,
    className: "bg-muted text-muted-foreground",
  },
  scheduled: {
    label: "Upcoming",
    icon: CalendarClock,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  expired: {
    label: "Expired",
    icon: XCircle,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
} as const;

function formatDate(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementsClient({
  initialAnnouncements,
  total,
  canWrite,
  canDelete,
}: AnnouncementsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editAnnouncement, setEditAnnouncement] =
    React.useState<AnnouncementItem | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<AnnouncementItem | null>(null);

  const handleDelete = (a: AnnouncementItem) => {
    setDeleteTarget(a);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(deleteTarget.id);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.refresh();
      }
      setDeleteTarget(null);
    });
  };

  const handleTogglePublish = (a: AnnouncementItem) => {
    startTransition(async () => {
      const result = await updateAnnouncement(a.id, {
        isPublished: !a.isPublished,
      });
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Announcements
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Publish updates to parishioners and the public.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["active", "scheduled", "draft", "expired"] as const).map(
          (status) => {
            const count = initialAnnouncements.filter(
              (a) => getStatus(a) === status,
            ).length;
            const cfg = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                className="bg-background border border-border rounded-lg p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {cfg.label}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {count}
                </p>
              </div>
            );
          },
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {initialAnnouncements.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background p-10 text-center text-muted-foreground">
            No announcements yet.{" "}
            {canWrite && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="underline underline-offset-2 hover:text-foreground transition-colors">
                Create one now.
              </button>
            )}
          </div>
        ) : (
          initialAnnouncements.map((a) => {
            const status = getStatus(a);
            const cfg = STATUS_CONFIG[status];
            const StatusIcon = cfg.icon;

            return (
              <div
                key={a.id}
                className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Image thumbnail */}
                  {a.imageUrl ? (
                    <div className="hidden sm:flex shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border">
                      <img
                        src={a.imageUrl}
                        alt={a.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="hidden sm:flex shrink-0 w-16 h-16 rounded-md border border-dashed border-border items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          cfg.className,
                        )}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-base leading-tight truncate">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {a.content}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {a.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Published: {formatDate(a.publishedAt)}
                        </span>
                      )}
                      {a.expiresAt && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          Expires: {formatDate(a.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {canWrite && (
                    <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={a.isPublished ? "Unpublish" : "Publish"}
                        onClick={() => handleTogglePublish(a)}
                        disabled={isPending}
                        className="h-8 w-8">
                        {a.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => setEditAnnouncement(a)}
                        disabled={isPending}
                        className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDelete(a)}
                          disabled={isPending}
                          className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {canWrite && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="New Announcement"
          className="max-w-xl">
          <div className="p-6 overflow-y-auto">
            <AnnouncementForm
              onSuccess={() => {
                setIsCreateOpen(false);
                router.refresh();
              }}
            />
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {canWrite && editAnnouncement && (
        <Modal
          isOpen={!!editAnnouncement}
          onClose={() => setEditAnnouncement(null)}
          title="Edit Announcement"
          className="max-w-xl">
          <div className="p-6 overflow-y-auto">
            <AnnouncementForm
              announcement={{
                id: editAnnouncement.id,
                title: editAnnouncement.title,
                content: editAnnouncement.content,
                imageUrl: editAnnouncement.imageUrl ?? "",
                publishAt: editAnnouncement.publishedAt
                  ? new Date(editAnnouncement.publishedAt)
                  : new Date(),
                expiresAt: editAnnouncement.expiresAt
                  ? new Date(editAnnouncement.expiresAt)
                  : null,
                isPublished: editAnnouncement.isPublished,
              }}
              onSuccess={() => {
                setEditAnnouncement(null);
                router.refresh();
              }}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Announcement"
        className="max-w-sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{deleteTarget?.title}&rdquo;
            </span>
            ? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
