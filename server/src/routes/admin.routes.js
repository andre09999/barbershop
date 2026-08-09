import { randomBytes } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { allowRoles, authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, allowRoles("PLATFORM_ADMIN"));

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
});

router.get("/businesses", async (_req, res) => {
  const businesses = await prisma.business.findMany({
    include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { appointments: true, services: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ businesses });
});

router.post("/businesses", async (req, res) => {
  const parsed = businessSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "Revise os dados da empresa.", errors: parsed.error.flatten() });

  const temporaryPassword = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const { ownerName, ownerEmail, ...businessData } = parsed.data;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const owner = await transaction.user.create({
        data: { name: ownerName, email: ownerEmail.toLowerCase(), passwordHash, role: "BUSINESS_OWNER" },
      });
      const business = await transaction.business.create({
        data: { ...businessData, ownerId: owner.id, workingDays: [1, 2, 3, 4, 5, 6] },
      });
      await transaction.user.update({ where: { id: owner.id }, data: { businessId: business.id } });
      return { business, owner };
    });

    return res.status(201).json({ ...result, temporaryPassword });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "E-mail ou endereço da agenda já cadastrado." });
    throw error;
  }
});

export default router;
