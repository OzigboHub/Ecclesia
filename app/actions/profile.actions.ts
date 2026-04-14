"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { updateProfileSchema } from "@/lib/validators/user.schema";
import type { ActionResponse } from "@/types";
import type { User } from "@prisma/client";
import { revalidatePath } from "next/cache";

type SafeUser = Omit<User, "password">;

function omitPassword(user: User): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<ActionResponse<SafeUser>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      message: "Profile retrieved successfully",
      data: omitPassword(user),
    };
  } catch (error) {
    console.error("Failed to get profile:", error);
    return { success: false, message: "Failed to retrieve profile" };
  }
}

/**
 * Update the current user's profile (self-edit)
 */
export async function updateProfile(
  formData: unknown,
): Promise<ActionResponse<SafeUser>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const parsed = updateProfileSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { firstName, lastName, phone, address, dateOfBirth } = parsed.data;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        address: address || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    revalidatePath("/profile");

    return {
      success: true,
      message: "Profile updated successfully",
      data: omitPassword(updatedUser),
    };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

/**
 * Save profile picture URL (after uploading via /api/public-upload)
 */
export async function saveProfilePictureUrl(
  url: string,
): Promise<ActionResponse<{ displayPicture: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    if (!url || typeof url !== "string") {
      return { success: false, message: "Invalid URL" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { displayPicture: url },
    });

    revalidatePath("/profile");

    return {
      success: true,
      message: "Profile picture updated successfully",
      data: { displayPicture: url },
    };
  } catch (error) {
    console.error("Failed to save profile picture:", error);
    return { success: false, message: "Failed to update profile picture" };
  }
}

/**
 * Remove profile picture
 */
export async function removeProfilePicture(): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { displayPicture: null },
    });

    revalidatePath("/profile");

    return {
      success: true,
      message: "Profile picture removed successfully",
    };
  } catch (error) {
    console.error("Failed to remove profile picture:", error);
    return { success: false, message: "Failed to remove profile picture" };
  }
}
