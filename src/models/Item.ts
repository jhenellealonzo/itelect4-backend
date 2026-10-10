import { model, Schema } from "mongoose";

import type { ItemDoc } from "../types";

const itemSchema = new Schema<ItemDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    location: { type: String, required: true, trim: true },
    dateLost: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["lost", "found", "claimed"],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

itemSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    if (ret.ownerId !== undefined) ret.ownerId = String(ret.ownerId);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Item = model<ItemDoc>("Item", itemSchema);
