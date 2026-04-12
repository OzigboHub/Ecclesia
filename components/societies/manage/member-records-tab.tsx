"use client";

import type { SocietyMemberRecord } from "@/app/actions/society.actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import * as React from "react";

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
  members: SocietyMemberRecord[];
}

export function MemberRecordsTab({ members }: MemberRecordsTabProps) {
  const [search, setSearch] = React.useState("");

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
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
