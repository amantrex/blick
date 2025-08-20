import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(session, null, 2)}</pre>
      <div className="flex gap-3">
        <Link href="/dashboard/contacts" className="underline">Contacts</Link>
        <Link href="/dashboard/templates" className="underline">Templates</Link>
        <Link href="/dashboard/campaigns" className="underline">Campaigns</Link>
        <Link href="/dashboard/payments" className="underline">Payments</Link>
      </div>
    </div>
  );
}


