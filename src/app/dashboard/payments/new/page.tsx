"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export default function NewPaymentPage() {
  const [formData, setFormData] = useState({
    contactId: "",
    amount: "",
    notes: "",
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch available contacts
    fetch("/api/contacts")
      .then(res => res.json())
      .then(data => setContacts(data.contacts || []))
      .catch(err => console.error("Failed to fetch contacts:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: formData.contactId,
          amountInPaise: Math.round(parseFloat(formData.amount) * 100), // Convert to paise
          notes: formData.notes ? { description: formData.notes } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const { payment, order } = await response.json();
      
      // Redirect to payment page or show success
      router.push(`/dashboard/payments/${payment.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Request Payment</h1>
        <p className="text-gray-600 mt-2">Create a payment request for a contact</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
            Select Contact *
          </label>
          <select
            id="contactId"
            required
            value={formData.contactId}
            onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Choose a contact...</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} - {contact.phone} {contact.email ? `(${contact.email})` : ''}
              </option>
            ))}
          </select>
          {contacts.length === 0 && (
            <p className="text-sm text-orange-600 mt-1">
              No contacts available. <Link href="/dashboard/contacts/new" className="underline">Add one first</Link>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₹) *
          </label>
          <input
            type="number"
            id="amount"
            required
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="500.00"
          />
          <p className="text-sm text-gray-500 mt-1">Enter amount in Indian Rupees</p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Description
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="e.g., Monthly fee for March 2024, Science lab fee, etc."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || contacts.length === 0}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Payment Request"}
          </button>
          <Link
            href="/dashboard/payments"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
