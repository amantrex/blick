"use client";

import { UserButton } from "@clerk/nextjs";

export function SignOutButton() {
  return <UserButton afterSignOutUrl="/" />;
}