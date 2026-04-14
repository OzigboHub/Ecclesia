"use client";

import { useState } from "react";
import {
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
} from "@/app/actions/payment-type.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  Plus,
  Pencil,
  Trash2,
  HandCoins,
  Heart,
  Church,
  MoreHorizontal,
} from "lucide-react";

type PaymentTypeItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
};

const CATEGORIES = [
  { value: "OFFERING", label: "Offering", icon: Church },
  { value: "TITHE", label: "Tithe", icon: HandCoins },
  { value: "DONATION", label: "Donation", icon: Heart },
  { value: "OTHER", label: "Other", icon: MoreHorizontal },
] as const;

function getCategoryBadgeVariant(category: string) {
  switch (category) {
    case "OFFERING":
      return "default";
    case "TITHE":
      return "secondary";
    case "DONATION":
      return "success";
    default:
      return "outline";
  }
}

export function PaymentTypesClient({
  initialPaymentTypes,
}: {
  initialPaymentTypes: PaymentTypeItem[];
}) {
  const [paymentTypes, setPaymentTypes] =
    useState<PaymentTypeItem[]>(initialPaymentTypes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentTypeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("OFFERING");

  function resetForm() {
    setName("");
    setDescription("");
    setCategory("OFFERING");
  }

  function openEdit(item: PaymentTypeItem) {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || "");
    setCategory(item.category);
  }

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      const result = await createPaymentType({ name, description, category });
      if (result.success) {
        toast.success(result.message);
        setPaymentTypes((prev) => [...prev, result.data as PaymentTypeItem]);
        setIsCreateOpen(false);
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to create payment type");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const result = await updatePaymentType(editingItem.id, {
        name,
        description,
        category,
      });
      if (result.success) {
        toast.success(result.message);
        setPaymentTypes((prev) =>
          prev.map((pt) =>
            pt.id === editingItem.id
              ? { ...pt, name, description, category }
              : pt,
          ),
        );
        setEditingItem(null);
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update payment type");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deletePaymentType(id);
      if (result.success) {
        toast.success(result.message);
        setPaymentTypes((prev) => prev.filter((pt) => pt.id !== id));
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to delete payment type");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(item: PaymentTypeItem) {
    try {
      const result = await updatePaymentType(item.id, {
        isActive: !item.isActive,
      });
      if (result.success) {
        toast.success(
          item.isActive ? "Payment type deactivated" : "Payment type activated",
        );
        setPaymentTypes((prev) =>
          prev.map((pt) =>
            pt.id === item.id ? { ...pt, isActive: !pt.isActive } : pt,
          ),
        );
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update payment type");
    }
  }

  // Group by category
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: paymentTypes.filter((pt) => pt.category === cat.value),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button onClick={resetForm}>
            <Plus className="h-4 w-4 mr-2" />
            Create Payment Type
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payment Type</DialogTitle>
          </DialogHeader>
          <PaymentTypeForm
            name={name}
            description={description}
            category={category}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategory}
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            resetForm();
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Type</DialogTitle>
          </DialogHeader>
          <PaymentTypeForm
            name={name}
            description={description}
            category={category}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategory}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
            submitLabel="Update"
          />
        </DialogContent>
      </Dialog>

      {/* Empty state */}
      {paymentTypes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <HandCoins className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No payment types yet</p>
          <p className="text-sm">
            Create payment types like &quot;Sunday Offering&quot;,
            &quot;Tithe&quot;, or &quot;Donation for Church Building&quot; for
            parishioners to use.
          </p>
        </div>
      )}

      {/* Grouped List */}
      {grouped.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.value} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{group.label}s</h2>
              <Badge
                variant={
                  getCategoryBadgeVariant(group.value) as
                    | "default"
                    | "secondary"
                    | "success"
                    | "outline"
                }>
                {group.items.length}
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 space-y-2 ${
                    item.isActive ? "bg-card" : "bg-muted/50 opacity-60"
                  }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {!item.isActive && (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(item)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(item)}>
                      {item.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}>
                      {deletingId === item.id ? (
                        <Spinner className="h-3 w-3" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentTypeForm({
  name,
  description,
  category,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  name: string;
  description: string;
  category: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-primary">
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          placeholder="e.g. Sunday Offering, Birthday Thanksgiving"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (optional)</label>
        <Input
          placeholder="Brief description of this payment type"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={isSubmitting || !name.trim()}>
        {isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
        {submitLabel}
      </Button>
    </div>
  );
}
