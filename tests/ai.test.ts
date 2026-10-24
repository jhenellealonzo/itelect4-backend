import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/config/db", () => ({
  connectDB: async () => undefined,
}));

import { app } from "../src/app";

function tokenFor(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "5m" });
}

describe("POST /api/ai authentication and validation", () => {
  it("answers 401 when there is no token", async () => {
    const response = await request(app)
      .post("/api/ai")
      .send({
        prompt: "Blue tumbler lost near the library with a silver lid",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "No token. Send Authorization: Bearer <token>",
    });
  });

  it("answers 401 when the token was signed with another secret", async () => {
    const forgedToken = jwt.sign({ userId: "someone" }, "not-the-secret");
    const response = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${forgedToken}`)
      .send({
        prompt: "Blue tumbler lost near the library with a silver lid",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Token is invalid or has expired",
    });
  });

  it("lets a valid token through, then validates the item-report body", async () => {
    const response = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${tokenFor("test-user")}`)
      .send({ prompt: "Too short" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      "Describe the item report in at least 20 characters.",
    ]);
  });
});
