import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
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
  corsOrigins: result.data.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
};
