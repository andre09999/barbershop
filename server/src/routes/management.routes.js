import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { allowRoles, authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(280),
  duration: z.coerce.number().int().min(15).max(480),
  priceInCents: z.coerce.number().int().nonnegative(),
});

router.get("/owner/dashboard", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const businessId = req.auth.businessId;
  const [business, appointments] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      include: { services: true, professionals: true },
    }),
    prisma.appointment.findMany({
      where: { businessId },
      include: { service: true, professional: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 200,
    }),
  ]);
  return res.json({ business, appointments });
});

router.post("/owner/services", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados do serviço.", errors: parsed.error.flatten() });
  const service = await prisma.service.create({ data: { ...parsed.data, businessId: req.auth.businessId } });
  return res.status(201).json({ service });
});

router.patch("/owner/services/:id", allowRoles("BUSINESS_OWNER"), async (req, res) => {
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados do serviço." });
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.auth.businessId } });
  if (!existing) return res.status(404).json({ message: "Serviço não encontrado." });
  const service = await prisma.service.update({ where: { id: existing.id }, data: parsed.data });
  return res.json({ service });
});

router.get("/customer/appointments", allowRoles("CUSTOMER"), async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { customerId: req.auth.sub },
    include: { business: true, service: true, professional: true },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
  return res.json({ appointments });
});

export default router;
