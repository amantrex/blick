import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Razorpay from "razorpay";
import { env } from "@/env";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const payments = await db.payment.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 100 });
  return Response.json({ payments });
}

const createSchema = z.object({
  contactId: z.string().min(1),
  amountInPaise: z.number().int().positive(),
  notes: z.record(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const body = await req.json();
  const data = createSchema.parse(body);

  const rp = new Razorpay({ key_id: env.RAZORPAY_KEY_ID!, key_secret: env.RAZORPAY_KEY_SECRET! });
  const order = await rp.orders.create({
    amount: data.amountInPaise,
    currency: "INR",
    notes: data.notes,
  });

  const payment = await db.payment.create({
    data: {
      tenantId,
      contactId: data.contactId,
      amount: data.amountInPaise,
      currency: "INR",
      razorpayOrderId: order.id,
      metadata: order as any,
    },
  });

  return Response.json({ payment, order });
}


