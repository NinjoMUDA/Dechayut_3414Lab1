import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 Issue 4 — My Tickets Query API (GET /api/tickets)", () => {
  let requester1Id: number;
  let requester2Id: number;
  let category1Id: number;
  let category2Id: number;
  let systemId: number;

  beforeAll(async () => {
    // 1. Fetch requesters
    const reqRes = await request(app).get("/api/requesters");
    expect(reqRes.status).toBe(200);
    requester1Id = reqRes.body[0].id;
    requester2Id = reqRes.body[1].id;

    // 2. Fetch categories & systems
    const catRes = await request(app).get("/api/categories");
    expect(catRes.status).toBe(200);
    category1Id = catRes.body[0].id;
    category2Id = catRes.body[1].id;

    const sysRes = await request(app).get("/api/related-systems");
    expect(sysRes.status).toBe(200);
    systemId = sysRes.body[0].id;

    // 3. Create sample tickets for Requester 1
    const p1 = await request(app).post("/api/tickets").send({
      requesterId: requester1Id,
      categoryId: category1Id,
      relatedSystemId: systemId,
      summary: "Requester1 Hardware Ticket Alpha Printer",
      description: "Detailed description for ticket alpha on printer hardware.",
      requestedPriority: "HIGH",
    });
    if (p1.status !== 201) console.error("P1 error:", p1.body);

    const p2 = await request(app).post("/api/tickets").send({
      requesterId: requester1Id,
      categoryId: category2Id,
      relatedSystemId: systemId,
      summary: "Requester1 Software Ticket Beta Network",
      description: "Detailed description for ticket beta on software network.",
      requestedPriority: "LOW",
    });
    if (p2.status !== 201) console.error("P2 error:", p2.body);

    // 4. Create sample ticket for Requester 2
    const p3 = await request(app).post("/api/tickets").send({
      requesterId: requester2Id,
      categoryId: category1Id,
      relatedSystemId: systemId,
      summary: "Requester2 Private Ticket Gamma",
      description: "This ticket belongs strictly to requester 2.",
      requestedPriority: "URGENT",
    });
    if (p3.status !== 201) console.error("P3 error:", p3.body);
  });

  it("enforces multi-requester data isolation (Requester A sees only A's tickets)", async () => {
    // Query as Requester 1
    const res1 = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requester1Id));

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(Array.isArray(res1.body.data)).toBe(true);

    // Verify all tickets belong to Requester 1
    for (const ticket of res1.body.data) {
      expect(ticket.requesterId).toBe(requester1Id);
      expect(ticket.summary).not.toContain("Requester2 Private Ticket Gamma");
    }

    // Query as Requester 2
    const res2 = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(requester2Id));

    expect(res2.status).toBe(200);
    for (const ticket of res2.body.data) {
      expect(ticket.requesterId).toBe(requester2Id);
      expect(ticket.summary).not.toContain("Requester1 Hardware Ticket Alpha");
    }
  });

  it("supports keyword search across summary and ticketNumber", async () => {
    const res = await request(app)
      .get("/api/tickets?search=printer")
      .set("x-requester-id", String(requester1Id));

    if (res.body.data.length === 0) {
      console.log("Search result empty. Debug query response:", res.body);
      const allRes = await request(app).get("/api/tickets").set("x-requester-id", String(requester1Id));
      console.log("All tickets for req 1:", allRes.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].summary).toContain("Printer");
  });

  it("supports filtering by category and requested priority", async () => {
    const res = await request(app)
      .get(`/api/tickets?categoryId=${category1Id}&requestedPriority=HIGH`)
      .set("x-requester-id", String(requester1Id));

    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      expect(ticket.categoryId).toBe(category1Id);
      expect(ticket.requestedPriority).toBe("HIGH");
    }
  });

  it("supports pagination with correct page metadata", async () => {
    const res = await request(app)
      .get("/api/tickets?page=1&limit=1")
      .set("x-requester-id", String(requester1Id));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(1);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("returns 400 Bad Request if requesterId is omitted", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Requester ID is required");
  });
});
