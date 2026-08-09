import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { optionalAuthenticate } from "../middleware/auth.js";
import { auditData } from "../services/audit.js";
import { sendAppointmentConfirmation } from "../services/whatsapp.js";

const router = Router();
const dateSchema = z.iso.date();
const appointmentSchema = z.object({
  serviceId: z.string().min(1),
  professionalId: z.string().min(1),
  date: dateSchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  customerName: z.string().trim().min(3).max(100),
  customerPhone: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(13)),
  notes: z.string().trim().max(280).optional(),
});

const publicBusinessSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  description: true,
  phone: true,
  whatsapp: true,
  address: true,
  accent: true,
  logoUrl: true,
  openingTime: true,
  closingTime: true,
  workingDays: true,
  status: true,
};

router.get("/businesses", async (_req, res) => {
  const businesses = await prisma.business.findMany({
    where: { status: "ACTIVE" },
    select: publicBusinessSelect,
    orderBy: { name: "asc" },
  });
  return res.json({ businesses });
});

router.get("/businesses/:slug", async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { slug: req.params.slug, status: "ACTIVE" },
    select: {
      ...publicBusinessSelect,
      services: { where: { active: true }, orderBy: { name: "asc" } },
      professionals: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  if (!business) return res.status(404).json({ message: "Estabelecimento não encontrado." });
  return res.json({ business });
});

router.get("/businesses/:slug/availability", async (req, res) => {
  const parsed = z.object({ professionalId: z.string().min(1), date: dateSchema }).safeParse(req.query);
  if (!parsed.success) return res.status(422).json({ message: "Informe profissional e data válidos." });
  const business = await prisma.business.findFirst({ where: { slug: req.params.slug, status: "ACTIVE" } });
  if (!business) return res.status(404).json({ message: "Estabelecimento não encontrado." });
  const professional = await prisma.professional.findFirst({
    where: { id: parsed.data.professionalId, businessId: business.id, active: true },
  });
  if (!professional) return res.status(404).json({ message: "Profissional não encontrado." });

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      professionalId: professional.id,
      date: parsed.data.date,
      status: { not: "CANCELLED" },
    },
    select: { time: true },
  });
  return res.json({ unavailableTimes: appointments.map((appointment) => appointment.time) });
});

router.post("/businesses/:slug/appointments", optionalAuthenticate, async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: "Revise os dados do agendamento.", errors: parsed.error.flatten() });
  }

  const [business, settings] = await Promise.all([
    prisma.business.findFirst({ where: { slug: req.params.slug, status: "ACTIVE" } }),
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
  ]);
  if (!business) return res.status(404).json({ message: "Estabelecimento não encontrado." });

  const requestedDate = new Date(`${parsed.data.date}T12:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const lastDate = new Date(today);
  lastDate.setUTCDate(lastDate.getUTCDate() + settings.bookingWindowDays);
  if (requestedDate < today || requestedDate > lastDate || !business.workingDays.includes(requestedDate.getUTCDay())) {
    return res.status(422).json({ message: "A data escolhida não está disponível para agendamento." });
  }
  if (parsed.data.time < business.openingTime || parsed.data.time >= business.closingTime) {
    return res.status(422).json({ message: "O horário escolhido está fora do expediente." });
  }

  const [service, professional] = await Promise.all([
    prisma.service.findFirst({ where: { id: parsed.data.serviceId, businessId: business.id, active: true } }),
    prisma.professional.findFirst({ where: { id: parsed.data.professionalId, businessId: business.id, active: true } }),
  ]);
  if (!service || !professional) return res.status(422).json({ message: "Serviço ou profissional indisponível." });

  try {
    const appointment = await prisma.$transaction(async (transaction) => {
      const created = await transaction.appointment.create({
        data: {
          ...parsed.data,
          businessId: business.id,
          customerId: req.auth?.role === "CUSTOMER" ? req.auth.sub : null,
          status: "CONFIRMED",
        },
      });
      await transaction.appointmentStatusHistory.create({
        data: { appointmentId: created.id, toStatus: "CONFIRMED", changedById: req.auth?.sub || null, note: "Agendamento criado." },
      });
      await transaction.auditLog.create({
        data: auditData({ actorId: req.auth?.sub, businessId: business.id, action: "APPOINTMENT_CREATED", entityType: "Appointment", entityId: created.id }),
      });
      return created;
    });

    let whatsapp = { status: "pending" };
    try {
      whatsapp = await sendAppointmentConfirmation({
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        businessName: business.name,
        serviceName: service.name,
        date: appointment.date.split("-").reverse().join("/"),
        time: appointment.time,
      });
    } catch (notificationError) {
      console.error("Falha ao enviar confirmação:", notificationError.message);
      whatsapp = { status: "failed" };
    }

    return res.status(201).json({ appointment, whatsapp });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Este horário acabou de ser reservado." });
    throw error;
  }
});

export default router;
