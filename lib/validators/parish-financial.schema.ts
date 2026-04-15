import { z } from "zod";

export const parishFinancialEntryTypes = [
  "SUNDAY_OFFERING",
  "FIRST_COLLECTION",
  "SECOND_COLLECTION",
  "OTHER",
] as const;

export type ParishFinancialEntryType =
  (typeof parishFinancialEntryTypes)[number];

export const ENTRY_TYPE_LABELS: Record<ParishFinancialEntryType, string> = {
  SUNDAY_OFFERING: "Sunday Offering",
  FIRST_COLLECTION: "First Collection",
  SECOND_COLLECTION: "Second Collection",
  OTHER: "Others",
};

// ============================================
// BASE OBJECT (without refinement, for .partial())
// ============================================

const baseParishFinancialEntryFields = z.object({
  entryType: z.enum(parishFinancialEntryTypes, {
    message: "Entry type is required",
  }),
  customTitle: z
    .string()
    .max(200, "Title must not exceed 200 characters")
    .optional(),
  amount: z
    .number()
    .positive("Amount must be greater than ₦0")
    .max(100_000_000, "Amount cannot exceed ₦100,000,000"),
  date: z.string().min(1, "Date is required"),
  notes: z
    .string()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional(),
});

const otherTitleRefinement = (data: {
  entryType?: string;
  customTitle?: string;
}) => {
  if (data.entryType === "OTHER") {
    return !!data.customTitle && data.customTitle.trim().length > 0;
  }
  return true;
};

const otherTitleRefinementMessage = {
  message: "Title is required when entry type is 'Others'",
  path: ["customTitle"] as [string],
};

// ============================================
// CREATE SCHEMA
// ============================================

export const createParishFinancialEntrySchema =
  baseParishFinancialEntryFields.refine(
    otherTitleRefinement,
    otherTitleRefinementMessage,
  );

export type CreateParishFinancialEntryInput = z.infer<
  typeof createParishFinancialEntrySchema
>;

// ============================================
// UPDATE SCHEMA
// ============================================

export const updateParishFinancialEntrySchema = baseParishFinancialEntryFields
  .partial()
  .refine(otherTitleRefinement, otherTitleRefinementMessage);

export type UpdateParishFinancialEntryInput = z.infer<
  typeof updateParishFinancialEntrySchema
>;

// ============================================
// QUERY SCHEMA
// ============================================

export const parishFinancialQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  entryType: z.enum(parishFinancialEntryTypes).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ParishFinancialQuery = z.infer<typeof parishFinancialQuerySchema>;
