import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  authenticate,
  signAccessToken,
} from "../middleware/auth.js";
import { auditData } from "../services/audit.js";

const router = Router();
const passwordSchema = z.string().min(12).max(128)
  .regex(/[a-z]/, "Use uma letra minúscula.")
  .regex(/[A-Z]/, "Use uma letra maiúscula.")
  .regex(/\d/, "Use um número.")
  .regex(/[^A-Za-z0-9]/, "Use um caractere especial.");
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
const registerSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().email(),
  phone: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(13)),
  password: passwordSchema,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    businessId: user.businessId,
    mustChangePassword: user.mustChangePassword,
  };
}

function startSession(res, user) {
  res.cookie(AUTH_COOKIE_NAME, signAccessToken(user), authCookieOptions());
}

router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "E-mail ou senha inválidos." });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user?.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: "E-mail ou senha incorretos." });
  }

  startSession(res, user);
  return res.json({ user: publicUser(user) });
});

router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: "Revise os dados da conta.", errors: parsed.error.flatten() });
  }

  const { password, ...data } = parsed.data;
  try {
    const user = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
          ...data,
          email: data.email.toLowerCase(),
          passwordHash: await bcrypt.hash(password, 12),
          role: "CUSTOMER",
        },
      });
      await transaction.auditLog.create({
        data: auditData({ actorId: created.id, action: "CUSTOMER_REGISTERED", entityType: "User", entityId: created.id }),
      });
      return created;
    });
    startSession(res, user);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Este e-mail já está cadastrado." });
    throw error;
  }
});

router.post("/logout", (_req, res) => {
  const { maxAge: _maxAge, ...clearOptions } = authCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
  return res.status(204).end();
});

router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
  if (!user?.active) return res.status(401).json({ message: "Conta indisponível." });
  return res.json({ user: publicUser(user) });
});

router.patch("/password", authenticate, async (req, res) => {
  const parsed = z.object({ currentPassword: z.string().min(8).max(128), newPassword: passwordSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ message: "A nova senha não atende aos requisitos de segurança." });

  const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return res.status(401).json({ message: "A senha atual está incorreta." });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), mustChangePassword: false },
    }),
    prisma.auditLog.create({
      data: auditData({ actorId: user.id, businessId: user.businessId, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id }),
    }),
  ]);
  return res.status(204).end();
});

export default router;
