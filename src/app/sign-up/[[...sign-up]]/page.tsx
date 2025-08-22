import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen flex-col">
      <SignUp
        signInUrl="/sign-in"
        appearance={{
          elements: {
            footer: {
              display: "none",
            },
          },
        }}
      />
      <div className="mt-4">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </div>
    </div>
  );
}