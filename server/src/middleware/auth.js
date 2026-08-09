import jwt from "jsonwebtoken";
import { env, requireJwtSecret } from "../config/env.js";
import { prisma } from "../db/prisma.js";

export const AUTH_COOKIE_NAME = "agenda_pro_session";

function readToken(req) {
  return req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
}

function verifyToken(token) {
  return jwt.verify(token, requireJwtSecret(), {
    issuer: "agenda-pro-api",
    audience: "agenda-pro-web",
  });
}

async function resolveAuthentication(req) {
  const token = readToken(req);
  if (!token) return null;

  const payload = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, businessId: true, active: true },
  });

  if (!user?.active) return null;
  return { sub: user.id, role: user.role, businessId: user.businessId };
}

export async function authenticate(req, res, next) {
  try {
    req.auth = await resolveAuthentication(req);
    if (!req.auth) return res.status(401).json({ message: "Autenticação necessária." });
    return next();
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada." });
  }
}

export async function optionalAuthenticate(req, _res, next) {
  try {
    req.auth = await resolveAuthentication(req);
  } catch {
    req.auth = null;
  }
  return next();
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Você não tem permissão para esta operação." });
    }
    return next();
  };
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, businessId: user.businessId },
    requireJwtSecret(),
    { expiresIn: "8h", issuer: "agenda-pro-api", audience: "agenda-pro-web" }
  );
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  };
}
