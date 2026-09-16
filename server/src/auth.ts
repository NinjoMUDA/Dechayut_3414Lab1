import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export const JWT_SECRET = process.env.JWT_SECRET || "toktickit-secret-key-lab3";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustChangePassword?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword ?? false,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

export function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch {
      // Ignore error for optional auth
    }
  }
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
      return;
    }

    next();
  };
}
