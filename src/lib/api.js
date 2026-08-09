const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || "Não foi possível concluir a solicitação.");
  }

  return body;
}

export const hasRemoteApi = Boolean(API_URL);

export function createRemoteAppointment(slug, appointment) {
  return request(`/api/public/businesses/${slug}/appointments`, {
    method: "POST",
    body: JSON.stringify(appointment),
  });
}

export function buildWhatsAppFallback(phone, appointment, business, service) {
  const digits = phone.replace(/\D/g, "");
  const message = [
    `Olá, ${appointment.customerName}! Seu agendamento foi solicitado.`,
    `${business.name} — ${service.name}`,
    `${appointment.date.split("-").reverse().join("/")} às ${appointment.time}`,
    "Responda esta mensagem caso precise de ajuda.",
  ].join("\n");

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
