"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getAllOrganizations,
  getUserOrganizationHierarchy,
} from "@/app/actions/organization.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

interface OrganizationOption {
  id: string;
  name: string;
  level: string;
}

interface OrganizationSelectorProps {
  value?: string;
  onChange: (organizationId: string) => void;
  scope: "hierarchy" | "all";
  label?: string;
  description?: string;
}

export function OrganizationSelector({
  value,
  onChange,
  scope,
  label = "Parish / Outstation",
  description,
}: OrganizationSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleDefaultValue = useCallback(
    (defaultOrganizationId: string) => {
      if (!value) {
        onChange(defaultOrganizationId);
      }
    },
    [onChange, value],
  );

  useEffect(() => {
    startTransition(async () => {
      setIsLoading(true);

      const result =
        scope === "all"
          ? await getAllOrganizations()
          : await getUserOrganizationHierarchy();

      if (result.success && result.data) {
        let options: OrganizationOption[];

        if (scope === "all" && Array.isArray(result.data)) {
          options = result.data.map((org) => ({
            id: org.id,
            name: org.name,
            level: org.level,
          }));
        } else if (!Array.isArray(result.data)) {
          options = [result.data.myOrganization, ...result.data.outstations];
        } else {
          options = [];
        }

        setOrganizations(options);
        if (options.length > 0) {
          handleDefaultValue(options[0].id);
        }
      } else {
        setOrganizations([]);
      }

      setIsLoading(false);
    });
  }, [handleDefaultValue, scope, startTransition]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-10 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <Label className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {label}
        </Label>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Select
        value={value || organizations[0]?.id || ""}
        onValueChange={onChange}
        disabled={isPending}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((organization) => (
            <SelectItem key={organization.id} value={organization.id}>
              <div className="flex items-center justify-between gap-2">
                <span>{organization.name}</span>
                <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                  {organization.level === "PARISH" ? "Parish" : "Outstation"}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
