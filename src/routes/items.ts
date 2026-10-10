import { Router, type Request, type Response } from "express";

import { requireAuth } from "../middleware/auth";
import { Item } from "../models/Item";
import type { ItemUpdateBody, NewItemBody } from "../types";

type ItemIdParams = { id: string };
type NoParams = Record<string, string>;

const editableFields = [
  "name",
  "description",
  "location",
  "dateLost",
  "status",
] as const;

function pickEditableFields(body: unknown): Record<string, unknown> | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }

  const source = body as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  for (const field of editableFields) {
    if (Object.hasOwn(source, field)) picked[field] = source[field];
  }
  return picked;
}

export const itemRouter = Router();
itemRouter.use(requireAuth);

itemRouter.get("/", async (req: Request, res: Response) => {
  const items = await Item.find({ ownerId: req.userId }).sort({ dateLost: -1 });
  res.json(items);
});

itemRouter.get(
  "/:id",
  async (req: Request<ItemIdParams>, res: Response) => {
    const item = await Item.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!item) {
      res.status(404).json({ message: "No item with that id" });
      return;
    }
    res.json(item);
  },
);

itemRouter.post(
  "/",
  async (req: Request<NoParams, unknown, NewItemBody>, res: Response) => {
    const fields = pickEditableFields(req.body);
    if (!fields) {
      res.status(400).json({ message: "Request body must be a JSON object" });
      return;
    }

    const item = await Item.create({ ...fields, ownerId: req.userId });
    res.status(201).json(item);
  },
);

itemRouter.patch(
  "/:id",
  async (
    req: Request<ItemIdParams, unknown, ItemUpdateBody>,
    res: Response,
  ) => {
    const fields = pickEditableFields(req.body);
    if (!fields || Object.keys(fields).length === 0) {
      res.status(400).json({ message: "Provide at least one item field to update" });
      return;
    }

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      fields,
      { returnDocument: "after", runValidators: true },
    );
    if (!item) {
      res.status(404).json({ message: "No item with that id" });
      return;
    }
    res.json(item);
  },
);

itemRouter.delete(
  "/:id",
  async (req: Request<ItemIdParams>, res: Response) => {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!item) {
      res.status(404).json({ message: "No item with that id" });
      return;
    }
    res.status(204).send();
  },
);
