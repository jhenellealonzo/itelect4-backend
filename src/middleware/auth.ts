import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { TokenPayload } from "../types";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      message: "No token. Send Authorization: Bearer <token>",
    });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: "Authentication is not configured" });
    return;
  }

  try {
    const payload = jwt.verify(header.slice("Bearer ".length), secret);
    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.userId !== "string"
    ) {
      res.status(401).json({ message: "Token is invalid or has expired" });
      return;
    }

    req.userId = (payload as TokenPayload).userId;
    next();
  } catch {
    res.status(401).json({ message: "Token is invalid or has expired" });
  }
}
