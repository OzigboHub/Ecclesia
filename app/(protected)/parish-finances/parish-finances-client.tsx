"use client";

import { deleteParishFinancialEntry } from "@/app/actions/parish-financial.actions";
import { Button } from "@/components/ui/button";
import {
  ENTRY_TYPE_LABELS,
  type ParishFinancialEntryType,
} from "@/lib/validators/parish-financial.schema";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface Entry {
  id: string;
  entryType: string;
  title: string;
  customTitle: string | null;
  amount: number;
  date: string | Date;
  notes: string | null;
  createdAt: string | Date;
  recordedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ParishFinancesClientProps {
  initialEntries: Entry[];
  total: number;
  canDelete?: boolean;
}

export function ParishFinancesClient({
  initialEntries,
  total,
  canDelete = false,
}: ParishFinancesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    startTransition(async () => {
      const result = await deleteParishFinancialEntry(id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  if (initialEntries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No financial entries recorded yet. Click &quot;New Entry&quot; to get
          started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">
                Date
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">
                Type
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">
                Title
              </th>
              <th className="text-right p-3 font-medium text-muted-foreground">
                Amount
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">
                Recorded By
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">
                Notes
              </th>
              {canDelete && (
                <th className="text-right p-3 font-medium text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {initialEntries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3 whitespace-nowrap">
                  {new Date(entry.date).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                    {ENTRY_TYPE_LABELS[
                      entry.entryType as ParishFinancialEntryType
                    ] || entry.entryType}
                  </span>
                </td>
                <td className="p-3 font-medium">{entry.title}</td>
                <td className="p-3 text-right font-semibold whitespace-nowrap">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(entry.amount)}
                </td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">
                  {entry.recordedBy.firstName} {entry.recordedBy.lastName}
                </td>
                <td className="p-3 hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                  {entry.notes || "—"}
                </td>
                {canDelete && (
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entry.id, entry.title)}
                      disabled={isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > initialEntries.length && (
        <div className="p-3 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Showing {initialEntries.length} of {total} entries
          </p>
        </div>
      )}
    </div>
  );
}
