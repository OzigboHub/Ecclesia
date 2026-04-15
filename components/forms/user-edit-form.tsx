"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserSchema,
  type UpdateUserInput,
  userRoles,
  roleLabels,
  roleDescriptions,
} from "@/lib/validators/user.schema";
import { updateUser } from "@/app/actions/user.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Info } from "lucide-react";
import type { User } from "@prisma/client";

interface UserEditFormProps {
  user: Omit<User, "password">;
  onSuccess?: () => void;
  currentUserRole?: string;
}

export function UserEditForm({
  user,
  onSuccess,
  currentUserRole = "PARISH_ADMIN",
}: UserEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    setValue,
    watch,
  } = form;

  // Filter roles based on current user's role
  const availableRoles = userRoles.filter((role) => {
    const roleHierarchy: Record<string, number> = {
      SUPER_ADMIN: 100,
      PARISH_ADMIN: 80,
      PARISH_SECRETARY: 60,
      PARISH_STAFF: 40,
      OUTSTATION_ADMIN: 40,
      SOCIETY_PRESIDENT: 30,
      SOCIETY_SECRETARY: 30,
      PARISHIONER: 10,
    };
    const currentLevel = roleHierarchy[currentUserRole] ?? 0;
    const targetLevel = roleHierarchy[role] ?? 0;
    return currentLevel > targetLevel;
  });

  const onSubmit = (data: UpdateUserInput) => {
    startTransition(async () => {
      const result = await updateUser(user.id, data);

      if (result.success) {
        toast.success(result.message);
        router.push("/users");
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(result.message);

        // Set server-side validation errors on fields
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as keyof UpdateUserInput, {
              type: "server",
              message: messages[0],
            });
          });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update the user&apos;s personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="Enter first name"
                disabled={isPending}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
              />
              {errors.firstName && (
                <p
                  id="firstName-error"
                  className="text-sm text-destructive"
                  role="alert">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Enter last name"
                disabled={isPending}
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? "lastName-error" : undefined
                }
              />
              {errors.lastName && (
                <p
                  id="lastName-error"
                  className="text-sm text-destructive"
                  role="alert">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="Enter email address"
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive"
                role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Role Assignment</CardTitle>
          <CardDescription>
            Change the user&apos;s role and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={watch("role")}
              onValueChange={(value) =>
                setValue("role", value as UpdateUserInput["role"], {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={isPending}>
              <SelectTrigger
                id="role"
                aria-invalid={!!errors.role}
                aria-describedby={errors.role ? "role-error" : undefined}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-primary">
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <span>{roleLabels[role]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p
                id="role-error"
                className="text-sm text-destructive"
                role="alert">
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Role Description */}
          {watch("role") && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    {roleLabels[watch("role") as keyof typeof roleLabels]}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {
                      roleDescriptions[
                        watch("role") as keyof typeof roleDescriptions
                      ]
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
