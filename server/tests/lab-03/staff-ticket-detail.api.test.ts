import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Staff Ticket Detail & Operations API (API-11, API-12, API-13)", () => {
  let staffToken: string;
  let staffId: number;
  let adminToken: string;
  let requesterToken: string;
  let requesterId: number;
  let testTicketId: number;

  beforeAll(async () => {
    // Login as IT Staff (Michael Brown)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: "Password123!" });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;
    staffId = staffLogin.body.data.user.id;

    // Login as Admin
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin.support@toktickit.com", password: "Password123!" });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.token;

    // Login as Requester (Jennifer Anderson)
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: "Password123!" });
    expect(reqLogin.status).toBe(200);
    requesterToken = reqLogin.body.data.token;
    requesterId = reqLogin.body.data.user.id;

    // Create a fresh ticket for operations tests
    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        requesterId,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Operations Test Ticket - Mouse not working",
        description: "The wireless optical mouse does not register clicks properly.",
        requestedPriority: "MEDIUM",
      });
    expect(ticketRes.status).toBe(201);
    testTicketId = ticketRes.body.data.id;
  });

  it("GET /api/staff/users returns active IT Staff and Admin users", async () => {
    const res = await request(app)
      .get("/api/staff/users")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((u: any) => {
      expect(["IT_STAFF", "ADMIN"]).toContain(u.role);
    });
  });

  it("API-11: IT Staff can claim and reassign ticket ownership", async () => {
    // 1. Claim ticket (assign to Michael Brown)
    const claimRes = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ ticketOwnerId: staffId });

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.success).toBe(true);
    expect(claimRes.body.data.ticketOwnerId).toBe(staffId);
    expect(claimRes.body.data.ticketOwner.id).toBe(staffId);

    // 2. Reassign to Lisa Martinez (or unassign)
    const unassignRes = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ ticketOwnerId: null });

    expect(unassignRes.status).toBe(200);
    expect(unassignRes.body.data.ticketOwnerId).toBeNull();
  });

  it("API-12: IT Staff updates IT Priority while requestedPriority remains unchanged", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ itPriority: "URGENT" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.itPriority).toBe("URGENT");
    expect(res.body.data.requestedPriority).toBe("MEDIUM");
  });

  it("API-13: Permitted status transition from NEW to IN_PROGRESS succeeds (200 OK)", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ currentStatus: "IN_PROGRESS" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentStatus).toBe("IN_PROGRESS");
  });

  it("API-13: Invalid status transition is rejected with 400 Bad Request", async () => {
    // Current status is IN_PROGRESS. Transition directly to CLOSED is not allowed in BR-14
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ currentStatus: "CLOSED" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Invalid status transition/i);
  });

  it("Requester problem resolution indicator can be updated via PATCH /api/tickets/:id/resolve", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/resolve`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ requesterResolved: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requesterResolved).toBe(true);
  });
});
