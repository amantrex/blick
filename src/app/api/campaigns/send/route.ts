import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const { campaignId } = await req.json();

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, tenantId },
    include: { template: true },
  });
  if (!campaign) return new Response("Not found", { status: 404 });

  const contacts = await db.contact.findMany({ where: { tenantId }, take: 100 });
  for (const contact of contacts) {
    const res = await sendWhatsAppText(campaign.template.channelProvider as any, contact.phone, campaign.template.content);
    await db.message.create({
      data: {
        tenantId,
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


