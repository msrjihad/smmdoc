import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import NewPasswordForm from "./new-password";

async function checkPasswordResetEnabled() {
  const userSettings = await db.userSettings.findFirst();
  return userSettings?.resetPasswordEnabled ?? true;
}

export default async function page() {
  const isPasswordResetEnabled = await checkPasswordResetEnabled();

  if (!isPasswordResetEnabled) {
    notFound();
  }

  return (
    <div className="w-full max-w-xl mx-auto py-[30px] md:py-[60px]">
      <NewPasswordForm />
    </div>
  );
}