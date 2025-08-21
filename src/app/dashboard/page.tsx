import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "./components/sign-out-button";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  let dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { tenant: true },
  });

  if (!dbUser || !dbUser.tenant) {
    // User exists in Clerk but not in our DB or not linked to a tenant
    // Create a default tenant and link the user to it
    const defaultTenantName = `${user.firstName || user.emailAddresses[0].emailAddress}'s Company`;
    const defaultTenantSlug = `company-${user.id}`; // Simple slug, might need more robust generation

    try {
      const newTenant = await db.tenant.create({
        data: {
          name: defaultTenantName,
          slug: defaultTenantSlug,
          companyType: "OTHER", // Default company type
        },
      });

      dbUser = await db.user.create({
        data: {
          id: user.id, // Use Clerk user ID as Prisma user ID
          email: user.emailAddresses[0].emailAddress,
          name: user.firstName || user.emailAddresses[0].emailAddress,
          tenantId: newTenant.id,
          role: "ADMIN", // Default role for the first user
        },
        include: { tenant: true }, // Include tenant to avoid immediate "Tenant not found"
      });
    } catch (error) {
      console.error("Error creating default tenant/user:", error);
      // Handle error, maybe redirect to an error page or show a generic message
      return <div>Error: Could not set up user data. Please try again.</div>;
    }
  }

  const { tenant } = dbUser;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.firstName || "Admin"}!
            </h1>
            <p className="text-gray-600 mt-2">
              {tenant.name} • {tenant.companyType?.toLowerCase()}
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contacts Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Contacts
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Manage your contact list
              </p>
            </div>
            <div className="text-indigo-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/dashboard/contacts"
              className="block w-full text-center bg-indigo-50 text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-100 transition-colors font-medium"
            >
              View All Contacts
            </Link>
            <div className="flex space-x-2">
              <Link
                href="/dashboard/contacts/new"
                className="flex-1 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 hover:bg-indigo-50 rounded-md transition-colors"
              >
                Add Contact
              </Link>
              <Link
                href="/dashboard/contacts/import"
                className="flex-1 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 hover:bg-indigo-50 rounded-md transition-colors"
              >
                Import CSV/Excel
              </Link>
            </div>
          </div>
        </div>

        {/* Templates Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Templates
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Message templates
              </p>
            </div>
            <div className="text-indigo-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/dashboard/templates"
              className="block w-full text-center bg-indigo-50 text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-100 transition-colors font-medium"
            >
              View Templates
            </Link>
            <Link
              href="/dashboard/templates/new"
              className="block w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Create Template
            </Link>
          </div>
        </div>

        {/* Campaigns Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Campaigns
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                WhatsApp campaigns
              </p>
            </div>
            <div className="text-indigo-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/dashboard/campaigns"
              className="block w-full text-center bg-indigo-50 text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-100 transition-colors font-medium"
            >
              View Campaigns
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className="block w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 hover:bg-indigo-50 rounded-md transition-colors"
            >
              New Campaign
            </Link>
          </div>
        </div>

        {/* Payments Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Payments
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Fee collection
              </p>
            </div>
            <div className="text-indigo-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/dashboard/payments"
              className="block w-full text-center bg-indigo-50 text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-100 transition-colors font-medium"
            >
              View Payments
            </Link>
            <Link
              href="/dashboard/payments/new"
              className="block w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Request Payment
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/contacts/import"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-indigo-600 mr-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Import Contacts</h3>
                <p className="text-sm text-gray-600">Upload CSV/Excel files</p>
              </div>
            </Link>

            <Link
              href="/dashboard/templates/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-indigo-600 mr-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">New Template</h3>
                <p className="text-sm text-gray-600">Create message template</p>
              </div>
            </Link>

            <Link
              href="/dashboard/campaigns/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-indigo-600 mr-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Start Campaign</h3>
                <p className="text-sm text-gray-600">Send WhatsApp messages</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}