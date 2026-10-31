import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 4 - Ticket Workflow, Resolution Gate & State Transitions (Issue #44)", () => {
  const validPassword = "Password123!";
  let staffToken: string;
  let testTicketId: number;
  let resolvedTicketId: number;
  let inactiveStaffId: number;

  beforeAll(async () => {
    // 1. Authenticate IT Staff (Michael Brown)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: validPassword });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;

    // 2. Authenticate Requester (Jennifer Anderson) to create tickets
    const requesterLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: validPassword });
    expect(requesterLogin.status).toBe(200);
    const requesterToken = requesterLogin.body.data.token;

    // 3. Create fresh ticket (Status: NEW)
    const newTktRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Ticket Workflow Test Ticket",
        description: "Testing state transitions, resolution gate, and concurrency conflict checks.",
        requestedPriority: "MEDIUM",
      });
    expect(newTktRes.status).toBe(201);
    testTicketId = newTktRes.body.data.id;

    // 4. Create another ticket and advance it to RESOLVED
    const resTktRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        categoryId: 2,
        relatedSystemId: 2,
        summary: "Reopen Flow Test Ticket",
        description: "Ticket to test reopening from RESOLVED status.",
        requestedPriority: "HIGH",
      });
    expect(resTktRes.status).toBe(201);
    resolvedTicketId = resTktRes.body.data.id;

    // Advance to IN_PROGRESS then RESOLVED
    await request(app)
      .patch(`/api/tickets/${resolvedTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ newStatus: "IN_PROGRESS" });

    await request(app)
      .patch(`/api/tickets/${resolvedTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "RESOLVED",
        resolutionSummary: "Initial issue resolved during setup.",
      });

    // 5. Get inactive staff ID (James Green)
    const usersRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${staffToken}`)
      .catch(() => null);

    // Login as Admin to query inactive staff ID
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "john.smith@toktickit.com", password: validPassword });
    const adminToken = adminLogin.body.data.token;

    const adminUsersRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    const inactiveUser = adminUsersRes.body.data.find(
      (u: any) => u.email === "james.green.inactive@toktickit.com"
    );
    expect(inactiveUser).toBeDefined();
    inactiveStaffId = inactiveUser.id;
  });

  it("API-08 (AC-08, FR-05): Direct transition from NEW to RESOLVED is rejected with 400 Bad Request", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "RESOLVED",
        resolutionSummary: "Premature resolution attempt.",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
    expect(res.body.message).toMatch(/Invalid status transition/i);
  });

  it("API-09 (AC-09, FR-06): Transition to RESOLVED without resolutionSummary is rejected with 400", async () => {
    // 1. Move from NEW -> IN_PROGRESS (valid)
    const progressRes = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ newStatus: "IN_PROGRESS" });
    expect(progressRes.status).toBe(200);

    // 2. Try to move to RESOLVED without summary
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "RESOLVED",
        resolutionSummary: "   ", // Blank summary
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
    expect(res.body.message).toMatch(/resolution summary is required/i);
  });

  it("API-10 (AC-10, FR-07): Status transition with stale clientUpdatedAt responds with 409 Conflict", async () => {
    const staleTimestamp = "2020-01-01T00:00:00.000Z";

    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "WAITING_FOR_REQUESTER",
        clientUpdatedAt: staleTimestamp,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
    expect(res.body.message).toMatch(/Ticket has been modified by another user/i);
  });

  it("API-11 (AC-11, FR-11): Assigning ticket to inactive user is rejected with 400 Bad Request", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/assign`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        ticketOwnerId: inactiveStaffId,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
    expect(res.body.message).toMatch(/Cannot assign ticket to an inactive user/i);
  });

  it("API-13 (BR-07, FR-05): Reopen flow from RESOLVED to REOPENED succeeds with 200 OK", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${resolvedTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "REOPENED",
      });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("REOPENED");
  });

  it("Terminal status: Transitioning from CLOSED is rejected with 400 Bad Request", async () => {
    // 1. Resolve test ticket with valid resolutionSummary
    const resolveRes = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "RESOLVED",
        resolutionSummary: "Properly resolved and tested cable connectivity.",
      });
    expect(resolveRes.status).toBe(200);

    // 2. Close the ticket
    const closeRes = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "CLOSED",
      });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.currentStatus).toBe("CLOSED");

    // 3. Attempting any transition from CLOSED must be rejected
    const blockedRes = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        newStatus: "OPEN",
      });
    expect(blockedRes.status).toBe(400);
    expect(blockedRes.body.message).toMatch(/terminal status/i);
  });
});
