import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Authorization & Access Control API", () => {
  const validPassword = "Password123!";

  it("API-06: Unauthenticated access to protected route returns 401 Unauthorized", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Authentication required/i);
  });

  it("API-09: Requester accessing another requester's ticket returns 403 Forbidden", async () => {
    // 1. Login as Jennifer Anderson (Requester 1)
    const jenniferLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: validPassword });
    const jenniferToken = jenniferLogin.body.data.token;

    // 2. Login as David Lee (Requester 2)
    const davidLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "david.lee@example.com", password: validPassword });
    const davidToken = davidLogin.body.data.token;

    // 3. Create a ticket as Jennifer
    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${jenniferToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Private Access Ticket for Jennifer",
        description: "This ticket belongs exclusively to Jennifer Anderson.",
        requestedPriority: "LOW",
      });

    expect(ticketRes.status).toBe(201);
    const jenniferTicketId = ticketRes.body.data.id;

    // 4. Jennifer can access her own ticket
    const ownAccess = await request(app)
      .get(`/api/tickets/${jenniferTicketId}`)
      .set("Authorization", `Bearer ${jenniferToken}`);
    expect(ownAccess.status).toBe(200);

    // 5. David cannot access Jennifer's ticket (403 Forbidden)
    const forbiddenAccess = await request(app)
      .get(`/api/tickets/${jenniferTicketId}`)
      .set("Authorization", `Bearer ${davidToken}`);
    expect(forbiddenAccess.status).toBe(403);
  });
});
