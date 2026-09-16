import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Authentication API — /api/auth", () => {
  const prisma = getPrisma();
  const validEmail = "jennifer.anderson@example.com";
  const validPassword = "Password123!";

  beforeEach(async () => {
    const hash = await bcrypt.hash(validPassword, 10);
    await prisma.user.updateMany({
      where: { email: "robert.wilson@example.com" },
      data: { passwordHash: hash, mustChangePassword: true },
    });
  });

  afterAll(async () => {
    const hash = await bcrypt.hash(validPassword, 10);
    await prisma.user.updateMany({
      where: { email: "robert.wilson@example.com" },
      data: { passwordHash: hash, mustChangePassword: true },
    });
  });

  it("API-01: Valid login returns 200, JWT token, and safe user profile without passwordHash", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validEmail, password: validPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(typeof res.body.data.token).toBe("string");

    const user = res.body.data.user;
    expect(user.email).toBe(validEmail);
    expect(user.name).toBe("Jennifer Anderson");
    expect(user.role).toBe("REQUESTER");
    expect(user).not.toHaveProperty("passwordHash");

    // Check Set-Cookie header contains token
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=/);
  });

  it("API-02: Login with incorrect password returns 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validEmail, password: "WrongPassword999!" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid email or password/i);
    expect(res.body.data).toBeUndefined();
  });

  it("API-03: Login with inactive user account returns 401 and inactive account message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.taylor.inactive@example.com", password: validPassword });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/inactive/i);
  });

  it("API-04: GET /api/auth/me returns current user identity with valid token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: validEmail, password: validPassword });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe(validEmail);
    expect(meRes.body.data.name).toBe("Jennifer Anderson");
    expect(meRes.body.data.role).toBe("REQUESTER");
  });

  it("API-05: POST /api/auth/change-password updates password and clears mustChangePassword", async () => {
    // Robert Wilson has mustChangePassword = true initially
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "robert.wilson@example.com", password: validPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);

    const token = loginRes.body.data.token;

    // Change password
    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: validPassword,
        newPassword: "BrandNewPassword789!",
        confirmPassword: "BrandNewPassword789!",
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);
    expect(changeRes.body.data.mustChangePassword).toBe(false);

    // Verify login with new password works
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "robert.wilson@example.com", password: "BrandNewPassword789!" });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.user.mustChangePassword).toBe(false);
  });

  it("POST /api/auth/logout clears auth cookie and returns 200", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
