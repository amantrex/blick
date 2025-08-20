import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const templates = await db.template.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  return Response.json({ templates });
}

const templateSchema = z.object({
  name: z.string().min(1),
  channelProvider: z.enum(["GUPSHUP", "TWILIO", "META"]),
  content: z.string().min(1),
  variables: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const body = await req.json();
  const data = templateSchema.parse(body);
  const template = await db.template.create({ data: { tenantId, ...data } });
  return Response.json({ template });
}


