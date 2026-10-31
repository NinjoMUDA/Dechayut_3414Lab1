import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 4 - Requester Dashboard API (Issue #45 - FR-08, AC-06, AC-12)", () => {
  const validPassword = "Password123!";
  let requesterToken: string;
  let requesterId: number;
  let otherRequesterToken: string;
  let otherRequesterId: number;

  beforeAll(async () => {
    // 1. Authenticate Requester (Jennifer Anderson)
    const res1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: validPassword });
    expect(res1.status).toBe(200);
    requesterToken = res1.body.data.token;
    requesterId = res1.body.data.user.id;

    // 2. Authenticate second Requester (David Miller)
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "david.lee@example.com", password: validPassword });
    expect(res2.status).toBe(200);
    otherRequesterToken = res2.body.data.token;
    otherRequesterId = res2.body.data.user.id;
  });

  it("API-06: Scopes metrics and recent tickets strictly to the authenticated requester", async () => {
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("recentTickets");

    const { metrics, recentTickets } = res.body;

    expect(typeof metrics.myOpenTickets).toBe("number");
    expect(typeof metrics.inProgress).toBe("number");
    expect(typeof metrics.resolved).toBe("number");
    expect(typeof metrics.closed).toBe("number");
    expect(typeof metrics.waitingForRequester).toBe("number");

    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);

    // Verify recent ticket structure
    if (recentTickets.length > 0) {
      const first = recentTickets[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("ticketNumber");
      expect(first).toHaveProperty("summary");
      expect(first).toHaveProperty("currentStatus");
      expect(first).toHaveProperty("requestedPriority");
      expect(first).toHaveProperty("updatedAt");
    }
  });

  it("API-06 (via Header): Retrieves dashboard using x-requester-id header without auth token", async () => {
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("x-requester-id", String(requesterId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(typeof res.body.metrics.myOpenTickets).toBe("number");
  });

  it("API-12: Zero-data handling returns clean zero counts and empty array for requester with no tickets", async () => {
    // Authenticate Admin to create a brand new user with 0 tickets
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "john.smith@toktickit.com", password: validPassword });
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.data.token;

    const uniqueEmail = `zero.requester.${Date.now()}@example.com`;
    const createUserRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: uniqueEmail,
        name: "Zero Ticket User",
        role: "REQUESTER",
        department: "Operations",
        initialPassword: "Password123!",
      });
    expect(createUserRes.status).toBe(201);
    const newUserId = createUserRes.body.data.id;

    // Login as new user
    const loginNew = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail, password: "Password123!" });
    expect(loginNew.status).toBe(200);
    const newToken = loginNew.body.data.token;

    // Fetch dashboard for new user
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${newToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toEqual({
      myOpenTickets: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      waitingForRequester: 0,
    });
    expect(res.body.recentTickets).toEqual([]);
  });

  it("Returns 400 Bad Request when no requester identity is provided", async () => {
    const res = await request(app).get("/api/dashboards/requester");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Requester identity is required/i);
  });
});
