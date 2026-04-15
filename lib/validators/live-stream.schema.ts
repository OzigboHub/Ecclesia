import { z } from "zod";

// ============================================
// YOUTUBE URL VALIDATION
// ============================================

const youtubeUrlSchema = z
  .string()
  .min(1, "Stream URL is required")
  .url("Please enter a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const validHosts = [
          "www.youtube.com",
          "youtube.com",
          "youtu.be",
          "www.youtu.be",
          "m.youtube.com",
        ];
        return validHosts.includes(parsed.hostname);
      } catch {
        return false;
      }
    },
    { message: "Only YouTube URLs are supported" },
  );

// ============================================
// CREATE LIVE STREAM SCHEMA
// ============================================

export const createLiveStreamSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  streamUrl: youtubeUrlSchema,
  massId: z.string().uuid("Invalid mass ID").optional().or(z.literal("")),
  scheduledFor: z.coerce.date().optional(),
});

export type CreateLiveStreamInput = z.infer<typeof createLiveStreamSchema>;

// ============================================
// UPDATE LIVE STREAM SCHEMA
// ============================================

export const updateLiveStreamSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  streamUrl: youtubeUrlSchema.optional(),
  massId: z.string().uuid("Invalid mass ID").optional().or(z.literal("")),
  isLive: z.boolean().optional(),
  scheduledFor: z.coerce.date().optional().nullable(),
});

export type UpdateLiveStreamInput = z.infer<typeof updateLiveStreamSchema>;
