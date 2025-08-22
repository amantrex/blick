import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen flex-col">
      <SignIn
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            footer: {
              display: "none",
            },
          },
        }}
      />
      <div className="mt-4">
        Don't have an account? <Link href="/sign-up">Sign up</Link>
      </div>
    </div>
  );
}