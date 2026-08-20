import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 Issue 5 — Ticket Detail API (GET /api/tickets/:id)", () => {
  let requester1Id: number;
  let requester2Id: number;
  let ownedTicketId: number;

  beforeAll(async () => {
    // 1. Fetch requesters
    const reqRes = await request(app).get("/api/requesters");
    requester1Id = reqRes.body[0].id;
    requester2Id = reqRes.body[1].id;

    const catRes = await request(app).get("/api/categories");
    const sysRes = await request(app).get("/api/related-systems");

    // 2. Create ticket for requester 1
    const createRes = await request(app).post("/api/tickets").send({
      requesterId: requester1Id,
      categoryId: catRes.body[0].id,
      relatedSystemId: sysRes.body[0].id,
      summary: "Owned Ticket for Detail Retrieval",
      description: "Testing read-only detail view and ownership isolation.",
      requestedPriority: "HIGH",
    });

    ownedTicketId = createRes.body.data.id;
  });

  it("retrieves full details of an owned ticket (200)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ownedTicketId}`)
      .set("x-requester-id", String(requester1Id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(ownedTicketId);
    expect(res.body.data.summary).toBe("Owned Ticket for Detail Retrieval");
    expect(res.body.data.category).toBeDefined();
    expect(res.body.data.relatedSystem).toBeDefined();
    expect(res.body.data.requester.id).toBe(requester1Id);
    expect(Array.isArray(res.body.data.attachments)).toBe(true);
  });

  it("blocks unauthorized access to another requester's ticket (403)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ownedTicketId}`)
      .set("x-requester-id", String(requester2Id));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("permission");
  });

  it("returns 404 for non-existent ticket ID", async () => {
    const res = await request(app)
      .get("/api/tickets/999999")
      .set("x-requester-id", String(requester1Id));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
