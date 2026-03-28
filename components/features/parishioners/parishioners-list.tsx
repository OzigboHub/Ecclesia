"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UnifiedParishioner } from "@/app/actions/parishioner.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteParishioner,
  bulkDeleteParishioners,
  exportParishioners,
} from "@/app/actions/parishioner.actions";
import { toast } from "sonner";
import {
  Edit2,
  Trash2,
  Eye,
  Search,
  Download,
  X,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";

interface ParishionersListProps {
  parishioners: UnifiedParishioner[];
}

export function ParishionersList({
  parishioners: initialParishioners,
}: ParishionersListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredParishioners = initialParishioners.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.email ?? ""} ${p.phone ?? ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  // Only parishioner-sourced records can be selected/deleted
  const selectableIds = new Set(
    filteredParishioners
      .filter((p) => p.source === "parishioner")
      .map((p) => p.id),
  );

  const allSelectableSelected =
    selectableIds.size > 0 && selectedIds.size === selectableIds.size;

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    setIsDeleting(id);
    const result = await deleteParishioner(id);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setIsDeleting(null);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const result = await bulkDeleteParishioners(Array.from(selectedIds));

    if (result.success) {
      toast.success(result.message);
      setSelectedIds(new Set());
      setShowDeleteDialog(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setIsBulkDeleting(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const idsToExport =
      selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
    const result = await exportParishioners(idsToExport);

    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `parishioners-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export successful");
    } else {
      toast.error(result.message || "Export failed");
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-4">
      {/* Search and Bulk Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parishioners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                Export ({selectedIds.size})
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedIds.size})
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedIds(new Set())}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {selectedIds.size === 0 && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredParishioners.length} of {initialParishioners.length}{" "}
        parishioner(s)
      </p>

      {filteredParishioners.length === 0 ? (
        <div className="rounded-lg border text-center py-12 text-muted-foreground">
          {searchTerm
            ? `No parishioners found matching "${searchTerm}"`
            : "No parishioners yet. Add your first parishioner to get started."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelectableSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Gender</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Marital Status
                </TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParishioners.map((p) => {
                const isParishioner = p.source === "parishioner";
                const isSelected = selectedIds.has(p.id);
                const initials =
                  `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

                return (
                  <TableRow
                    key={p.id}
                    className={isSelected ? "bg-muted/50" : ""}>
                    {/* Checkbox */}
                    <TableCell>
                      {isParishioner ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(p.id)}
                          aria-label={`Select ${p.firstName} ${p.lastName}`}
                        />
                      ) : (
                        <span className="w-4 inline-block" />
                      )}
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage
                            src={p.photoUrl || undefined}
                            alt={`${p.firstName} ${p.lastName}`}
                          />
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground md:hidden truncate">
                            {p.email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {p.email ?? "—"}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {p.phone ?? "—"}
                    </TableCell>

                    {/* Gender */}
                    <TableCell className="hidden lg:table-cell text-sm">
                      {p.gender ?? "—"}
                    </TableCell>

                    {/* Marital Status */}
                    <TableCell className="hidden lg:table-cell text-sm">
                      {p.maritalStatus ?? "—"}
                    </TableCell>

                    {/* Type */}
                    <TableCell className="hidden lg:table-cell">
                      {isParishioner ? (
                        <Badge variant="outline">Parishioner</Badge>
                      ) : (
                        <Badge variant="secondary">Portal User</Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {isParishioner ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/parishioners/${p.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/parishioners/${p.id}/edit`}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={isDeleting === p.id}
                              onClick={() =>
                                handleDelete(
                                  p.id,
                                  `${p.firstName} ${p.lastName}`,
                                )
                              }>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {isDeleting === p.id ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Managed via Users
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} Parishioner(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected parishioners will be
              removed from your organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isBulkDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
