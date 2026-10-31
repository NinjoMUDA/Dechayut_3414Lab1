import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";
import { Ticket, User } from "../../src/types/index.js";

const mockStaffUser: User = {
  id: 1,
  name: "Sarah Chen",
  email: "sarah@toktickit.com",
  role: "IT_STAFF",
  isActive: true,
};

// Mock AuthContext
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: mockStaffUser,
    token: "mock-token",
    isAuthenticated: true,
  }),
}));

describe("E2E-02: Ticket Resolution Lifecycle & Resolution Gate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "apiGetComments").mockResolvedValue([]);
    vi.spyOn(api, "apiGetNotes").mockResolvedValue([]);
    vi.spyOn(api, "apiGetStaffUsers").mockResolvedValue([mockStaffUser]);
    vi.spyOn(api, "apiGetActionsTaken").mockResolvedValue({ ticketId: 101, actions: [] });
  });

  it("completes ticket lifecycle from NEW -> IN_PROGRESS -> RESOLVED with resolution gate", async () => {
    let currentTicket: Ticket = {
      id: 101,
      ticketNumber: "TCK-2026-000101",
      summary: "Workstation monitor displays blue lines",
      description: "External monitor shows artifacts after graphics driver update.",
      requesterId: 10,
      categoryId: 1,
      relatedSystemId: 1,
      requestedPriority: "MEDIUM",
      itPriority: "HIGH",
      currentStatus: "NEW",
      ticketOwnerId: null,
      ticketOwner: null,
      requesterResolved: false,
      resolutionSummary: null,
      createdAt: "2026-09-24T08:00:00.000Z",
      updatedAt: "2026-09-24T08:00:00.000Z",
      requester: { id: 10, name: "Alice Requester", email: "alice@example.com" },
      category: { id: 1, name: "Hardware" },
      relatedSystem: { id: 1, name: "Corporate Laptop" },
      attachments: [],
    };

    vi.spyOn(api, "getTicketDetail").mockImplementation(async () => currentTicket);

    const updateStaffTicketSpy = vi.spyOn(api, "apiUpdateStaffTicket").mockImplementation(
      async (tId, payload, _token) => {
        currentTicket = {
          ...currentTicket,
          ticketOwnerId: payload.ticketOwnerId !== undefined ? payload.ticketOwnerId : currentTicket.ticketOwnerId,
          itPriority: payload.itPriority || currentTicket.itPriority,
          currentStatus: payload.currentStatus || currentTicket.currentStatus,
          resolutionSummary: payload.resolutionSummary !== undefined ? payload.resolutionSummary : currentTicket.resolutionSummary,
          updatedAt: new Date().toISOString(),
        };
        return currentTicket;
      }
    );

    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    // 1. Initial load
    await waitFor(() => {
      expect(screen.getByText("TCK-2026-000101")).toBeInTheDocument();
      expect(screen.getByText("NEW")).toBeInTheDocument();
    });

    // 2. Claim Ticket
    const claimBtn = screen.getByRole("button", { name: /Claim Ticket/i });
    fireEvent.click(claimBtn);

    // 3. Transition to IN_PROGRESS
    const statusSelect = screen.getByLabelText("Status Transition");
    fireEvent.change(statusSelect, { target: { value: "IN_PROGRESS" } });

    const saveOpsBtn = screen.getByRole("button", { name: /Save Operational Changes/i });
    fireEvent.click(saveOpsBtn);

    await waitFor(() => {
      expect(updateStaffTicketSpy).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          ticketOwnerId: 1,
          currentStatus: "IN_PROGRESS",
        }),
        "mock-token"
      );
    });

    // 4. Try transitioning to RESOLVED without resolution summary
    fireEvent.change(statusSelect, { target: { value: "RESOLVED" } });
    fireEvent.click(saveOpsBtn);

    // Verify resolution gate error
    await waitFor(() => {
      expect(screen.getByText(/Resolution summary is required when resolving a ticket/i)).toBeInTheDocument();
    });

    // 5. Fill resolution summary and save
    const resolutionInput = screen.getByLabelText(/Resolution Summary/i);
    fireEvent.change(resolutionInput, {
      target: { value: "Rolled back graphics card driver to v531.18 and verified display stability." },
    });

    fireEvent.click(saveOpsBtn);

    await waitFor(() => {
      expect(updateStaffTicketSpy).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          currentStatus: "RESOLVED",
          resolutionSummary: "Rolled back graphics card driver to v531.18 and verified display stability.",
        }),
        "mock-token"
      );
    });
  });
});
