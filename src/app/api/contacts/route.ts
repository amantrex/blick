import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.tenantId) {
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
        tenantId: user.tenantId
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
        tenantId: user.tenantId
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
    const { userId } = await auth();
    console.log("API Contacts GET: userId", userId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    console.log("API Contacts GET: user", user);
    console.log("API Contacts GET: user?.tenantId", user?.tenantId);
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await db.contact.findMany({
      where: { tenantId: user.tenantId },
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