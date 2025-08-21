import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Message Templates</h1>
        <Link 
          href="/dashboard/templates/new" 
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Create Template
        </Link>
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Template List</h2>
        <div className="text-gray-500 text-center py-8">
          <p>No templates found</p>
          <p className="text-sm mt-2">Create your first message template to get started</p>
        </div>
      </div>
      
      <div className="mt-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
