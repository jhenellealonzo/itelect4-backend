import { model, Schema } from "mongoose";

import type { ClaimDoc } from "../types";

const claimSchema = new Schema<ClaimDoc>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    claimantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    claimDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    proof: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
  },
);

claimSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    if (ret.itemId !== undefined) ret.itemId = String(ret.itemId);
    if (ret.claimantId !== undefined) ret.claimantId = String(ret.claimantId);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Claim = model<ClaimDoc>("Claim", claimSchema);
