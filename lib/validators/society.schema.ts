import { z } from "zod";

// ============================================
// CREATE SOCIETY SCHEMA
// ============================================

export const createSocietySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  patronSaint: z.string().max(100).optional(),
  presidentId: z
    .union([z.string().uuid("Invalid user selected"), z.literal(""), z.null()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : val)),
  secretaryId: z
    .union([z.string().uuid("Invalid user selected"), z.literal(""), z.null()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : val)),
  meetingSchedule: z.string().max(5000).optional(),
});

export type CreateSocietyInput = z.infer<typeof createSocietySchema>;

// ============================================
// UPDATE SOCIETY SCHEMA
// ============================================

export const updateSocietySchema = createSocietySchema.partial();

export type UpdateSocietyInput = z.infer<typeof updateSocietySchema>;

// ============================================
// ADD MEMBER SCHEMA
// ============================================

export const addMemberSchema = z.object({
  parishionerId: z.string().uuid("Invalid parishioner selected"),
  role: z.enum(
    [
      "MEMBER",
      "PRESIDENT",
      "VICE_PRESIDENT",
      "SECRETARY",
      "TREASURER",
      "PRO",
      "OTHER",
    ],
    {
      message: "Please select a valid role",
    },
  ),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

// ============================================
// CREATE MEETING SCHEMA
// ============================================

export const createMeetingSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters")
      .trim(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    description: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
