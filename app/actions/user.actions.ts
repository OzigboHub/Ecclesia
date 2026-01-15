"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
} from "@/lib/validators/user.schema";
import type { ActionResponse } from "@/types";
import type { User, UserRole } from "@prisma/client";

// Type for user without password (safe to return)
type SafeUser = Omit<User, "password">;

// Role hierarchy for authorization checks
const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  PARISH_ADMIN: 80,
  PARISH_SECRETARY: 60,
  PARISH_STAFF: 40,
  OUTSTATION_ADMIN: 40,
  ORGANIZATION_PRESIDENT: 30,
  ORGANIZATION_SECRETARY: 30,
  PARISHIONER: 10,
};

// Roles that can manage users
const USER_MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "PARISH_ADMIN"];

// Helper function to check if user can manage other users
function canManageUsers(role: string): boolean {
  return USER_MANAGEMENT_ROLES.includes(role as UserRole);
}

// Helper function to check if actor can modify target user's role
function canAssignRole(actorRole: string, targetRole: string): boolean {
  const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  return actorLevel > targetLevel;
}

// Helper to omit password from user object
function omitPassword(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all users for the current organization
 */
export async function getUsers(): Promise<ActionResponse<SafeUser[]>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can view users
    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to view users",
      };
    }

    const users = await db.user.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      message: "Users retrieved successfully",
      data: users.map(omitPassword),
    };
  } catch (error) {
    console.error("Failed to get users:", error);
    return { success: false, message: "Failed to retrieve users" };
  }
}

/**
 * Get staff members (users who can be assigned to appointments)
 */
export async function getStaffMembers(): Promise<ActionResponse<SafeUser[]>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Staff roles that can be assigned to appointments
    const staffRoles = [
      "SUPER_ADMIN",
      "PARISH_ADMIN",
      "PARISH_SECRETARY",
      "PARISH_STAFF",
      "OUTSTATION_ADMIN",
    ];

    const staff = await db.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        role: { in: staffRoles as UserRole[] },
        isActive: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return {
      success: true,
      message: "Staff members retrieved successfully",
      data: staff.map(omitPassword),
    };
  } catch (error) {
    console.error("Failed to get staff members:", error);
    return { success: false, message: "Failed to retrieve staff members" };
  }
}

/**
 * Get a single user by ID
 */
export async function getUser(
  id: string
): Promise<ActionResponse<SafeUser & { organization: { name: string } }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can view user details
    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to view user details",
      };
    }

    const user = await db.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const safeUser = omitPassword(user);

    return {
      success: true,
      message: "User retrieved successfully",
      data: { ...safeUser, organization: user.organization },
    };
  } catch (error) {
    console.error("Failed to get user:", error);
    return { success: false, message: "Failed to retrieve user" };
  }
}

/**
 * Search users
 */
export async function searchUsers(
  searchTerm: string
): Promise<ActionResponse<SafeUser[]>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to search users",
      };
    }

    const users = await db.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        OR: [
          {
            firstName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          { lastName: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      orderBy: { lastName: "asc" },
      take: 50,
    });

    return {
      success: true,
      message: "Users found",
      data: users.map(omitPassword),
    };
  } catch (error) {
    console.error("Failed to search users:", error);
    return { success: false, message: "Failed to search users" };
  }
}

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create a new user
 */
export async function createUser(
  formData: unknown
): Promise<ActionResponse<SafeUser>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can create users
    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to create users",
      };
    }

    // Validate input
    const parsed = createUserSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please check your input and try again",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { firstName, lastName, email, password, role } = parsed.data;

    // Check if actor can assign this role
    if (!canAssignRole(session.user.role, role)) {
      return {
        success: false,
        message: "You cannot assign a role equal or higher than your own",
      };
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "A user with this email already exists",
        errors: { email: ["This email is already registered"] },
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        organizationId: session.user.organizationId,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/users");

    return {
      success: true,
      message: "User created successfully",
      data: omitPassword(user),
    };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, message: "Failed to create user" };
  }
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update a user's details
 */
export async function updateUser(
  id: string,
  formData: unknown
): Promise<ActionResponse<SafeUser>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can update users
    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to update users",
      };
    }

    // Validate input
    const parsed = updateUserSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please check your input and try again",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Verify the user exists and belongs to same organization
    const existingUser = await db.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    // Prevent modifying users with higher or equal role
    if (!canAssignRole(session.user.role, existingUser.role)) {
      return {
        success: false,
        message: "You cannot modify this user",
      };
    }

    // If role is being changed, check if actor can assign the new role
    if (
      parsed.data.role &&
      !canAssignRole(session.user.role, parsed.data.role)
    ) {
      return {
        success: false,
        message: "You cannot assign a role equal or higher than your own",
      };
    }

    // Check if email is being changed and already exists
    if (parsed.data.email && parsed.data.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (emailExists) {
        return {
          success: false,
          message: "This email is already in use",
          errors: { email: ["This email is already registered"] },
        };
      }
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/dashboard/users");
    revalidatePath(`/dashboard/users/${id}`);

    return {
      success: true,
      message: "User updated successfully",
      data: omitPassword(user),
    };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, message: "Failed to update user" };
  }
}

