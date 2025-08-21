import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId, amount, notes } = await request.json();

    if (!contactId || !amount) {
      return NextResponse.json({ error: "Contact ID and amount are required" }, { status: 400 });
    }

    // Verify contact exists and belongs to tenant
    const contact = await db.contact.findFirst({
      where: {
        id: contactId,
        tenantId: user.tenantId
      }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        contactId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        status: "CREATED",
        metadata: notes ? { notes } : {},
        tenantId: user.tenantId
      }
    });

    // TODO: Integrate with Razorpay to create actual order
    // For now, just return the payment record
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100, // Convert back to rupees
        currency: payment.currency,
        status: payment.status,
        contactName: contact.name,
        contactPhone: contact.phone,
        createdAt: payment.createdAt
      }
    });

  } catch (error: any) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await db.payment.findMany({
      where: { tenantId: user.tenantId },
      include: {
        contact: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      status: payment.status,
      contactName: payment.contact?.name || "Unknown",
      contactPhone: payment.contact?.phone || "Unknown",
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }));

    return NextResponse.json(formattedPayments);

  } catch (error: any) {
    console.error("Payment fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}