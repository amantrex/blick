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

    const { name, phone, email, tags } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // Check if contact already exists
    const existingContact = await db.contact.findFirst({
      where: {
        phone,
        tenantId: session.user.tenantId
      }
    });

    if (existingContact) {
      return NextResponse.json({ error: "Contact with this phone number already exists" }, { status: 400 });
    }

    // Create new contact
    const contact = await db.contact.create({
      data: {
        name,
        phone,
        email: email || null,
        tags: tags || [],
        tenantId: session.user.tenantId
      }
    });

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        tags: contact.tags,
        createdAt: contact.createdAt
      }
    });

  } catch (error: any) {
    console.error("Contact creation error:", error);
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

    const contacts = await db.contact.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        tags: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(contacts);

  } catch (error: any) {
    console.error("Contact fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


