"use client";

import { exportMassIntentions } from "@/app/actions/mass-intention.actions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

export function MassIntentionExportButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportMassIntentions();

      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mass-intentions-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Mass intentions exported successfully");
      } else {
        toast.error(result.message || "Failed to export");
      }
    });
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      <Download className="mr-2 h-4 w-4" />
      {isPending ? "Exporting..." : "Export"}
    </Button>
  );
}
