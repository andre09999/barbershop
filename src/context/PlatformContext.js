import { createContext, useContext, useState } from "react";
import { createRemoteAppointment, hasRemoteApi } from "../lib/api";
import {
  createId,
  loadData,
  loadSession,
  normalizePhone,
  saveData,
  saveSession,
  slugify,
} from "../lib/platformStore";

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const [data, setData] = useState(loadData);
  const [session, setSession] = useState(loadSession);

  const persist = (updater) => {
    setData((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      saveData(next);
      return next;
    });
  };

  const signInAs = (userId) => {
    const user = data.users.find((item) => item.id === userId);
    if (!user) throw new Error("Perfil de demonstração não encontrado.");
    setSession(user);
    saveSession(user);
    return user;
  };

  const signOut = () => {
    setSession(null);
    saveSession(null);
  };

  const createBusiness = (payload) => {
    const businessId = createId("business");
    const ownerId = createId("user");
    const business = {
      id: businessId,
      slug: slugify(payload.name),
      name: payload.name.trim(),
      category: payload.category,
      ownerId,
      phone: normalizePhone(payload.whatsapp),
      whatsapp: normalizePhone(payload.whatsapp),
      address: payload.address.trim(),
      description: payload.description.trim(),
      accent: payload.accent,
      status: "active",
      openingTime: "09:00",
      closingTime: "18:00",
      workingDays: [1, 2, 3, 4, 5, 6],
    };
    const owner = {
      id: ownerId,
      name: payload.ownerName.trim(),
      email: payload.ownerEmail.trim().toLowerCase(),
      phone: normalizePhone(payload.whatsapp),
      role: "business_owner",
      businessId,
    };

    persist((current) => ({
      ...current,
      businesses: [...current.businesses, business],
      users: [...current.users, owner],
      services: [
        ...current.services,
        {
          id: createId("service"),
          businessId,
          name: "Serviço inicial",
          description: "Personalize este serviço no painel do estabelecimento.",
          duration: 45,
          price: 50,
          active: true,
        },
      ],
      professionals: [
        ...current.professionals,
        {
          id: createId("professional"),
          businessId,
          name: payload.ownerName.trim(),
          specialty: "Profissional responsável",
          active: true,
        },
      ],
    }));

    return business;
  };

  const updateBusiness = (businessId, changes) => {
    persist((current) => ({
      ...current,
      businesses: current.businesses.map((business) =>
        business.id === businessId ? { ...business, ...changes } : business
      ),
    }));
  };

  const addService = (businessId, payload) => {
    const service = {
      id: createId("service"),
      businessId,
      name: payload.name.trim(),
      description: payload.description.trim(),
      duration: Number(payload.duration),
      price: Number(payload.price),
      active: true,
    };
    persist((current) => ({
      ...current,
      services: [...current.services, service],
    }));
    return service;
  };

  const createAppointment = async (business, payload) => {
    if (hasRemoteApi) {
      return createRemoteAppointment(business.slug, payload);
    }

    const collision = data.appointments.some(
      (item) =>
        item.businessId === business.id &&
        item.professionalId === payload.professionalId &&
        item.date === payload.date &&
        item.time === payload.time &&
        item.status !== "cancelled"
    );

    if (collision) {
      throw new Error("Este horário acabou de ser reservado. Escolha outro.");
    }

    const customerId = session?.role === "customer" ? session.id : null;
    const appointment = {
      id: createId("appointment"),
      businessId: business.id,
      customerId,
      customerName: payload.customerName.trim(),
      customerPhone: normalizePhone(payload.customerPhone),
      serviceId: payload.serviceId,
      professionalId: payload.professionalId,
      date: payload.date,
      time: payload.time,
      status: "confirmed",
      notes: payload.notes?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    persist((current) => ({
      ...current,
      appointments: [...current.appointments, appointment],
    }));

    return { appointment, whatsapp: { status: "fallback" } };
  };

  const value = {
    data,
    session,
    signInAs,
    signOut,
    createBusiness,
    updateBusiness,
    addService,
    createAppointment,
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform deve ser usado dentro de PlatformProvider.");
  return context;
}
