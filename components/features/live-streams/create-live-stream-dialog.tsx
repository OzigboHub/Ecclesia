"use client";

import {
  createLiveStream,
  getMassesForStreamLinking,
} from "@/app/actions/live-stream.actions";
import { formatTime12h } from "@/lib/format-time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MassOption {
  id: string;
  date: string;
  time: string;
  massType: string;
  celebrant: string | null;
  location: string | null;
}

export function CreateLiveStreamDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [masses, setMasses] = useState<MassOption[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    streamUrl: "",
    massId: "",
  });

  useEffect(() => {
    if (isOpen) {
      getMassesForStreamLinking().then((result) => {
        if (result.success && result.data) {
          setMasses(result.data as MassOption[]);
        }
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.streamUrl) {
      toast.error("Title and stream URL are required");
      return;
    }

    setIsPending(true);
    try {
      const result = await createLiveStream({
        title: formData.title,
        description: formData.description || undefined,
        streamUrl: formData.streamUrl,
        massId: formData.massId || undefined,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsOpen(false);
      setFormData({
        title: "",
        description: "",
        streamUrl: "",
        massId: "",
      });
    } finally {
      setIsPending(false);
    }
  };

  const formatMassLabel = (mass: MassOption) => {
    const date = format(new Date(mass.date), "MMM d, yyyy");
    const type = mass.massType.replace(/_/g, " ");
    return `${date} at ${formatTime12h(mass.time)} — ${type}${mass.celebrant ? ` (${mass.celebrant})` : ""}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Live Stream
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Live Stream</DialogTitle>
          <DialogDescription>
            Paste your YouTube live stream URL to broadcast a mass on the
            platform. Parishioners will be able to watch directly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="stream-title">Title *</Label>
            <Input
              id="stream-title"
              placeholder="e.g. Sunday Mass Live Stream"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stream-url">YouTube URL *</Label>
            <Input
              id="stream-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formData.streamUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  streamUrl: e.target.value,
                }))
              }
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Paste the YouTube live stream or video URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stream-mass">Link to Mass</Label>
            <Select
              value={formData.massId}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  massId: value === "none" ? "" : value,
                }))
              }
              disabled={isPending}>
              <SelectTrigger id="stream-mass">
                <SelectValue placeholder="Select a mass (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-primary">
                <SelectItem value="none">No linked mass</SelectItem>
                {masses.map((mass) => (
                  <SelectItem key={mass.id} value={mass.id}>
                    {formatMassLabel(mass)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stream-description">Description</Label>
            <Input
              id="stream-description"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={isPending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating..." : "Create Stream"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
