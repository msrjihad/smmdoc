import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SignUpForm from "./signup-form";

async function checkSignUpEnabled() {
  try {
    const userSettings = await db.userSettings.findFirst();
    return userSettings?.signUpPageEnabled ?? true;
  } catch (error) {
    console.error('Error checking sign up settings:', error);
    return true;
  }
}

export default async function page() {
  const signUpEnabled = await checkSignUpEnabled();

  if (!signUpEnabled) {
    redirect('/sign-in?message=registration-disabled');
  }

  return (
      <div className="w-full max-w-xl mx-auto py-[30px] md:py-[60px]">
        <SignUpForm />
      </div>
  );
}