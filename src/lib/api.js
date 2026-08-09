const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Não foi possível concluir a solicitação.");
    error.status = response.status;
    error.details = body.errors;
    throw error;
  }
  return body;
}

export const api = {
  login: (credentials) => request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  registerCustomer: (data) => request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  changePassword: (data) => request("/api/auth/password", { method: "PATCH", body: JSON.stringify(data) }),
  publicBusinesses: () => request("/api/public/businesses"),
  publicBusiness: (slug) => request(`/api/public/businesses/${slug}`),
  availability: (slug, professionalId, date) => request(`/api/public/businesses/${slug}/availability?professionalId=${encodeURIComponent(professionalId)}&date=${encodeURIComponent(date)}`),
  createAppointment: (slug, data) => request(`/api/public/businesses/${slug}/appointments`, { method: "POST", body: JSON.stringify(data) }),
  adminOverview: () => request("/api/admin/overview"),
  adminBusinesses: () => request("/api/admin/businesses"),
  createBusiness: (data) => request("/api/admin/businesses", { method: "POST", body: JSON.stringify(data) }),
  setBusinessStatus: (id, status) => request(`/api/admin/businesses/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adminSettings: () => request("/api/admin/settings"),
  updateAdminSettings: (data) => request("/api/admin/settings", { method: "PATCH", body: JSON.stringify(data) }),
  ownerDashboard: () => request("/api/owner/dashboard"),
  updateOwnerBusiness: (data) => request("/api/owner/business", { method: "PATCH", body: JSON.stringify(data) }),
  createService: (data) => request("/api/owner/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/api/owner/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  createProfessional: (data) => request("/api/owner/professionals", { method: "POST", body: JSON.stringify(data) }),
  updateProfessional: (id, data) => request(`/api/owner/professionals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  setAppointmentStatus: (id, status, note) => request(`/api/owner/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) }),
  customerAppointments: () => request("/api/customer/appointments"),
  cancelAppointment: (id) => request(`/api/customer/appointments/${id}/cancel`, { method: "PATCH" }),
};

export function buildWhatsAppFallback(phone, appointment, business, service) {
  const digits = phone.replace(/\D/g, "");
  const message = [
    `Olá, ${appointment.customerName}! Seu agendamento está confirmado.`,
    `${business.name} — ${service.name}`,
    `${appointment.date.split("-").reverse().join("/")} às ${appointment.time}`,
    "Responda esta mensagem caso precise de ajuda.",
  ].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
