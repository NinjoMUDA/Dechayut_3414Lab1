import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 4 - IT Staff Dashboard API (Issue #45 - FR-09, AC-07)", () => {
  const validPassword = "Password123!";
  let staffToken: string;
  let staffId: number;
  let adminToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // 1. Authenticate IT Staff (Michael Brown)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: validPassword });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;
    staffId = staffLogin.body.data.user.id;

    // 2. Authenticate Admin (Sarah Chen)
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "john.smith@toktickit.com", password: validPassword });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.token;

    // 3. Authenticate Requester (Jennifer Anderson)
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: validPassword });
    expect(reqLogin.status).toBe(200);
    requesterToken = reqLogin.body.data.token;
  });

  it("API-07: Returns IT Staff metrics, priority breakdown, and recent tickets", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("priorityBreakdown");
    expect(res.body).toHaveProperty("recentQueueTickets");

    const { metrics, priorityBreakdown, recentQueueTickets } = res.body;

    // Metric counts
    expect(typeof metrics.newTickets).toBe("number");
    expect(typeof metrics.openTickets).toBe("number");
    expect(typeof metrics.inProgress).toBe("number");
    expect(typeof metrics.waitingForRequester).toBe("number");
    expect(typeof metrics.myAssigned).toBe("number");
    expect(typeof metrics.unassigned).toBe("number");

    // Priority breakdown
    expect(typeof priorityBreakdown.URGENT).toBe("number");
    expect(typeof priorityBreakdown.HIGH).toBe("number");
    expect(typeof priorityBreakdown.MEDIUM).toBe("number");
    expect(typeof priorityBreakdown.LOW).toBe("number");

    // Recent queue tickets
    expect(Array.isArray(recentQueueTickets)).toBe(true);
    expect(recentQueueTickets.length).toBeLessThanOrEqual(5);
    if (recentQueueTickets.length > 0) {
      const first = recentQueueTickets[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("ticketNumber");
      expect(first).toHaveProperty("summary");
      expect(first).toHaveProperty("currentStatus");
      expect(first).toHaveProperty("updatedAt");
    }
  });

  it("API-07: Returns adminStats when accessed by Admin", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("adminStats");
    expect(typeof res.body.adminStats.totalUsers).toBe("number");
    expect(typeof res.body.adminStats.activeUsers).toBe("number");
    expect(res.body.adminStats.totalUsers).toBeGreaterThanOrEqual(res.body.adminStats.activeUsers);
  });

  it("Rejects Requester access with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });

  it("Rejects unauthenticated access with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboards/staff");
    expect(res.status).toBe(401);
  });
});
