import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const contacts = await db.contact.findMany({ where: { tenantId }, take: 100, orderBy: { createdAt: "desc" } });
  return Response.json({ contacts });
}

const upsertSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const body = await req.json();
  const data = upsertSchema.parse(body);
  const contact = await db.contact.upsert({
    where: { tenantId_phone: { tenantId, phone: data.phone } },
    update: { name: data.name, email: data.email, tags: data.tags },
    create: { tenantId, name: data.name, phone: data.phone, email: data.email, tags: data.tags },
  });
  return Response.json({ contact });
}


