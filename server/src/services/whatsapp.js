import { env } from "../config/env.js";

export async function sendAppointmentConfirmation({
  customerName,
  customerPhone,
  businessName,
  serviceName,
  date,
  time,
}) {
  if (!env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_ACCESS_TOKEN) {
    return { status: "not_configured" };
  }

  const response = await fetch(
    `https://graph.facebook.com/${env.WHATSAPP_GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: customerPhone.replace(/\D/g, ""),
        type: "template",
        template: {
          name: env.WHATSAPP_TEMPLATE_NAME,
          language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE },
          components: [
            {
              type: "body",
              parameters: [customerName, businessName, serviceName, date, time].map((text) => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const providerMessage = body.error?.message || "Falha não detalhada pelo provedor.";
    throw new Error(`WhatsApp Cloud recusou a mensagem: ${providerMessage}`);
  }

  const body = await response.json();
  return { status: "sent", messageId: body.messages?.[0]?.id };
}
