"use server";

import { signOut } from "@/auth";

export const logout = async () => {
  try {
    await signOut({
      redirectTo: "/"
    });
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Failed to sign out" };
  }
};
