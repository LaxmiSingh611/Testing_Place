import { auth } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await auth();

  return (
    <div className="rounded-lg border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Profile</h1>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-slate-500">Name</dt>
          <dd className="font-medium text-slate-900">{session?.user?.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium text-slate-900">{session?.user?.email}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Account type</dt>
          <dd className="font-medium text-slate-900">{session?.user?.role === "ADMIN" ? "Administrator" : "Customer"}</dd>
        </div>
      </dl>
    </div>
  );
}
