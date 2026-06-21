"use client";

import {
  updateMembershipDate,
  type SocietyMemberRecord,
} from "@/app/actions/society.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Member",
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  SECRETARY: "Secretary",
  TREASURER: "Treasurer",
  PRO: "PRO",
  OTHER: "Other",
};

interface MemberRecordsTabProps {
  societyId: string;
  members: SocietyMemberRecord[];
}

export function MemberRecordsTab({ societyId, members }: MemberRecordsTabProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<SocietyMemberRecord | null>(
    null
  );
  const [membershipDateInput, setMembershipDateInput] = React.useState("");

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const dateToIsoString = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const day = `0${d.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  const handleOpenEditDialog = (member: SocietyMemberRecord) => {
    setSelectedMember(member);
    setMembershipDateInput(dateToIsoString(member.membershipDate || member.joinedAt));
    setDialogOpen(true);
  };

  const handleSaveMembershipDate = () => {
    if (!selectedMember) return;

    startTransition(async () => {
      const selectedDate = membershipDateInput ? new Date(membershipDateInput) : null;
      const res = await updateMembershipDate(
        societyId,
        selectedMember.parishionerId,
        selectedDate
      );

      if (res.success) {
        toast.success(res.message);
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">
          Member Records ({members.length})
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Platform Joined</TableHead>
                  <TableHead>Membership Start</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-8"
                    >
                      {search
                        ? "No members match your search."
                        : "No members in this society."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((m) => (
                    <TableRow key={m.parishionerId}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {m.firstName} {m.lastName}
                        {m.otherNames && (
                          <span className="text-muted-foreground ml-1">
                            ({m.otherNames})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"].includes(m.role)
                              ? "default"
                              : "outline"
                          }
                        >
                          {ROLE_LABELS[m.role] || m.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{m.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{m.email || "—"}</TableCell>
                      <TableCell className="text-sm capitalize">
                        {m.gender?.toLowerCase() || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(m.dateOfBirth)}
                      </TableCell>
                      <TableCell className="text-sm max-w-50 truncate">
                        {m.address || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(m.joinedAt)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatDate(m.membershipDate || m.joinedAt)}
                        {m.membershipDate && (
                          <Badge variant="outline" className="ml-1 text-[9px] bg-blue-50/50 border-blue-200 text-blue-600 font-normal">
                            Assigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(m)}
                          className="h-8 text-xs"
                        >
                          <Calendar className="mr-1 h-3.5 w-3.5 text-primary" />
                          Set Start
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Membership Date Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Membership Start Date</DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <>
                  Assign the actual membership date for{" "}
                  <strong>
                    {selectedMember.firstName} {selectedMember.lastName}
                  </strong>
                  . Dues calculation and outstanding balances will be computed starting from this date.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="membershipDate">Membership Start Date</Label>
              <Input
                id="membershipDate"
                type="date"
                value={membershipDateInput}
                onChange={(e) => setMembershipDateInput(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If left blank, calculations will default to when the member joined this platform.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMembershipDate} disabled={isPending}>
              {isPending ? "Saving..." : "Save Date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
