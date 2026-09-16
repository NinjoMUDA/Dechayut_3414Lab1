import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 IT Staff Ticket Queue API — GET /api/staff/tickets", () => {
  let staffToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // Login as IT Staff (Michael Brown)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: "Password123!" });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;

    // Login as Requester (Jennifer Anderson)
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: "Password123!" });
    expect(reqLogin.status).toBe(200);
    requesterToken = reqLogin.body.data.token;
  });

  it("API-10: IT Staff can query the ticket queue with pagination metadata", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?page=1&pageSize=5")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(5);
    expect(typeof res.body.pagination.total).toBe("number");
    expect(typeof res.body.pagination.totalPages).toBe("number");

    if (res.body.data.length > 0) {
      const ticket = res.body.data[0];
      expect(ticket).toHaveProperty("ticketNumber");
      expect(ticket).toHaveProperty("summary");
      expect(ticket).toHaveProperty("category");
      expect(ticket).toHaveProperty("requestedPriority");
      expect(ticket).toHaveProperty("currentStatus");
      expect(ticket).toHaveProperty("requester");
    }
  });

  it("API-10: Search parameter filters tickets by ticket number or summary", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?search=VPN")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((t: any) => {
      const match =
        t.ticketNumber.toLowerCase().includes("vpn") ||
        t.summary.toLowerCase().includes("vpn");
      expect(match).toBe(true);
    });
  });

  it("API-10: Status filter returns only matching status tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?status=NEW")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((t: any) => {
      expect(t.currentStatus).toBe("NEW");
    });
  });

  it("API-10: Assignment filter 'unassigned' returns only unassigned tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?ownerId=unassigned")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((t: any) => {
      expect(t.ticketOwnerId).toBeNull();
    });
  });

  it("API-10: Sorting by createdAt asc returns tickets in ascending order", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?sortBy=createdAt&sortOrder=asc&pageSize=10")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    if (res.body.data.length >= 2) {
      const d1 = new Date(res.body.data[0].createdAt).getTime();
      const d2 = new Date(res.body.data[1].createdAt).getTime();
      expect(d1).toBeLessThanOrEqual(d2);
    }
  });

  it("Requester role is forbidden (403) from accessing IT Staff ticket queue", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("Unauthenticated request receives 401 Unauthorized", async () => {
    const res = await request(app).get("/api/staff/tickets");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

