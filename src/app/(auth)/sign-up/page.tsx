import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="space-y-4">
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
