"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  content: string;
  channelProvider: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchContacts();
  }, []);

  useEffect(() => {
    // Filter contacts based on selected tags
    let filtered = contacts;
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(contact => 
        selectedTags.some(tag => contact.tags.includes(tag))
      );
    }
    
    if (excludeTags.length > 0) {
      filtered = filtered.filter(contact => 
        !excludeTags.some(tag => contact.tags.includes(tag))
      );
    }
    
    setFilteredContacts(filtered);
  }, [contacts, selectedTags, excludeTags]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
        
        // Extract unique tags
        const tags = Array.from(
          new Set(data.flatMap((contact: Contact) => contact.tags))
        ).sort();
        setAvailableTags(tags);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("Campaign name is required");
      setLoading(false);
      return;
    }

    if (!templateId) {
      setError("Please select a template");
      setLoading(false);
      return;
    }

    if (filteredContacts.length === 0) {
      setError("No contacts match the selected filters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          templateId,
          scheduledAt: scheduledAt || null,
          contactIds: filteredContacts.map(c => c.id),
          estimatedRecipients: filteredContacts.length
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }

      router.push("/dashboard/campaigns");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string, isExclude: boolean = false) => {
    if (isExclude) {
      setExcludeTags(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    } else {
      setSelectedTags(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setExcludeTags([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="text-gray-600 mt-2">
          Set up a new messaging campaign for your contacts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Basic Campaign Info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Monthly Fee Reminder"
              />
            </div>

            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                Message Template *
              </label>
              <select
                id="template"
                required
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.channelProvider})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1">
                Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                id="scheduledAt"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to send immediately
              </p>
            </div>
          </div>
        </div>

        {/* Contact Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Selection</h2>
          
          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">Filter by Tags</h3>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear Filters
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include contacts with these tags:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag, false)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tag} ({contacts.filter(c => c.tags.includes(tag)).length})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclude contacts with these tags:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag, true)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          excludeTags.includes(tag)
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tag} ({contacts.filter(c => c.tags.includes(tag)).length})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Count and Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Contacts: {filteredContacts.length}
              </h3>
              <span className="text-sm text-gray-500">
                Total available: {contacts.length}
              </span>
            </div>

            {filteredContacts.length > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredContacts.slice(0, 12).map((contact) => (
                    <div key={contact.id} className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                      {contact.name} ({contact.phone})
                    </div>
                  ))}
                  {filteredContacts.length > 12 && (
                    <div className="text-sm text-gray-500 col-span-full text-center">
                      ... and {filteredContacts.length - 12} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {contacts.length === 0 ? (
                  "No contacts available. Add contacts first."
                ) : (
                  "No contacts match the selected filters. Adjust your tag selection."
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard/campaigns")}
            className="text-gray-600 hover:text-gray-800 px-4 py-2"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || filteredContacts.length === 0}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Creating..." : `Create Campaign (${filteredContacts.length} contacts)`}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
