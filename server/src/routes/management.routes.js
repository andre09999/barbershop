import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { allowRoles, authenticate } from "../middleware/auth.js";
import { auditData } from "../services/audit.js";

const router = Router();
router.use(authenticate);

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(280),
  duration: z.coerce.number().int().min(15).max(480),
  priceInCents: z.coerce.number().int().nonnegative(),
  active: z.boolean().optional(),
});
const professionalSchema = z.object({
  name: z.string().trim().min(2).max(100),
  specialty: z.string().trim().min(2).max(140),
  active: z.boolean().optional(),
});
const businessUpdateSchema = z.object({
  description: z.string().trim().min(10).max(400),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1),
});

async function ownerBusiness(req, res) {
  if (!req.auth.businessId) {
    res.status(403).json({ message: "Este perfil não está vinculado a um estabelecimento." });
    return null;
  }
  const business = await prisma.business.findUnique({ where: { id: req.auth.businessId } });
  if (!business || business.status !== "ACTIVE") {
    res.status(403).json({ message: "Estabelecimento indisponível." });
    return null;
  }
  return business;
}

router.get("/owner/dashboard", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const business = await ownerBusiness(req, res);
  if (!business) return;
  const [details, appointments] = await Promise.all([
    prisma.business.findUnique({
      where: { id: business.id },
      include: { services: { orderBy: { createdAt: "desc" } }, professionals: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.appointment.findMany({
      where: { businessId: business.id },
      include: {
        service: true,
        professional: true,
        statusHistory: { include: { changedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 300,
    }),
  ]);
  return res.json({ business: details, appointments });
});

router.patch("/owner/business", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = businessUpdateSchema.safeParse(req.body);
  if (!parsed.success || parsed.data.openingTime >= parsed.data.closingTime) {
    return res.status(422).json({ message: "Revise a identidade e os horários informados." });
  }
  const business = await ownerBusiness(req, res);
  if (!business) return;

  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.business.update({ where: { id: business.id }, data: parsed.data });
    await transaction.auditLog.create({
      data: auditData({ actorId: req.auth.sub, businessId: business.id, action: "BUSINESS_PROFILE_UPDATED", entityType: "Business", entityId: business.id }),
    });
    return next;
  });
  return res.json({ business: updated });
});

router.post("/owner/services", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados do serviço.", errors: parsed.error.flatten() });
  const business = await ownerBusiness(req, res);
  if (!business) return;
  const service = await prisma.$transaction(async (transaction) => {
    const created = await transaction.service.create({ data: { ...parsed.data, businessId: business.id } });
    await transaction.auditLog.create({
      data: auditData({ actorId: req.auth.sub, businessId: business.id, action: "SERVICE_CREATED", entityType: "Service", entityId: created.id }),
    });
    return created;
  });
  return res.status(201).json({ service });
});

router.patch("/owner/services/:id", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados do serviço." });
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.auth.businessId } });
  if (!existing) return res.status(404).json({ message: "Serviço não encontrado." });
  const service = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.service.update({ where: { id: existing.id }, data: parsed.data });
    await transaction.auditLog.create({
      data: auditData({ actorId: req.auth.sub, businessId: req.auth.businessId, action: "SERVICE_UPDATED", entityType: "Service", entityId: existing.id }),
    });
    return updated;
  });
  return res.json({ service });
});

router.post("/owner/professionals", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = professionalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados do profissional." });
  const business = await ownerBusiness(req, res);
  if (!business) return;
  const professional = await prisma.$transaction(async (transaction) => {
    const created = await transaction.professional.create({ data: { ...parsed.data, businessId: business.id } });
    await transaction.auditLog.create({
      data: auditData({ actorId: req.auth.sub, businessId: business.id, action: "PROFESSIONAL_CREATED", entityType: "Professional", entityId: created.id }),
    });
    return created;
  });
  return res.status(201).json({ professional });
});

router.patch("/owner/professionals/:id", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = professionalSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados do profissional." });
  const existing = await prisma.professional.findFirst({ where: { id: req.params.id, businessId: req.auth.businessId } });
  if (!existing) return res.status(404).json({ message: "Profissional não encontrado." });
  const professional = await prisma.professional.update({ where: { id: existing.id }, data: parsed.data });
  return res.json({ professional });
});

router.patch("/owner/appointments/:id/status", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
    note: z.string().trim().max(280).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Status inválido." });
  const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, businessId: req.auth.businessId } });
  if (!existing) return res.status(404).json({ message: "Agendamento não encontrado." });
  if (existing.status === parsed.data.status) return res.json({ appointment: existing });

  const appointment = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.appointment.update({ where: { id: existing.id }, data: { status: parsed.data.status } });
    await transaction.appointmentStatusHistory.create({
      data: { appointmentId: existing.id, fromStatus: existing.status, toStatus: parsed.data.status, changedById: req.auth.sub, note: parsed.data.note },
    });
    await transaction.auditLog.create({
      data: auditData({ actorId: req.auth.sub, businessId: existing.businessId, action: "APPOINTMENT_STATUS_CHANGED", entityType: "Appointment", entityId: existing.id, metadata: { from: existing.status, to: parsed.data.status } }),
    });
    return updated;
  });
  return res.json({ appointment });
});

router.get("/customer/appointments", allowRoles("CUSTOMER"), async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { customerId: req.auth.sub },
    include: {
      business: { select: { id: true, slug: true, name: true, address: true, accent: true } },
      service: true,
      professional: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
  return res.json({ appointments });
});

router.patch("/customer/appointments/:id/cancel", allowRoles("CUSTOMER"), async (req, res) => {
  const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, customerId: req.auth.sub } });
  if (!existing) return res.status(404).json({ message: "Agendamento não encontrado." });
  if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
    return res.status(409).json({ message: "Este agendamento não pode mais ser cancelado." });
  }
  const appointment = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.appointment.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });
    await transaction.appointmentStatusHistory.create({
      data: { appointmentId: existing.id, fromStatus: existing.status, toStatus: "CANCELLED", changedById: req.auth.sub, note: "Cancelado pelo cliente." },
    });
    return updated;
  });
  return res.json({ appointment });
});

export default router;
