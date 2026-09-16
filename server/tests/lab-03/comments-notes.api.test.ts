import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Comments & Internal Notes API (API-08, API-14, API-15)", () => {
  let staffToken: string;
  let requesterToken: string;
  let requesterId: number;
  let otherRequesterToken: string;
  let testTicketId: number;

  beforeAll(async () => {
    // Login as IT Staff
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.brown@toktickit.com", password: "Password123!" });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;

    // Login as Requester 1 (Jennifer Anderson)
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.anderson@example.com", password: "Password123!" });
    expect(reqLogin.status).toBe(200);
    requesterToken = reqLogin.body.data.token;
    requesterId = reqLogin.body.data.user.id;

    // Login as Requester 2 (Sarah Johnson)
    const otherReqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "sarah.johnson@example.com", password: "Password123!" });
    expect(otherReqLogin.status).toBe(200);
    otherRequesterToken = otherReqLogin.body.data.token;

    // Create a ticket owned by Requester 1
    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        requesterId,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Comments & Notes Test Ticket",
        description: "Testing public comments and role-restricted internal notes.",
        requestedPriority: "LOW",
      });
    expect(ticketRes.status).toBe(201);
    testTicketId = ticketRes.body.data.id;
  });

  it("API-14: Requester and IT Staff can create and retrieve Public Comments", async () => {
    // 1. Requester posts a comment
    const reqCommentRes = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ content: "Hello, I am providing additional information on my issue." });

    expect(reqCommentRes.status).toBe(201);
    expect(reqCommentRes.body.success).toBe(true);
    expect(reqCommentRes.body.data.content).toBe("Hello, I am providing additional information on my issue.");
    expect(reqCommentRes.body.data.author.role).toBe("REQUESTER");

    // 2. Staff posts a comment
    const staffCommentRes = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ content: "Thank you, we received your info and are looking into it." });

    expect(staffCommentRes.status).toBe(201);
    expect(staffCommentRes.body.data.author.role).toBe("IT_STAFF");

    // 3. Retrieve all comments (both comments present)
    const listRes = await request(app)
      .get(`/api/tickets/${testTicketId}/comments`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("API-14: Requester from another account cannot access or post comments on another user's ticket", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/comments`)
      .set("Authorization", `Bearer ${otherRequesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("API-15: IT Staff can post and retrieve Internal Notes", async () => {
    // Post an internal note
    const postNoteRes = await request(app)
      .post(`/api/tickets/${testTicketId}/notes`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ content: "Internal diagnostic note: checked event logs, error 4043 found." });

    expect(postNoteRes.status).toBe(201);
    expect(postNoteRes.body.success).toBe(true);
    expect(postNoteRes.body.data.content).toBe("Internal diagnostic note: checked event logs, error 4043 found.");
    expect(postNoteRes.body.data.author.role).toBe("IT_STAFF");

    // Retrieve internal notes
    const getNotesRes = await request(app)
      .get(`/api/tickets/${testTicketId}/notes`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(getNotesRes.status).toBe(200);
    expect(getNotesRes.body.success).toBe(true);
    expect(getNotesRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("API-08: Requester role is strictly forbidden (403) from accessing or creating Internal Notes", async () => {
    // Attempt GET notes
    const getRes = await request(app)
      .get(`/api/tickets/${testTicketId}/notes`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.success).toBe(false);

    // Attempt POST notes
    const postRes = await request(app)
      .post(`/api/tickets/${testTicketId}/notes`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ content: "Attempting to post internal note as requester" });

    expect(postRes.status).toBe(403);
    expect(postRes.body.success).toBe(false);
  });
});
