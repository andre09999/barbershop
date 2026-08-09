import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  CORS_ORIGINS: z.string().default("http://localhost:3000,https://agenda-pro-andre.vercel.app"),
  WHATSAPP_GRAPH_VERSION: z.string().default("v23.0"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_TEMPLATE_NAME: z.string().default("appointment_confirmation"),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().default("pt_BR"),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Configuração inválida. Verifique: ${missing}.`);
}

export const env = {
  ...result.data,
  corsOrigins: [
    ...result.data.CORS_ORIGINS.split(","),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ].map((origin) => origin.trim()).filter(Boolean),
};

export function requireJwtSecret() {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET não foi configurado no ambiente protegido.");
  }
  return env.JWT_SECRET;
}
