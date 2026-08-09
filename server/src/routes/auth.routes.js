import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { signAccessToken } from "../middleware/auth.js";

const router = Router();
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: "E-mail ou senha inválidos." });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: "E-mail ou senha incorretos." });
  }

  const token = signAccessToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    },
  });
});

export default router;
