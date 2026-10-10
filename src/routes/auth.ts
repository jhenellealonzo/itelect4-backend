import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

import { User } from "../models/User";

type NoParams = Record<string, string>;

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export const authRouter = Router();

authRouter.post(
  "/register",
  async (req: Request<NoParams, unknown, RegisterBody>, res: Response) => {
    const { name, email, password } = req.body ?? {};
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      res.status(409).json({ message: "That email is already registered" });
      return;
    }

    // Role and isActive are deliberately not accepted from the request.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    res.status(201).json(user.toJSON());
  },
);

authRouter.post(
  "/login",
  async (req: Request<NoParams, unknown, LoginBody>, res: Response) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(401).json({ message: "Email or password is incorrect" });
      return;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      "+password",
    );
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Email or password is incorrect" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: "Authentication is not configured" });
      return;
    }

    const token = jwt.sign({ userId: String(user._id) }, secret, {
      expiresIn: "2h",
    });
    res.json({ token, user: user.toJSON() });
  },
);
