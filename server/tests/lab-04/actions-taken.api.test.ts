import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 4 - Actions Taken Foundation & REST APIs (Issue #42)", () => {
  const validPassword = "Password123!";
  let staffToken: string;
  let requesterToken: string;
  let otherRequesterToken: string;
  let requesterTicketId: number;
  let otherTicketId: number;

  beforeAll(async () => {
    // 1. Authenticate IT Staff (Michael Brown)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: validPassword });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;

    // 2. Authenticate Requester (Jennifer Anderson)
    const requesterLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: validPassword });
    expect(requesterLogin.status).toBe(200);
    requesterToken = requesterLogin.body.data.token;

    // 3. Authenticate Other Requester (David Lee)
    const otherLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "david.lee@example.com", password: validPassword });
    expect(otherLogin.status).toBe(200);
    otherRequesterToken = otherLogin.body.data.token;

    // 4. Create a ticket for Jennifer
    const tktRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Test Ticket for Actions Taken",
        description: "Testing actions taken foundation under Jennifer Anderson.",
        requestedPriority: "MEDIUM",
      });
    expect(tktRes.status).toBe(201);
    requesterTicketId = tktRes.body.data.id;

    // 5. Create a ticket for David
    const otherTktRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${otherRequesterToken}`)
      .send({
        categoryId: 2,
        relatedSystemId: 2,
        summary: "David's Private Ticket for Isolation Test",
        description: "Actions taken under this ticket should be forbidden for Jennifer.",
        requestedPriority: "HIGH",
      });
    expect(otherTktRes.status).toBe(201);
    otherTicketId = otherTktRes.body.data.id;
  });

  it("API-01 (AC-01): IT Staff creates a valid Action Taken under accessible ticket", async () => {
    const res = await request(app)
      .post(`/api/tickets/${requesterTicketId}/actions`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        actionDateTime: "2026-09-24T10:30:00.000Z",
        description: "Inspected network cable and replaced RJ-45 connector.",
        result: "Link light restored and ping latency dropped to 2ms.",
        followUpRequired: true,
        followUpNote: "Check connection stability again after 24 hours.",
        attachmentNotes: "network_diagnostics.txt",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.ticketId).toBe(requesterTicketId);
    expect(res.body.description).toBe("Inspected network cable and replaced RJ-45 connector.");
    expect(res.body.result).toBe("Link light restored and ping latency dropped to 2ms.");
    expect(res.body.followUpRequired).toBe(true);
    expect(res.body.followUpNote).toBe("Check connection stability again after 24 hours.");
    expect(res.body.attachmentNotes).toBe("network_diagnostics.txt");
    expect(res.body.performedBy).toBeDefined();
    expect(res.body.performedBy.email).toBe("michael.brown@toktickit.com");
  });

  it("API-02 (AC-02): Requester attempts to create Action Taken and is blocked with 403 Forbidden", async () => {
    const res = await request(app)
      .post(`/api/tickets/${requesterTicketId}/actions`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        description: "Requester trying to record action.",
        result: "Should not be permitted.",
        followUpRequired: false,
      });

    expect(res.status).toBe(403);
  });

  it("API-03 (AC-03): Create Action Taken with followUpRequired=true and missing followUpNote returns 400", async () => {
    const res = await request(app)
      .post(`/api/tickets/${requesterTicketId}/actions`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        description: "Replaced hardware component without specifying note.",
        result: "Unit powers on.",
        followUpRequired: true,
        followUpNote: "", // Blank note when followUpRequired is true
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
    expect(res.body.message).toMatch(/follow-up note is required/i);
  });

  it("API-04 (AC-04): Requester retrieves Actions Taken for owned ticket successfully", async () => {
    const res = await request(app)
      .get(`/api/tickets/${requesterTicketId}/actions`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ticketId).toBe(requesterTicketId);
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.actions[0].description).toBe("Inspected network cable and replaced RJ-45 connector.");
    expect(res.body.actions[0].performedBy).toBeDefined();
  });

  it("API-05 (AC-05): Requester attempting to view Actions Taken on another user's ticket receives 403 Forbidden", async () => {
    const res = await request(app)
      .get(`/api/tickets/${otherTicketId}/actions`)
      .set("Authorization", `Bearer ${requesterToken}`); // Jennifer accessing David's ticket

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("PATCH: IT Staff can update an existing Action Taken record", async () => {
    // 1. First get actions on requesterTicketId to find the action ID
    const listRes = await request(app)
      .get(`/api/tickets/${requesterTicketId}/actions`)
      .set("Authorization", `Bearer ${staffToken}`);
    const actionId = listRes.body.actions[0].id;

    // 2. Update the action
    const patchRes = await request(app)
      .patch(`/api/tickets/${requesterTicketId}/actions/${actionId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        result: "Updated result: Ping latency is now rock solid at 1ms with 0 packet loss.",
        followUpRequired: false,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.id).toBe(actionId);
    expect(patchRes.body.result).toContain("rock solid at 1ms");
    expect(patchRes.body.followUpRequired).toBe(false);
    expect(patchRes.body.followUpNote).toBeNull();
  });

  it("PATCH: Requester attempting to update Action Taken receives 403 Forbidden", async () => {
    const listRes = await request(app)
      .get(`/api/tickets/${requesterTicketId}/actions`)
      .set("Authorization", `Bearer ${staffToken}`);
    const actionId = listRes.body.actions[0].id;

    const patchRes = await request(app)
      .patch(`/api/tickets/${requesterTicketId}/actions/${actionId}`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        result: "Requester trying to tamper with result.",
      });

    expect(patchRes.status).toBe(403);
  });
});
