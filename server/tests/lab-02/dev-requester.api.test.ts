import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 Issue 2 — Development Requester & Reference APIs", () => {
  it("GET /api/requesters returns only active Development Requesters", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    // Verify all returned requesters are active
    for (const requester of res.body) {
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
      expect(requester.isActive).toBe(true);
    }

    // Verify inactive requester is NOT returned
    const inactive = res.body.find((r: { name: string }) =>
      r.name.toLowerCase().includes("inactive")
    );
    expect(inactive).toBeUndefined();
  });

  it("GET /api/related-systems returns at least 6 IT systems in id order", async () => {
    const res = await request(app).get("/api/related-systems");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(6);

    const names = res.body.map((s: { name: string }) => s.name);
    expect(names).toContain("Email");
    expect(names).toContain("Campus Wi-Fi");
    expect(names).toContain("VPN");
    expect(names).toContain("LEB2 App");
    expect(names).toContain("Printer");
    expect(names).toContain("Corporate Laptop");
  });

  it("GET /api/categories returns the 4 required categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual([
      "Account and Access",
      "Hardware",
      "Software",
      "Network",
    ]);
  });
});
