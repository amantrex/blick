import { db } from "@/lib/db";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const provider = (url.searchParams.get("provider") ?? "META").toUpperCase();
  const body = await req.json().catch(() => ({}));
  await db.webhookEvent.create({ data: { provider: provider as any, eventType: "whatsapp-webhook", payload: body } });
  return new Response("ok");
}

export async function GET() {
  return new Response("ok");
}


