"use client";

import { useCurrentUserRole } from "@/hooks/use-current-role";
import { user_role } from "@prisma/client";
import React from "react";
import { FormError } from "./form-error";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: user_role;
}
export default function RoleGate({ children, allowedRole }: RoleGateProps) {
  const role = useCurrentUserRole();
  if (role !== allowedRole) {
    return <FormError message="You are not authorized to view this page" />;
  }
  return <>{children}</>;
}
