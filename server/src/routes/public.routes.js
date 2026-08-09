import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { sendAppointmentConfirmation } from "../services/whatsapp.js";

const router = Router();
const appointmentSchema = z.object({
  serviceId: z.string().min(1),
  professionalId: z.string().min(1),
  date: z.iso.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  customerName: z.string().trim().min(3).max(100),
  customerPhone: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(13)),
  notes: z.string().trim().max(280).optional(),
});

router.get("/businesses/:slug", async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { slug: req.params.slug, status: "ACTIVE" },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      professionals: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  if (!business) return res.status(404).json({ message: "Estabelecimento não encontrado." });
  return res.json({ business });
});

router.post("/businesses/:slug/appointments", async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: "Revise os dados do agendamento.", errors: parsed.error.flatten() });
  }

  const business = await prisma.business.findFirst({
    where: { slug: req.params.slug, status: "ACTIVE" },
  });
  if (!business) return res.status(404).json({ message: "Estabelecimento não encontrado." });

  const [service, professional] = await Promise.all([
    prisma.service.findFirst({ where: { id: parsed.data.serviceId, businessId: business.id, active: true } }),
    prisma.professional.findFirst({ where: { id: parsed.data.professionalId, businessId: business.id, active: true } }),
  ]);
  if (!service || !professional) {
    return res.status(422).json({ message: "Serviço ou profissional indisponível." });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: { ...parsed.data, businessId: business.id, status: "CONFIRMED" },
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
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Este horário acabou de ser reservado." });
    }
    throw error;
  }
});

export default router;
