import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ message: "Autenticação necessária." });
  }

  try {
    req.auth = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada." });
  }
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
    env.JWT_SECRET,
    { expiresIn: "8h", issuer: "agenda-pro-api" }
  );
}
