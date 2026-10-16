import "dotenv/config";

import crypto from "node:crypto";
import mongoose from "mongoose";

import { connectDB } from "./config/db";
import { starterItems } from "./data/items";
import { Item } from "./models/Item";
import { User } from "./models/User";

const SEED_OWNER_EMAIL = "seed-owner@campus-lost-found.invalid";

async function findOrCreateSeedOwner() {
  const existingOwner = await User.findOne({ email: SEED_OWNER_EMAIL });
  if (existingOwner) return existingOwner;

  return User.create({
    name: "Starter Data Owner",
    email: SEED_OWNER_EMAIL,
    role: "student",
    isActive: false,
    password: crypto.randomBytes(32).toString("hex"),
  });
}

async function main(): Promise<void> {
  try {
    await connectDB();
    const seedOwner = await findOrCreateSeedOwner();

    for (const starterItem of starterItems) {
      await Item.findOneAndUpdate(
        {
          ownerId: seedOwner._id,
          name: starterItem.name,
          location: starterItem.location,
          dateLost: new Date(starterItem.dateLost),
        },
        {
          $set: {
            description: starterItem.description,
            status: starterItem.status,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    console.log(`Seeded ${starterItems.length} starter items.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
