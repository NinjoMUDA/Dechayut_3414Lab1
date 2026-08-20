import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail.js";
import * as api from "../../src/api.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  isActive: true,
};

const mockTicketDetail: api.Ticket = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 7,
  summary: "Laptop battery drains quickly",
  description: "Detailed description about battery discharge.",
  requestedPriority: "MEDIUM",
  itPriority: "MEDIUM",
  currentStatus: "NEW",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: 2, name: "Hardware" },
  relatedSystem: { id: 7, name: "Corporate Laptop" },
  requester: mockRequester,
  attachments: [
    {
      id: 1,
      ticketId: 101,
      originalFilename: "battery_diagnostic.pdf",
      fileSize: 102400,
      mimeType: "application/pdf",
      isRemoved: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

describe("RequesterTicketDetail Component", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
  });

  it("renders read-only ticket details and attachment section", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValueOnce(mockTicketDetail);

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={101} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000101").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
      expect(screen.getByText("Detailed description about battery discharge.")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
      expect(screen.getByText("battery_diagnostic.pdf")).toBeInTheDocument();
    });
  });

  it("displays Access Restricted error when unauthorized (403)", async () => {
    vi.spyOn(api, "getTicketDetail").mockRejectedValueOnce(
      new Error("You do not have permission to view this ticket")
    );

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={999} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.getByText(/You do not have permission to view this ticket/i)).toBeInTheDocument();
    });
  });
});
