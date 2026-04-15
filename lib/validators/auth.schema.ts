import { z } from "zod";

const requiredPhoneSchema = z
	.string()
	.regex(
		/^(\+234|0)[789][01]\d{8}$/,
		"Please enter a valid Nigerian phone number (e.g., 08012345678)",
	)
	.trim();

const requiredDateOfBirthSchema = z
	.string()
	.min(1, "Date of birth is required")
	.refine(
		(value) => {
			const date = new Date(value);
			return !Number.isNaN(date.getTime()) && date < new Date();
		},
		{ message: "Date of birth must be in the past" },
	);

const optionalAddressSchema = z
	.string()
	.max(500, "Resident address must not exceed 500 characters")
	.trim()
	.optional()
	.or(z.literal(""));

// ============================================
// LOGIN SCHEMA
// ============================================

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// TWO-FACTOR SCHEMAS
// ============================================

const twoFactorMethodSchema = z.enum(["EMAIL", "TOTP"]);

export const twoFactorVerifySchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email address"),
	challengeToken: z.string().min(1, "Challenge token is required"),
	code: z
		.string()
		.min(6, "Code must be 6 digits")
		.max(6, "Code must be 6 digits"),
});

export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;

export const twoFactorSetupSchema = z.object({
	method: twoFactorMethodSchema,
});

export type TwoFactorSetupInput = z.infer<typeof twoFactorSetupSchema>;

export const twoFactorConfirmSchema = z.object({
	method: twoFactorMethodSchema,
	code: z
		.string()
		.min(6, "Code must be 6 digits")
		.max(6, "Code must be 6 digits"),
	challengeToken: z.string().optional(),
});

export type TwoFactorConfirmInput = z.infer<typeof twoFactorConfirmSchema>;

export const twoFactorEnrollmentSchema = z.object({
	setupToken: z.string().min(1, "Setup token is required"),
	method: twoFactorMethodSchema,
});

export type TwoFactorEnrollmentInput = z.infer<
	typeof twoFactorEnrollmentSchema
>;

export const twoFactorEnrollmentConfirmSchema = z.object({
	setupToken: z.string().min(1, "Setup token is required"),
	challengeToken: z.string().min(1, "Challenge token is required"),
	method: twoFactorMethodSchema,
	code: z
		.string()
		.min(6, "Code must be 6 digits")
		.max(6, "Code must be 6 digits"),
});

export type TwoFactorEnrollmentConfirmInput = z.infer<
	typeof twoFactorEnrollmentConfirmSchema
>;

// ============================================
// REGISTER SCHEMA
// ============================================

export const registerSchema = z
	.object({
		firstName: z
			.string()
			.min(2, "First name must be at least 2 characters")
			.max(50, "First name must not exceed 50 characters")
			.trim(),
		lastName: z
			.string()
			.min(2, "Last name must be at least 2 characters")
			.max(50, "Last name must not exceed 50 characters")
			.trim(),
		email: z
			.string()
			.min(1, "Email is required")
			.email("Invalid email address")
			.toLowerCase()
			.trim(),
		phone: requiredPhoneSchema,
		dateOfBirth: requiredDateOfBirthSchema,
		address: optionalAddressSchema,
		displayPicture: z
			.string()
			.url("Display picture must be a valid URL")
			.optional()
			.or(z.literal("")),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/[A-Z]/,
				"Password must contain at least one uppercase letter",
			)
			.regex(
				/[a-z]/,
				"Password must contain at least one lowercase letter",
			)
			.regex(/[0-9]/, "Password must contain at least one number")
			.regex(
				/[^A-Za-z0-9]/,
				"Password must contain at least one special character",
			),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})
	.refine(
		(data) => {
			if (!data.address) return true;
			return (
				data.address.toLowerCase().trim() !==
				data.email.toLowerCase().trim()
			);
		},
		{
			message: "Resident address cannot be the same as email",
			path: ["address"],
		},
	);

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// FORGOT PASSWORD SCHEMA
// ============================================

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ============================================
// RESET PASSWORD SCHEMA
// ============================================

export const resetPasswordSchema = z
	.object({
		token: z.string().min(1, "Reset token is required"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/[A-Z]/,
				"Password must contain at least one uppercase letter",
			)
			.regex(
				/[a-z]/,
				"Password must contain at least one lowercase letter",
			)
			.regex(/[0-9]/, "Password must contain at least one number")
			.regex(
				/[^A-Za-z0-9]/,
				"Password must contain at least one special character",
			),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================
// CHANGE PASSWORD SCHEMA
// ============================================

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/[A-Z]/,
				"Password must contain at least one uppercase letter",
			)
			.regex(
				/[a-z]/,
				"Password must contain at least one lowercase letter",
			)
			.regex(/[0-9]/, "Password must contain at least one number")
			.regex(
				/[^A-Za-z0-9]/,
				"Password must contain at least one special character",
			),
		confirmNewPassword: z
			.string()
			.min(1, "Please confirm your new password"),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: "Passwords do not match",
		path: ["confirmNewPassword"],
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: "New password must be different from current password",
		path: ["newPassword"],
	});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================
// REGISTER SCHEMA - SERVER SIDE
// ============================================

export const registerSchemaServer = z
	.object({
		firstName: z
			.string()
			.min(2, "First name must be at least 2 characters")
			.max(50, "First name must not exceed 50 characters")
			.trim(),
		lastName: z
			.string()
			.min(2, "Last name must be at least 2 characters")
			.max(50, "Last name must not exceed 50 characters")
			.trim(),
		email: z
			.string()
			.min(1, "Email is required")
			.email("Invalid email address")
			.toLowerCase()
			.trim(),
		phone: requiredPhoneSchema,
		dateOfBirth: requiredDateOfBirthSchema,
		address: optionalAddressSchema,
		displayPicture: z
			.string()
			.url("Display picture must be a valid URL")
			.optional()
			.or(z.literal("")),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/[A-Z]/,
				"Password must contain at least one uppercase letter",
			)
			.regex(
				/[a-z]/,
				"Password must contain at least one lowercase letter",
			)
			.regex(/[0-9]/, "Password must contain at least one number")
			.regex(
				/[^A-Za-z0-9]/,
				"Password must contain at least one special character",
			),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		organizationId: z.string().min(1, "Organization is required"),
		role: z.string().optional(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type RegisterServerInput = z.infer<typeof registerSchemaServer>;
