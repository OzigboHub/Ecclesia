import { z } from "zod";

/**
 * Rung 1 of the security ladder: giving an account an email and a password.
 *
 * The strength rules deliberately match resetPasswordSchema in auth.schema.ts —
 * a password set here is the same credential the console login accepts, so it
 * would be incoherent for one door to demand more than the other.
 */
export const setPasswordSchema = z
	.object({
		email: z
			.string()
			.min(1, "Enter an email address")
			.email("That doesn't look like an email address"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/[0-9]/, "Password must contain at least one number")
			.regex(
				/[^A-Za-z0-9]/,
				"Password must contain at least one special character",
			),
		confirmPassword: z.string().min(1, "Confirm your password"),
		/** Required only when replacing an existing password. */
		currentPassword: z.string().optional(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Those passwords don't match",
		path: ["confirmPassword"],
	});

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/** Password sign-in from inside the feed's lock-in sheet. */
export const memberLoginSchema = z.object({
	email: z.string().min(1, "Enter your email").email("Enter a valid email"),
	password: z.string().min(1, "Enter your password"),
});

export type MemberLoginInput = z.infer<typeof memberLoginSchema>;
