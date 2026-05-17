"use client";

import { useCallback, useTransition } from "react";
import { getAllOrganizations } from "@/app/actions/organization.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Organization {
  id: string;
  name: string;
  level: string;
  parentId: string | null;
}

interface OrganizationTransferSelectorProps {
  value: string;
  onChange: (organizationId: string) => void;
  currentOrganizationId?: string;
  userRole?: string;
}

export function OrganizationTransferSelector({
  value,
  onChange,
  currentOrganizationId,
  userRole = " SUPER_ADMIN",
}: OrganizationTransferSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [parishes, setParishes] = useState<Organization[]>([]);
  const [outstations, setOutstations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startTransition(async () => {
      setIsLoading(true);
      const result = await getAllOrganizations();

      if (result.success && result.data) {
        // For SUPER_ADMIN, show all parishes and outstations
        // For PARISH_ADMIN, only show their parish and child outstations
        let availableParishes = result.data.filter(
          (org) => org.level === "PARISH",
        );
        let availableOutstations = result.data.filter(
          (org) => org.level === "OUTSTATION",
        );

        if (userRole === "PARISH_ADMIN" && currentOrganizationId) {
          // Parish admin can only see their own parish
          availableParishes = availableParishes.filter(
            (p) => p.id === currentOrganizationId,
          );

          // And their outstations
          availableOutstations = availableOutstations.filter(
            (o) => o.parentId === currentOrganizationId,
          );
        }

        setParishes(availableParishes);
        setOutstations(availableOutstations);
      }
      setIsLoading(false);
    });
  }, [userRole, currentOrganizationId]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Parish / Outstation</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  const allOrganizations = [...parishes, ...outstations];

  if (allOrganizations.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Parish / Outstation</Label>
        <div className="text-sm text-muted-foreground p-3 border rounded-md">
          No organizations available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Select Target Parish / Outstation
      </Label>
      <Select value={value || ""} onValueChange={onChange} disabled={isPending}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {/* Parishes */}
          {parishes.length > 0 && (
            <>
              {parishes.map((parish) => (
                <SelectItem key={parish.id} value={parish.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{parish.name}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Parish
                    </span>
                    {parish.id === currentOrganizationId && (
                      <span className="text-xs bg-green-100/50 text-green-700 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Outstations */}
          {outstations.length > 0 && (
            <>
              {outstations.map((outstation) => (
                <SelectItem key={outstation.id} value={outstation.id}>
                  <div className="flex items-center gap-2">
                    <span>{outstation.name}</span>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      Outstation
                    </span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
