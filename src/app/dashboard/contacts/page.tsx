import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/signin");
  }

  const contacts = await db.contact.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" }
  });

  // Get unique tags for filtering
  const allTags = Array.from(
    new Set(contacts.flatMap(contact => contact.tags))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage your contacts for campaigns and messaging
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/contacts/import"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
          >
            Import Contacts
          </Link>
          <Link
            href="/dashboard/contacts/new"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
          >
            Add Contact
          </Link>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by tags:</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {tag}
                <span className="ml-1 text-indigo-600">
                  ({contacts.filter(c => c.tags.includes(tag)).length})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
          <p className="text-gray-500 mb-6">
            Get started by adding contacts manually or importing them from a file.
          </p>
          <div className="flex justify-center space-x-3">
            <Link
              href="/dashboard/contacts/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
            >
              Add First Contact
            </Link>
            <Link
              href="/dashboard/contacts/import"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
            >
              Import Contacts
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {contacts.length} Contact{contacts.length !== 1 ? 's' : ''}
              </h2>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contact.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.email || (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
