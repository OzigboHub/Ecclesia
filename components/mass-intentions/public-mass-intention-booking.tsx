"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { initializePaystackPayment } from "@/app/actions/paystack.actions";
import { submitPublicMassIntention } from "@/app/actions/mass-intention.actions";
import {
  publicMassIntentionSchema,
  type PublicMassIntentionInput,
} from "@/lib/validators/mass-intention.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

interface PublicMassIntentionBookingProps {
  organizationId: string;
  massId: string;
}

export function PublicMassIntentionBooking({
  organizationId,
  massId,
}: PublicMassIntentionBookingProps) {
  const [isPending, startTransition] = useTransition();
  const platformFee = 0; // Fee calculated server-side at checkout

  const form = useForm<PublicMassIntentionInput>({
    resolver: zodResolver(publicMassIntentionSchema),
    defaultValues: {
      intentionType: "SPECIAL_INTENTION",
      intention: "",
      requestedBy: "",
      contactEmail: "",
      contactPhone: "",
      intendedFor: "",
      massId,
      stipend: 500,
    },
  });

  const onSubmit = (data: PublicMassIntentionInput) => {
    startTransition(async () => {
      const result = await submitPublicMassIntention(organizationId, data);
      if (result.success) {
        const massIntentionId = (result.data as { id?: string } | undefined)
          ?.id;
        if (!massIntentionId) {
          toast.error(
            "Mass intention was created but payment could not be started",
          );
          return;
        }

        const paymentResult = await initializePaystackPayment(
          {
            amount: data.stipend,
            email: data.contactEmail || `anonymous-${Date.now()}@ecclesia.app`,
            purpose: "MASS_INTENTION",
            payerName: data.requestedBy || "Anonymous",
            massIntentionId,
          },
          organizationId,
        );

        if (!paymentResult.success) {
          toast.error(paymentResult.message);
          return;
        }

        toast.success("Mass intention submitted. Redirecting to payment...");
        const authorizationUrl = (
          paymentResult.data as { authorizationUrl?: string } | undefined
        )?.authorizationUrl;
        if (authorizationUrl) {
          window.location.href = authorizationUrl;
          return;
        }
        toast.error("Payment gateway URL was not returned");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-lg">
        <FormField
          control={form.control}
          name="intention"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intention</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter your prayer intention..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="intentionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-primary">
                  <SelectItem value="THANKSGIVING">Thanksgiving</SelectItem>
                  <SelectItem value="REQUIEM">Requiem</SelectItem>
                  <SelectItem value="SPECIAL_INTENTION">
                    Special Intention
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="requestedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Anonymous if left blank" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="intendedFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intended For (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Name of person the intention is for"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stipend"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stipend Amount (₦)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={500}
                    step="0.01"
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                    placeholder="500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="08012345678" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="For payment receipt (optional)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <p>
            Mass intention payment has a minimum of ₦500. Bank charges apply at
            checkout.
          </p>
        </div>

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Submitting..." : "Submit Intention & Pay"}
        </Button>
      </form>
    </Form>
  );
}
