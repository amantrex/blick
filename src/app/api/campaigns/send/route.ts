import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { campaignId } = await req.json();

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, tenantId: user.tenantId },
    include: { template: true },
  });
  if (!campaign) return new Response("Not found", { status: 404 });

  const contacts = await db.contact.findMany({ where: { tenantId: user.tenantId }, take: 100 });
  for (const contact of contacts) {
    const res = await sendWhatsAppText(campaign.template.channelProvider as any, contact.phone, campaign.template.content);
    await db.message.create({
      data: {
        tenantId: user.tenantId,
        campaignId: campaign.id,
        contactId: contact.id,
        status: res.ok ? "SENT" : "FAILED",
        providerMessageId: res.providerMessageId,
        error: res.error,
        sentAt: res.ok ? new Date() : null,
      },
    });
  }
  await db.campaign.update({ where: { id: campaign.id }, data: { status: "SENT" } });
  return Response.json({ ok: true });
}