/**
 * Change a user's password
 */
export async function changeUserPassword(
  id: string,
  formData: unknown
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can change user passwords
    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to change passwords",
      };
    }

    // Validate input
    const parsed = changePasswordSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please check your input and try again",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Verify the user exists and belongs to same organization
    const existingUser = await db.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    // Prevent modifying users with higher or equal role
    if (!canAssignRole(session.user.role, existingUser.role)) {
      return {
        success: false,
        message: "You cannot change this user's password",
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

    // Update password
    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Failed to change password:", error);
    return { success: false, message: "Failed to change password" };
  }
}

// ============================================
// ACTIVATION/DEACTIVATION OPERATIONS
// ============================================

/**
 * Toggle user active status
 */
export async function toggleUserStatus(
  id: string
): Promise<ActionResponse<SafeUser>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can toggle user status
    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to change user status",
      };
    }

    // Verify the user exists and belongs to same organization
    const existingUser = await db.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    // Prevent deactivating yourself
    if (existingUser.id === session.user.id) {
      return {
        success: false,
        message: "You cannot deactivate your own account",
      };
    }

    // Prevent modifying users with higher or equal role
    if (!canAssignRole(session.user.role, existingUser.role)) {
      return {
        success: false,
        message: "You cannot modify this user",
      };
    }

    // Toggle status
    const user = await db.user.update({
      where: { id },
      data: { isActive: !existingUser.isActive },
    });

    revalidatePath("/dashboard/users");
    revalidatePath(`/dashboard/users/${id}`);

    return {
      success: true,
      message: user.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      data: omitPassword(user),
    };
  } catch (error) {
    console.error("Failed to toggle user status:", error);
    return { success: false, message: "Failed to change user status" };
  }
}

/**
 * Activate a user
 */
export async function activateUser(
  id: string
): Promise<ActionResponse<SafeUser>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to activate users",
      };
    }

    const existingUser = await db.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    if (!canAssignRole(session.user.role, existingUser.role)) {
      return {
        success: false,
        message: "You cannot modify this user",
      };
    }

    if (existingUser.isActive) {
      return {
        success: false,
        message: "User is already active",
      };
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath("/dashboard/users");

    return {
      success: true,
      message: "User activated successfully",
      data: omitPassword(user),
    };
  } catch (error) {
    console.error("Failed to activate user:", error);
    return { success: false, message: "Failed to activate user" };
  }
}

/**
 * Deactivate a user
 */
export async function deactivateUser(
  id: string
): Promise<ActionResponse<SafeUser>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to deactivate users",
      };
    }

    const existingUser = await db.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    if (existingUser.id === session.user.id) {
      return {
        success: false,
        message: "You cannot deactivate your own account",
      };
    }

    if (!canAssignRole(session.user.role, existingUser.role)) {
      return {
        success: false,
        message: "You cannot modify this user",
      };
    }

    if (!existingUser.isActive) {
      return {
        success: false,
        message: "User is already deactivated",
      };
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/dashboard/users");

    return {
      success: true,
      message: "User deactivated successfully",
      data: omitPassword(user),
    };
  } catch (error) {
    console.error("Failed to deactivate user:", error);
    return { success: false, message: "Failed to deactivate user" };
  }
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a user (hard delete - use with caution)
 */
export async function deleteUser(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only super admins can delete users
    if (session.user.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Only super admins can delete users",
      };
    }

    const existingUser = await db.user.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    // Prevent deleting yourself
    if (existingUser.id === session.user.id) {
      return {
        success: false,
        message: "You cannot delete your own account",
      };
    }

    // Prevent deleting other super admins
    if (existingUser.role === "SUPER_ADMIN") {
      return {
        success: false,
        message: "You cannot delete other super admins",
      };
    }

    await db.user.delete({
      where: { id },
    });

    revalidatePath("/dashboard/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, message: "Failed to delete user" };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user statistics for dashboard
 */
export async function getUserStats(): Promise<
  ActionResponse<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageUsers(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to view user statistics",
      };
    }

    const [total, active, byRole] = await Promise.all([
      db.user.count({
        where: { organizationId: session.user.organizationId },
      }),
      db.user.count({
        where: {
          organizationId: session.user.organizationId,
          isActive: true,
        },
      }),
      db.user.groupBy({
        by: ["role"],
        where: { organizationId: session.user.organizationId },
        _count: true,
      }),
    ]);

    const roleStats = byRole.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      message: "User statistics retrieved successfully",
      data: {
        total,
        active,
        inactive: total - active,
        byRole: roleStats,
      },
    };
  } catch (error) {
    console.error("Failed to get user stats:", error);
    return {
      success: false,
      message: "Failed to retrieve user statistics",
    };
  }
}
