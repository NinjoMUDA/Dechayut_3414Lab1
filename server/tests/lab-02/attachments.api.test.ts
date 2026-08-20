import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 Issue 5 — Attachment Lifecycle API", () => {
  let requesterId: number;
  let ticketId: number;
  let createdAttachmentId: number;

  beforeAll(async () => {
    // 1. Fetch active requester
    const reqRes = await request(app).get("/api/requesters");
    requesterId = reqRes.body[0].id;

    const catRes = await request(app).get("/api/categories");
    const sysRes = await request(app).get("/api/related-systems");

    // 2. Create ticket
    const ticketRes = await request(app).post("/api/tickets").send({
      requesterId,
      categoryId: catRes.body[0].id,
      relatedSystemId: sysRes.body[0].id,
      summary: "Ticket for Attachment Lifecycle Testing",
      description: "Testing upload, download, and soft removal of attachments.",
      requestedPriority: "MEDIUM",
    });

    ticketId = ticketRes.body.data.id;
  });

  it("uploads a valid permitted image attachment (201)", async () => {
    const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterId))
      .attach("file", pngBuffer, "screenshot.png");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.originalFilename).toBe("screenshot.png");
    expect(res.body.data.mimeType).toBe("image/png");
    expect(res.body.data.isRemoved).toBe(false);

    createdAttachmentId = res.body.data.id;
  });

  it("rejects non-permitted file extensions / MIME types (400)", async () => {
    const txtBuffer = Buffer.from("Hello world plain text");

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterId))
      .attach("file", txtBuffer, "malicious.txt");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid file type");
  });

  it("rejects file uploads exceeding 5 MB limit (400)", async () => {
    // 5.5 MB buffer
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterId))
      .attach("file", largeBuffer, "large_report.pdf");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/limit|exceed/i);
  });

  it("downloads an active attachment successfully (200)", async () => {
    const res = await request(app)
      .get(`/api/attachments/${createdAttachmentId}/download`)
      .set("x-requester-id", String(requesterId));

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("soft-removes an attachment with mandatory reason (200)", async () => {
    const res = await request(app)
      .patch(`/api/attachments/${createdAttachmentId}/soft-remove`)
      .set("x-requester-id", String(requesterId))
      .send({
        removalReason: "Uploaded outdated screenshot version by mistake",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRemoved).toBe(true);
    expect(res.body.data.removalReason).toBe("Uploaded outdated screenshot version by mistake");
    expect(res.body.data.removedAt).toBeDefined();
  });

  it("blocks download of soft-removed attachment (410 Gone)", async () => {
    const res = await request(app)
      .get(`/api/attachments/${createdAttachmentId}/download`)
      .set("x-requester-id", String(requesterId));

    expect(res.status).toBe(410);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("removed and cannot be downloaded");
  });
});
