import { db } from "@/lib/db";
import { env } from "@/env";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (env.RAZORPAY_KEY_SECRET && signature) {
    const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(raw).digest("hex");
    if (expected !== signature) {
      return new Response("Invalid signature", { status: 400 });
    }
  }

  const event = JSON.parse(raw);
  try {
    const type: string = event?.event;
    const paymentEntity = event?.payload?.payment?.entity;
    const orderId: string | undefined = paymentEntity?.order_id;
    const paymentId: string | undefined = paymentEntity?.id;

    if (orderId) {
      if (type === "payment.captured") {
        await db.payment.updateMany({
          where: { razorpayOrderId: orderId },
          data: { status: "CAPTURED", razorpayPaymentId: paymentId, metadata: paymentEntity },
        });
      } else if (type === "payment.authorized") {
        await db.payment.updateMany({ where: { razorpayOrderId: orderId }, data: { status: "AUTHORIZED", metadata: paymentEntity } });
      } else if (type?.startsWith("payment.failed")) {
        await db.payment.updateMany({ where: { razorpayOrderId: orderId }, data: { status: "FAILED", metadata: paymentEntity } });
      }
    }

    await db.webhookEvent.create({ data: { provider: "META", eventType: type ?? "razorpay", payload: event } });
  } catch (e) {
    // swallow
  }

  return new Response("ok");
}


