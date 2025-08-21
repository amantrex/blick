import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, templateId, scheduledAt, contactIds, estimatedRecipients } = await request.json();

    if (!name || !templateId || !contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify template exists
    const template = await db.template.findFirst({
      where: { id: templateId, tenantId: session.user.tenantId }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Verify contacts exist and belong to tenant
    const contacts = await db.contact.findMany({
      where: {
        id: { in: contactIds },
        tenantId: session.user.tenantId
      }
    });

    if (contacts.length !== contactIds.length) {
      return NextResponse.json({ error: "Some contacts not found" }, { status: 400 });
    }

    // Create campaign
    const campaign = await db.campaign.create({
      data: {
        name,
        templateId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        estimatedRecipients: contacts.length
      }
    });

    // Create campaign contacts
    await db.campaignContact.createMany({
      data: contactIds.map(contactId => ({
        campaignId: campaign.id,
        contactId,
        status: "PENDING"
      }))
    });

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        estimatedRecipients: campaign.estimatedRecipients
      }
    });

  } catch (error: any) {
    console.error("Campaign creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await db.campaign.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        template: {
          select: { name: true, channelProvider: true }
        },
        _count: {
          select: { campaignContacts: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(campaigns);

  } catch (error: any) {
    console.error("Campaign fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


