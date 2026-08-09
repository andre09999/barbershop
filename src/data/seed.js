export const ROLE_LABELS = {
  platform_admin: "Administrador da plataforma",
  business_owner: "Responsável pelo estabelecimento",
  customer: "Cliente",
};

export const CATEGORY_LABELS = {
  barbershop: "Barbearia",
  salon: "Salão de beleza",
  clinic: "Clínica",
};

export const seedState = {
  users: [
    {
      id: "user-admin",
      name: "André Luis",
      email: "admin@agendapro.com.br",
      role: "platform_admin",
    },
    {
      id: "user-owner",
      name: "Gabriel Oliveira",
      email: "gestor@oliveer.com.br",
      phone: "5562982212243",
      role: "business_owner",
      businessId: "business-oliveer",
    },
    {
      id: "user-customer",
      name: "Marcos Silva",
      email: "cliente@agendapro.com.br",
      phone: "5562999999999",
      role: "customer",
    },
  ],
  businesses: [
    {
      id: "business-oliveer",
      slug: "oliveer-barbearia",
      name: "Oliveer Barbearia",
      category: "barbershop",
      ownerId: "user-owner",
      phone: "5562982212243",
      whatsapp: "5562982212243",
      address: "Parque Atheneu, Goiânia - GO",
      description:
        "Cuidado masculino com técnica, pontualidade e uma experiência feita para você.",
      accent: "#d4a853",
      status: "active",
      openingTime: "09:00",
      closingTime: "19:00",
      workingDays: [1, 2, 3, 4, 5, 6],
    },
  ],
  services: [
    {
      id: "service-cut",
      businessId: "business-oliveer",
      name: "Corte premium",
      description: "Consultoria de estilo, corte e finalização.",
      duration: 45,
      price: 55,
      active: true,
    },
    {
      id: "service-beard",
      businessId: "business-oliveer",
      name: "Barba completa",
      description: "Toalha quente, desenho e hidratação.",
      duration: 30,
      price: 40,
      active: true,
    },
    {
      id: "service-combo",
      businessId: "business-oliveer",
      name: "Corte + barba",
      description: "Experiência completa com acabamento premium.",
      duration: 75,
      price: 85,
      active: true,
    },
  ],
  professionals: [
    {
      id: "professional-gabriel",
      businessId: "business-oliveer",
      name: "Gabriel",
      specialty: "Cortes clássicos e barba",
      active: true,
    },
    {
      id: "professional-arthur",
      businessId: "business-oliveer",
      name: "Arthur",
      specialty: "Fade e visagismo",
      active: true,
    },
  ],
  appointments: [
    {
      id: "appointment-demo",
      businessId: "business-oliveer",
      serviceId: "service-combo",
      professionalId: "professional-gabriel",
      customerId: "user-customer",
      customerName: "Marcos Silva",
      customerPhone: "5562999999999",
      date: "2026-08-12",
      time: "14:00",
      status: "confirmed",
      createdAt: "2026-08-08T18:00:00.000Z",
    },
  ],
};
