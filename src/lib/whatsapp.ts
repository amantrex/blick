import { env } from "@/env";

type Provider = "GUPSHUP" | "TWILIO" | "META";

export type SendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

export async function sendWhatsAppText(
  provider: Provider,
  toPhoneE164: string,
  body: string,
): Promise<SendResult> {
  try {
    if (provider === "GUPSHUP") {
      if (!env.GUPSHUP_API_KEY || !env.GUPSHUP_BASE_URL) {
        return { ok: false, error: "Gupshup env not configured" };
      }
      const res = await fetch(`${env.GUPSHUP_BASE_URL}/msg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          apikey: env.GUPSHUP_API_KEY,
        },
        body: new URLSearchParams({ channel: "whatsapp", source: "", destination: toPhoneE164, message: body }).toString(),
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, providerMessageId: json?.messageId, error: res.ok ? undefined : JSON.stringify(json) };
    }

    if (provider === "TWILIO") {
      if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_NUMBER) {
        return { ok: false, error: "Twilio env not configured" };
      }
      const creds = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: env.TWILIO_WHATSAPP_NUMBER, To: `whatsapp:${toPhoneE164}`, Body: body }).toString(),
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, providerMessageId: json?.sid, error: res.ok ? undefined : JSON.stringify(json) };
    }

    if (provider === "META") {
      if (!env.META_WABA_TOKEN || !env.META_WABA_PHONE_ID) {
        return { ok: false, error: "Meta env not configured" };
      }
      const res = await fetch(`https://graph.facebook.com/v20.0/${env.META_WABA_PHONE_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.META_WABA_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: toPhoneE164, type: "text", text: { body } }),
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, providerMessageId: json?.messages?.[0]?.id, error: res.ok ? undefined : JSON.stringify(json) };
    }

    return { ok: false, error: "Unsupported provider" };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
}


