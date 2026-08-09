import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { allowRoles, authenticate } from "../middleware/auth.js";
import { auditData } from "../services/audit.js";

const router = Router();
router.use(authenticate, allowRoles("PLATFORM_ADMIN"));

const passwordSchema = z.string().min(12).max(128)
  .regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/);
const businessSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(["BARBERSHOP", "SALON", "CLINIC"]),
  description: z.string().trim().min(10).max(400),
  phone: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(13)),
  whatsapp: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(13)),
  address: z.string().trim().min(5).max(180),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  ownerName: z.string().trim().min(3).max(100),
  ownerEmail: z.string().email(),
  ownerPassword: passwordSchema,
});

router.get("/overview", async (_req, res) => {
  const [activeBusinesses, appointments, professionals, services, recentAudit] = await Promise.all([
    prisma.business.count({ where: { status: "ACTIVE" } }),
    prisma.appointment.count(),
    prisma.professional.count({ where: { active: true } }),
    prisma.service.findMany({
      where: { appointments: { some: {} } },
      select: { priceInCents: true, _count: { select: { appointments: true } } },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const bookedValueInCents = services.reduce((total, service) => total + service.priceInCents * service._count.appointments, 0);
  return res.json({ metrics: { activeBusinesses, appointments, professionals, bookedValueInCents }, recentAudit });
});

router.get("/businesses", async (_req, res) => {
  const businesses = await prisma.business.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true, active: true, mustChangePassword: true } },
      _count: { select: { appointments: true, services: true, professionals: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ businesses });
});

router.post("/businesses", async (req, res) => {
  const parsed = businessSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados da empresa.", errors: parsed.error.flatten() });

  const { ownerName, ownerEmail, ownerPassword, ...businessData } = parsed.data;
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const owner = await transaction.user.create({
        data: {
          name: ownerName,
          email: ownerEmail.toLowerCase(),
          passwordHash: await bcrypt.hash(ownerPassword, 12),
          role: "BUSINESS_OWNER",
          mustChangePassword: true,
        },
      });
      const business = await transaction.business.create({
        data: { ...businessData, ownerId: owner.id, workingDays: [1, 2, 3, 4, 5, 6] },
      });
      await transaction.user.update({ where: { id: owner.id }, data: { businessId: business.id } });
      await transaction.professional.create({
        data: { businessId: business.id, name: ownerName, specialty: "Profissional responsável" },
      });
      await transaction.auditLog.create({
        data: auditData({ actorId: req.auth.sub, businessId: business.id, action: "BUSINESS_CREATED", entityType: "Business", entityId: business.id }),
      });
      return { business, owner: { id: owner.id, name: owner.name, email: owner.email } };
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "E-mail ou endereço da agenda já cadastrado." });
    throw error;
  }
});

router.patch("/businesses/:id/status", async (req, res) => {
  const parsed = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Status inválido." });
  const existing = await prisma.business.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Estabelecimento não encontrado." });

  const business = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.business.update({ where: { id: existing.id }, data: parsed.data });
    await transaction.user.update({ where: { id: existing.ownerId }, data: { active: parsed.data.status === "ACTIVE" } });
    await transaction.auditLog.create({
      data: auditData({ actorId: req.auth.sub, businessId: existing.id, action: "BUSINESS_STATUS_CHANGED", entityType: "Business", entityId: existing.id, metadata: { from: existing.status, to: parsed.data.status } }),
    });
    return updated;
  });
  return res.json({ business });
});

router.get("/settings", async (_req, res) => {
  const settings = await prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } });
  return res.json({ settings });
});

router.patch("/settings", async (req, res) => {
  const parsed = z.object({
    platformName: z.string().trim().min(2).max(60),
    supportEmail: z.union([z.string().email(), z.literal("")]).transform((value) => value || null),
    defaultAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    bookingWindowDays: z.coerce.number().int().min(7).max(365),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise as configurações.", errors: parsed.error.flatten() });

  const settings = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.platformSettings.upsert({
      where: { id: "platform" }, update: parsed.data, create: { id: "platform", ...parsed.data },
    });
    await transaction.auditLog.create({
      data: auditData({ actorId: req.auth.sub, action: "PLATFORM_SETTINGS_UPDATED", entityType: "PlatformSettings", entityId: "platform" }),
    });
    return updated;
  });
  return res.json({ settings });
});

export default router;
