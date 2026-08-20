import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 Issue 3 — Create Ticket API (POST /api/tickets)", () => {
  it("creates a valid ticket and returns 201 with unique ticket number and status NEW", async () => {
    // 1. Fetch valid reference data
    const reqRes = await request(app).get("/api/requesters");
    const activeRequester = reqRes.body[0];

    const catRes = await request(app).get("/api/categories");
    const category = catRes.body[0];

    const sysRes = await request(app).get("/api/related-systems");
    const system = sysRes.body[0];

    const ticketPayload = {
      requesterId: activeRequester.id,
      categoryId: category.id,
      relatedSystemId: system.id,
      summary: "Laptop battery drains quickly after update",
      description: "After installing the latest Windows patch, the battery drains within 45 minutes.",
      requestedPriority: "HIGH",
    };

    const res = await request(app)
      .post("/api/tickets")
      .send(ticketPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const created = res.body.data;
    expect(created.id).toBeDefined();
    expect(created.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(created.summary).toBe("Laptop battery drains quickly after update");
    expect(created.currentStatus).toBe("NEW");
    expect(created.requestedPriority).toBe("HIGH");
    expect(created.requesterId).toBe(activeRequester.id);
    expect(created.category.id).toBe(category.id);
    expect(created.relatedSystem.id).toBe(system.id);
  });

  it("rejects ticket creation with empty/invalid summary or description (400)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "   ",
        description: "short",
        requestedPriority: "MEDIUM",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Validation Error");
    expect(res.body.details).toHaveProperty("summary");
    expect(res.body.details).toHaveProperty("description");
  });

  it("rejects ticket creation when requester is missing or inactive (400)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: 99999, // Non-existent
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Valid summary for testing",
        description: "Valid description for testing with enough characters",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toHaveProperty("requesterId");
  });
});
