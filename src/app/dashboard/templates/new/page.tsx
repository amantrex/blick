"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTemplatePage() {
  const [formData, setFormData] = useState({
    name: "",
    channelProvider: "GUPSHUP",
    content: "",
    variables: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const variables = formData.variables.split(",").map(v => v.trim()).filter(v => v);
      
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          channelProvider: formData.channelProvider,
          content: formData.content,
          variables,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }

      router.push("/dashboard/templates");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create New Template</h1>
        <p className="text-gray-600 mt-2">Create a WhatsApp message template</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="e.g., Fee Reminder, Payment Confirmation"
          />
        </div>

        <div>
          <label htmlFor="channelProvider" className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Provider *
          </label>
          <select
            id="channelProvider"
            required
            value={formData.channelProvider}
            onChange={(e) => setFormData({ ...formData, channelProvider: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="GUPSHUP">Gupshup</option>
            <option value="TWILIO">Twilio</option>
            <option value="META">Meta WhatsApp Business</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Message Content *
          </label>
          <textarea
            id="content"
            required
            rows={6}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Hello {{name}}, your fee of {{amount}} is due on {{dueDate}}. Please pay via {{paymentLink}}"
          />
          <p className="text-sm text-gray-500 mt-1">
            Use double curly braces for dynamic content. Example: &#123;&#123;name&#125;&#125;
          </p>
        </div>

        <div>
          <label htmlFor="variables" className="block text-sm font-medium text-gray-700 mb-2">
            Variables
          </label>
          <input
            type="text"
            id="variables"
            value={formData.variables}
            onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="name, amount, dueDate, paymentLink (comma separated)"
          />
          <p className="text-sm text-gray-500 mt-1">
            List the variables used in your template (without curly braces)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Template"}
          </button>
          <Link
            href="/dashboard/templates"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
