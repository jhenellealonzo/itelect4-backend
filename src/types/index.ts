import type { Types } from "mongoose";

// These shapes mirror the user and item domain in itelect4-project.
// MongoDB supplies IDs, and the server supplies item ownership.
export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "securityAdmin";
  isActive: boolean;
}

export interface Items {
  id: number;
  name: string;
  description: string;
  location: string;
  dateLost: Date;
  status: "lost" | "found" | "claimed";
  ownerId: number;
}

export interface Claims {
  id: number;
  itemId: number;
  claimantId: number;
  claimDate: Date;
  status: "pending" | "approved" | "rejected";
  proof: string;
}

export type UserDoc = Omit<User, "id"> & {
  password: string;
};

export type ItemDoc = Omit<Items, "id" | "ownerId"> & {
  ownerId: Types.ObjectId;
};

// JSON request bodies carry dates as strings. The API never accepts an ID
// or ownerId from a client when creating an item.
export type NewItemBody = Omit<Items, "id" | "ownerId" | "dateLost"> & {
  dateLost: string;
};

export type ItemUpdateBody = Partial<NewItemBody>;

export type ClaimDoc = Omit<Claims, "id" | "itemId" | "claimantId"> & {
  itemId: Types.ObjectId;
  claimantId: Types.ObjectId;
};

export interface NewClaimBody {
  itemId: string;
  proof: string;
}

export interface TokenPayload {
  userId: string;
}
