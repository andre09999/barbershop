import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import managementRoutes from "./routes/management.routes.js";
import publicRoutes from "./routes/public.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origem não autorizada."));
    },
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "300kb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => res.json({
  status: env.DATABASE_URL && env.JWT_SECRET ? "ok" : "configuration_required",
  service: "agenda-pro-api",
  databaseConfigured: Boolean(env.DATABASE_URL),
  authenticationConfigured: Boolean(env.JWT_SECRET),
}));
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", managementRoutes);

app.use((_req, res) => res.status(404).json({ message: "Rota não encontrada." }));
app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ message: "Ocorreu um erro interno." });
});
