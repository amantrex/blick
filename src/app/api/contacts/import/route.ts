import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get session and verify authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contacts } = await request.json();

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "Invalid contacts data" }, { status: 400 });
    }

    // Validate each contact
    const validContacts = contacts.filter(contact => {
      return contact.phone && contact.phone.toString().trim() !== "";
    });

    if (validContacts.length === 0) {
      return NextResponse.json({ error: "No valid contacts found" }, { status: 400 });
    }

    // Process contacts in batches
    const batchSize = 50;
    const results = {
      total: validContacts.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < validContacts.length; i += batchSize) {
      const batch = validContacts.slice(i, i + batchSize);
      
      try {
        // Deduplicate contacts within the batch by phone number
        const uniqueContacts = new Map();
        batch.forEach(contact => {
          const phone = contact.phone.toString().trim();
          if (!uniqueContacts.has(phone)) {
            uniqueContacts.set(phone, contact);
          }
        });

        const batchToProcess = Array.from(uniqueContacts.values());

        // Use upsert to handle both creation and updates
        const upsertPromises = batchToProcess.map(async (contact) => {
          try {
            const phone = contact.phone.toString().trim();
            const name = contact.name || phone;
            const email = contact.email || null;
            const tags = Array.isArray(contact.tags) ? contact.tags : [];

            // Check if contact already exists
            const existingContact = await db.contact.findFirst({
              where: {
                phone,
                tenantId: user.tenantId
              }
            });

            if (existingContact) {
              // Update existing contact
              await db.contact.update({
                where: { id: existingContact.id },
                data: {
                  name,
                  email,
                  tags: [...new Set([...existingContact.tags, ...tags])] // Merge tags
                }
              });
              results.updated++;
            } else {
              // Create new contact
              await db.contact.create({
                data: {
                  name,
                  phone,
                  email,
                  tags,
                  tenantId: user.tenantId
                }
              });
              results.created++;
            }
          } catch (err: any) {
            results.failed++;
            results.errors.push(`Failed to process contact ${contact.phone}: ${err.message}`);
          }
        });

        await Promise.all(upsertPromises);
      } catch (err: any) {
        results.failed += batch.length;
        results.errors.push(`Batch processing failed: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. Created: ${results.created}, Updated: ${results.updated}, Failed: ${results.failed}`,
      results
    });

  } catch (error: any) {
    console.error("Contact import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}