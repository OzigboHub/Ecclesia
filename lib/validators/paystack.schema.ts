import { z } from "zod";

const nairaAmountSchema = z
  .number()
  .positive("Amount must be greater than ₦0")
  .max(100_000_000, "Amount cannot exceed ₦100,000,000")
  .multipleOf(0.01, "Amount must have at most 2 decimal places");

export const organizationPaystackProfileSchema = z.object({
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be 10 digits"),
  bankCode: z.string().min(2, "Bank code is required").max(20),
  bankName: z.string().min(2, "Bank name is required").max(100),
  businessName: z.string().min(2).max(120).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
  settlementSchedule: z
    .enum(["auto", "weekly", "monthly", "manual"])
    .default("manual"),
  createDedicatedAccount: z.boolean().default(true),
  dedicatedProviderSlug: z.string().min(2).max(50).optional(),
});

export type OrganizationPaystackProfileInput = z.infer<
  typeof organizationPaystackProfileSchema
>;

export const withdrawalRequestSchema = z.object({
  amount: nairaAmountSchema,
  notes: z.string().max(500).optional(),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;