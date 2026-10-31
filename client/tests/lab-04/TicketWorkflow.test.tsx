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

const baseTicket: Ticket = {
  id: 101,
  ticketNumber: "TCK-20260924-00101",
  summary: "VPN Connection drops frequently",
  description: "User gets disconnected from corporate VPN every 15 minutes.",
  requesterId: 10,
  categoryId: 1,
  relatedSystemId: 1,
  requestedPriority: "MEDIUM",
  itPriority: "HIGH",
  currentStatus: "NEW",
  ticketOwnerId: 1,
  requesterResolved: false,
  createdAt: "2026-09-24T08:00:00.000Z",
  updatedAt: "2026-09-24T09:00:00.000Z",
  requester: { id: 10, name: "Alice Requester", email: "alice@example.com" },
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 1, name: "Global VPN" },
  ticketOwner: { id: 1, name: "Sarah Chen", email: "sarah@toktickit.com" },
  attachments: [],
};

// Mock AuthContext
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: mockStaffUser,
    token: "mock-token",
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("Ticket Workflow & State Transitions (Lab 4 - Issue #44)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "apiGetComments").mockResolvedValue([]);
    vi.spyOn(api, "apiGetNotes").mockResolvedValue([]);
    vi.spyOn(api, "apiGetStaffUsers").mockResolvedValue([
      mockStaffUser,
      { id: 2, name: "Inactive Bob", email: "bob@example.com", role: "IT_STAFF", isActive: false },
    ]);
    vi.spyOn(api, "apiGetActionsTaken").mockResolvedValue({ ticketId: 101, actions: [] });
  });

  it("UI-06a: Ticket Workflow control permits only valid transitions from NEW", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue({
      ...baseTicket,
      currentStatus: "NEW",
    });

    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText("TCK-20260924-00101")).toBeInTheDocument();
    });

    // Check status transition dropdown options for NEW
    const select = screen.getByLabelText("Status Transition") as HTMLSelectElement;
    expect(select).not.toBeDisabled();

    const options = Array.from(select.options).map((opt) => opt.value);
    expect(options).toEqual(["NEW", "OPEN", "IN_PROGRESS", "CANCELLED"]);
    expect(options).not.toContain("RESOLVED");
    expect(options).not.toContain("CLOSED");
    expect(options).not.toContain("REOPENED");
  });

  it("UI-06b: Ticket Workflow disables status selection when ticket is in terminal CLOSED state", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue({
      ...baseTicket,
      id: 102,
      currentStatus: "CLOSED",
    });

    render(<StaffTicketDetail ticketId={102} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("This ticket is in a terminal state. No further transitions permitted.")).toBeInTheDocument();
    });

    const terminalSelect = screen.getByLabelText("Status Transition") as HTMLSelectElement;
    expect(terminalSelect).toBeDisabled();
  });

  it("UI-07: Reopen action button visibility and transition on RESOLVED ticket updates badge to REOPENED with cyan class", async () => {
    const resolvedTicket: Ticket = {
      ...baseTicket,
      currentStatus: "RESOLVED",
      resolutionSummary: "Updated VPN client certificates and re-authenticated user.",
    };

    const reopenedTicket: Ticket = {
      ...resolvedTicket,
      currentStatus: "REOPENED",
      updatedAt: "2026-09-24T10:00:00.000Z",
    };

    let callCount = 0;
    vi.spyOn(api, "getTicketDetail").mockImplementation(async () => {
      callCount++;
      return callCount === 1 ? resolvedTicket : reopenedTicket;
    });

    const updateStatusSpy = vi.spyOn(api, "apiUpdateTicketStatus").mockResolvedValue({
      ticketId: 101,
      ticketNumber: "TCK-20260924-00101",
      currentStatus: "REOPENED",
      resolutionSummary: resolvedTicket.resolutionSummary,
      updatedAt: "2026-09-24T10:00:00.000Z",
    });

    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    // Wait for resolved ticket to load
    await waitFor(() => {
      expect(screen.getByText("TCK-20260924-00101")).toBeInTheDocument();
      expect(screen.getByText("RESOLVED")).toBeInTheDocument();
    });

    // Check Reopen button is present
    const reopenBtn = screen.getByTestId("reopen-ticket-btn");
    expect(reopenBtn).toBeInTheDocument();
    expect(reopenBtn).toHaveTextContent("Reopen Ticket");

    // Click Reopen Ticket
    fireEvent.click(reopenBtn);

    // Verify API called with REOPENED and clientUpdatedAt
    await waitFor(() => {
      expect(updateStatusSpy).toHaveBeenCalledWith(
        101,
        "REOPENED",
        undefined,
        resolvedTicket.updatedAt,
        "mock-token"
      );
    });

    // Verify ticket reloads and status badge reflects REOPENED with badge-status-reopened
    await waitFor(() => {
      const reopenedBadge = screen.getByText("REOPENED");
      expect(reopenedBadge).toBeInTheDocument();
      expect(reopenedBadge).toHaveClass("badge-status-reopened");
    });
  });
});
