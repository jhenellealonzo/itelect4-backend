import { Router, type Request, type Response } from "express";

import { requireAuth } from "../middleware/auth";
import { Claim } from "../models/Claim";
import { Item } from "../models/Item";
import type { NewClaimBody } from "../types";

type NoParams = Record<string, string>;
type ClaimBody = Partial<NewClaimBody>;

export const claimRouter = Router();

claimRouter.use(requireAuth);

claimRouter.get(
  "/",
  async (req: Request<NoParams>, res: Response) => {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const claims = await Claim.find({ claimantId: req.userId }).sort({
      claimDate: -1,
      _id: -1,
    });
    res.json(claims);
  },
);

claimRouter.post(
  "/",
  async (
    req: Request<NoParams, unknown, ClaimBody>,
    res: Response,
  ) => {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { itemId, proof } = req.body ?? {};
    if (
      typeof itemId !== "string" ||
      itemId.trim() === "" ||
      typeof proof !== "string"
    ) {
      res.status(400).json({ message: "itemId and proof are required" });
      return;
    }

    const item = await Item.findById(itemId);
    if (!item) {
      res.status(404).json({ message: "No item with that id" });
      return;
    }

    const claim = await Claim.create({
      itemId: item._id,
      claimantId: req.userId,
      proof,
    });

    res.status(201).json(claim);
  },
);
