import { z } from "zod";

// ============================================
// COMMON FIELD SCHEMAS (Reusable)
// ============================================

const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters")
  .trim();

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

// ============================================
// USER ROLES
// ============================================

export const userRoles = [
  "SUPER_ADMIN",
  "PARISH_ADMIN",
  "PARISH_SECRETARY",
  "PARISH_STAFF",
  "OUTSTATION_ADMIN",
  "SOCIETY_PRESIDENT",
  "SOCIETY_SECRETARY",
  "PARISHIONER",
] as const;

export type UserRoleType = (typeof userRoles)[number];

export const roleLabels: Record<UserRoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  PARISH_ADMIN: "Parish Admin",
  PARISH_SECRETARY: "Parish Secretary",
  PARISH_STAFF: "Parish Staff",
  OUTSTATION_ADMIN: "Outstation Admin",
  SOCIETY_PRESIDENT: "Society President",
  SOCIETY_SECRETARY: "Society Secretary",
  PARISHIONER: "Parishioner",
};

export const roleDescriptions: Record<UserRoleType, string> = {
  SUPER_ADMIN: "Full system access across all organizations",
  PARISH_ADMIN: "Full access to parish and outstations",
  PARISH_SECRETARY: "Manage parishioners, payments, and records",
  PARISH_STAFF: "Limited parish operations access",
  OUTSTATION_ADMIN: "Full access to outstation only",
  SOCIETY_PRESIDENT: "Lead a parish society",
  SOCIETY_SECRETARY: "Assist society management",
  PARISHIONER: "Basic member access",
};

// ============================================
// CREATE USER SCHEMA
// ============================================

export const createUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(userRoles, {
    message: "Please select a valid role",
  }),
  outstationId: z.string().uuid().optional(),
  paystackProfile: z.any().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ============================================
// USER ACCOUNT REQUEST SCHEMA
// ============================================

export const requestUserAccountSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  role: z.enum(userRoles, {
    message: "Please select a valid role",
  }),
  message: z.string().max(500, "Message is too long").optional(),
});

export type RequestUserAccountInput = z.infer<typeof requestUserAccountSchema>;

// ============================================
// UPDATE USER SCHEMA
// ============================================

export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  role: z
    .enum(userRoles, {
      message: "Please select a valid role",
    })
    .optional(),
  organizationId: z.string().uuid().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================
// CHANGE PASSWORD SCHEMA
// ============================================

export const changePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================
// UPDATE PROFILE SCHEMA (self-edit)
// ============================================

export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(500, "Address must not exceed 500 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// USER FILTER/QUERY SCHEMA
// ============================================

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(userRoles).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["firstName", "lastName", "email", "createdAt", "lastLogin"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type UserQuery = z.infer<typeof userQuerySchema>;
