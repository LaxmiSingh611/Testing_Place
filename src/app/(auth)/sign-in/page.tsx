import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="space-y-4">
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
