import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { Role } from "@prisma/client";

describe("Lab 3 Admin User Management API", () => {
  const validPassword = "Password123!";
  let adminToken: string;
  let adminUser: any;
  let staffToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // 1. Admin login
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "john.smith@toktickit.com", password: validPassword });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.token;
    adminUser = adminLogin.body.data.user;

    // 2. Staff login
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: validPassword });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;

    // 3. Requester login
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: validPassword });
    expect(reqLogin.status).toBe(200);
    requesterToken = reqLogin.body.data.token;
  });

  // API-07: Access Control (Requester & Staff cannot access Admin endpoints)
  it("API-07: Non-admin users accessing /api/admin/users receive 403 Forbidden", async () => {
    const requesterRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${requesterToken}`);
    expect(requesterRes.status).toBe(403);
    expect(requesterRes.body.success).toBe(false);

    const staffRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(staffRes.status).toBe(403);
    expect(staffRes.body.success).toBe(false);
  });

  // API-16: List users with search and role filter
  it("API-16: Admin queries user list with search and role filter", async () => {
    const allRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(allRes.status).toBe(200);
    expect(allRes.body.success).toBe(true);
    expect(Array.isArray(allRes.body.data)).toBe(true);
    expect(allRes.body.data.length).toBeGreaterThan(0);

    // Search filter
    const searchRes = await request(app)
      .get("/api/admin/users?search=Lisa")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.some((u: any) => u.name.includes("Lisa"))).toBe(true);

    // Role filter
    const roleRes = await request(app)
      .get("/api/admin/users?role=IT_STAFF")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.every((u: any) => u.role === "IT_STAFF")).toBe(true);
  });

  // API-17: Admin creates new user with initial password
  it("API-17: Admin creates new user with initial password & duplicate email is rejected", async () => {
    const uniqueEmail = `test.user.${Date.now()}@example.com`;

    const createRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Admin Created User",
        email: uniqueEmail,
        role: "IT_STAFF",
        isActive: true,
        initialPassword: "Password123!",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.email).toBe(uniqueEmail);
    expect(createRes.body.data.role).toBe("IT_STAFF");
    expect(createRes.body.data.mustChangePassword).toBe(true);
    expect(createRes.body.data.passwordHash).toBeUndefined();

    // Duplicate email check (BR-08)
    const duplicateRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Duplicate User",
        email: uniqueEmail,
        role: "REQUESTER",
        isActive: true,
      });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error).toMatch(/email already exists/i);
  });

  // API-18: Admin updates user details
  it("API-18: Admin updates user name, email, role, and active status", async () => {
    const emailToCreate = `update.target.${Date.now()}@example.com`;
    const createRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Original Name",
        email: emailToCreate,
        role: "REQUESTER",
        isActive: true,
      });

    const targetUserId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Name",
        role: "IT_STAFF",
        isActive: false,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.name).toBe("Updated Name");
    expect(updateRes.body.data.role).toBe("IT_STAFF");
    expect(updateRes.body.data.isActive).toBe(false);
  });

  // API-19: Admin attempts self-deactivation (BR-10)
  it("API-19: Admin attempts self-deactivation returns 400 Bad Request", async () => {
    const selfDeactivateRes = await request(app)
      .patch(`/api/admin/users/${adminUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        isActive: false,
      });

    expect(selfDeactivateRes.status).toBe(400);
    expect(selfDeactivateRes.body.success).toBe(false);
    expect(selfDeactivateRes.body.error).toMatch(/cannot deactivate your own account/i);
  });

  // API-20: Admin attempts to deactivate or demote last active Admin (BR-11)
  it("API-20: Admin attempts to deactivate or demote last active Admin returns 400 Bad Request", async () => {
    const prisma = getPrisma();

    // Create a temporary isolated active Admin
    const tempAdmin = await prisma.user.create({
      data: {
        name: "Temporary Solo Admin",
        email: `solo.admin.${Date.now()}@example.com`,
        role: Role.ADMIN,
        isActive: true,
        passwordHash: "dummy",
      },
    });

    // Deactivate other admins temporarily in DB so tempAdmin is the sole active admin
    const otherAdmins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true, id: { not: tempAdmin.id } },
    });

    await prisma.user.updateMany({
      where: { id: { in: otherAdmins.map((a) => a.id) } },
      data: { isActive: false },
    });

    try {
      // Attempt to deactivate the last active admin
      const deactRes = await request(app)
        .patch(`/api/admin/users/${tempAdmin.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(deactRes.status).toBe(400);
      expect(deactRes.body.error).toMatch(/last active administrator/i);

      // Attempt to demote the last active admin
      const demoteRes = await request(app)
        .patch(`/api/admin/users/${tempAdmin.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "IT_STAFF" });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error).toMatch(/last active administrator/i);
    } finally {
      // Restore other admins and cleanup
      await prisma.user.updateMany({
        where: { id: { in: otherAdmins.map((a) => a.id) } },
        data: { isActive: true },
      });
      await prisma.user.delete({ where: { id: tempAdmin.id } });
    }
  });

  // API-21: Admin resets user initial password
  it("API-21: Admin resets user initial password returns 200 OK with mustChangePassword=true", async () => {
    const emailToReset = `reset.target.${Date.now()}@example.com`;
    const createRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Reset Target",
        email: emailToReset,
        role: "REQUESTER",
        isActive: true,
      });

    const targetUserId = createRes.body.data.id;

    // First, user logs in and updates password to clear mustChangePassword
    await getPrisma().user.update({
      where: { id: targetUserId },
      data: { mustChangePassword: false },
    });

    const resetRes = await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        initialPassword: "NewTempPassword123!",
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.data.mustChangePassword).toBe(true);

    // Verify user can login with new temporary password
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: emailToReset,
        password: "NewTempPassword123!",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);
  });
});
