import { z } from "zod";

// Appointment type enum (must match Prisma schema)
export const appointmentTypeEnum = z.enum([
  "CONFESSION",
  "COUNSELING",
  "MEETING",
  "OTHER",
]);

// Appointment status enum
const appointmentStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

const appointmentSourceEnum = z.enum(["INTERNAL", "PUBLIC"]);

const requiredPhoneSchema = z
  .string()
  .regex(
    /^(\+234|0)[789][01]\d{8}$/,
    "Enter a valid Nigerian phone number (e.g., 08012345678)",
  );

// Nigerian phone validation
const phoneSchema = z
  .string()
  .regex(
    /^(\+234|0)[789][01]\d{8}$/,
    "Enter a valid Nigerian phone number (e.g., 08012345678)",
  )
  .optional()
  .or(z.literal(""));

// ============================================
// CREATE APPOINTMENT SCHEMA
// ============================================

export const createAppointmentSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters")
      .trim(),
    description: z
      .string()
      .max(500, "Description must not exceed 500 characters")
      .optional(),
    type: appointmentTypeEnum,
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    assignedToId: z.string().uuid("Invalid staff member selected").optional(),
    parishionerId: z
      .string()
      .min(1, "Please select a parishioner")
      .uuid("Invalid parishioner selected"),
    notes: z
      .string()
      .max(1000, "Notes must not exceed 1000 characters")
      .optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// ============================================
// UPDATE APPOINTMENT SCHEMA
// ============================================

export const updateAppointmentSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters")
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, "Description must not exceed 500 characters")
      .optional(),
    type: appointmentTypeEnum.optional(),
    startTime: z.string().min(1, "Start time is required").optional(),
    endTime: z.string().min(1, "End time is required").optional(),
    assignedToId: z
      .string()
      .uuid("Invalid staff member selected")
      .optional()
      .nullable(),
    parishionerId: z
      .string()
      .min(1, "Please select a parishioner")
      .uuid("Invalid parishioner selected")
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(1000, "Notes must not exceed 1000 characters")
      .optional(),
    status: appointmentStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return end > start;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ============================================
// PUBLIC APPOINTMENT SCHEMA
// ============================================

export const publicAppointmentSchema = z.object({
  availabilityId: z.string().uuid("Invalid appointment slot selected"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  type: appointmentTypeEnum,
  requesterName: z
    .string()
    .min(2, "Your name must be at least 2 characters")
    .max(100, "Your name must not exceed 100 characters")
    .trim(),
  requesterEmail: z.string().email("Enter a valid email address").trim(),
  requesterPhone: requiredPhoneSchema,
  notes: z
    .string()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional(),
});

export type PublicAppointmentInput = z.infer<typeof publicAppointmentSchema>;

// ============================================
// PARISHIONER APPOINTMENT SCHEMA
// ============================================

export const parishionerAppointmentSchema = z.object({
  availabilityId: z.string().uuid("Invalid appointment slot selected"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  type: appointmentTypeEnum,
  notes: z
    .string()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional(),
});

export type ParishionerAppointmentInput = z.infer<
  typeof parishionerAppointmentSchema
>;

// ============================================
// APPOINTMENT AVAILABILITY SCHEMA
// ============================================

export const createAppointmentAvailabilitySchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters")
      .trim(),
    type: appointmentTypeEnum,
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    assignedToId: z
      .string()
      .uuid("Invalid staff member selected")
      .optional()
      .nullable(),
    maxBookings: z.coerce
      .number()
      .int("Max bookings must be a whole number")
      .min(1, "At least 1 booking is required")
      .max(50, "Max bookings cannot exceed 50"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export type CreateAppointmentAvailabilityInput = z.infer<
  typeof createAppointmentAvailabilitySchema
>;

// ============================================
// APPOINTMENT FILTER SCHEMA
// ============================================

export const appointmentFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20), // Increased max for calendar views
  search: z.string().optional(),
  type: appointmentTypeEnum.optional(),
  status: appointmentStatusEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["startTime", "createdAt", "title"]).default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type AppointmentFilter = z.infer<typeof appointmentFilterSchema>;
