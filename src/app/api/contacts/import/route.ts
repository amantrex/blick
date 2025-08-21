import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get session and verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
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
        // Use upsert to handle both creation and updates
        const upsertPromises = batch.map(async (contact) => {
          try {
            const phone = contact.phone.toString().trim();
            const name = contact.name || phone;
            const email = contact.email || null;
            const tags = Array.isArray(contact.tags) ? contact.tags : [];

            // Check if contact already exists
            const existingContact = await db.contact.findFirst({
              where: {
                phone,
                tenantId: session.user.tenantId
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
                  tenantId: session.user.tenantId,
                  createdById: session.user.id
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
