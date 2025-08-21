import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            footerActionLink: {
              display: 'block',
            },
          },
        }}
      />
    </div>
  );
}
