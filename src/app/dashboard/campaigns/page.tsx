import Link from "next/link";

export default async function CampaignsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <Link 
          href="/dashboard/campaigns/new" 
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          + Create Campaign
        </Link>
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Campaign List</h2>
        <div className="text-gray-500 text-center py-8">
          <p>No campaigns found</p>
          <p className="text-sm mt-2">Create your first campaign to start sending messages</p>
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
