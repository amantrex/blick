import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const campaigns = await db.campaign.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, include: { template: true } });
  return Response.json({ campaigns });
}

const createSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const userId = (session.user as any).id as string;
  const body = await req.json();
  const data = createSchema.parse(body);
  const campaign = await db.campaign.create({
    data: {
      tenantId,
      name: data.name,
      templateId: data.templateId,
      createdById: userId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    },
  });
  return Response.json({ campaign });
}


