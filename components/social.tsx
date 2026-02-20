import { DEFAULT_SIGN_IN_REDIRECT } from "@/lib/routes";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "./ui/button";

export default function Social() {
  const handleClick = async (provider: "google") => {
    await signIn(provider, { callbackUrl: DEFAULT_SIGN_IN_REDIRECT });
  };
  return (
    <div className="mt-1 w-full mb-1">
      <Button
        size="sm"
        className="w-full cursor-pointer h-8 text-sm"
        variant="outline"
        onClick={() => {
          handleClick("google");
        }}
      >
        <FcGoogle className="h-5 w-5" />
      </Button>
    </div>
  );
}
