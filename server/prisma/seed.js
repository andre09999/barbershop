import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const configSchema = z.object({
  ADMIN_NAME: z.string().trim().min(3).max(100),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12).max(128)
    .regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/),
});

async function main() {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Defina ADMIN_NAME, ADMIN_EMAIL e uma ADMIN_PASSWORD forte no ambiente protegido.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: parsed.data.ADMIN_EMAIL.toLowerCase() },
    update: {
      name: parsed.data.ADMIN_NAME,
      passwordHash,
      role: "PLATFORM_ADMIN",
      active: true,
      mustChangePassword: false,
    },
    create: {
      name: parsed.data.ADMIN_NAME,
      email: parsed.data.ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: "PLATFORM_ADMIN",
      active: true,
      mustChangePassword: false,
    },
  });
  await prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } });
  console.log("Administrador inicial e configurações verificados com sucesso.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
