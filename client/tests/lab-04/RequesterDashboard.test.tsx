import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterDashboard } from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";
import { RequesterDashboardResponse } from "../../src/types/index.js";

const mockRequester = {
  id: 10,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
};

// Mock RequesterContext
vi.mock("../../src/context/RequesterContext.js", () => ({
  useRequester: () => ({
    activeRequester: mockRequester,
    setActiveRequester: vi.fn(),
    clearRequester: vi.fn(),
  }),
}));

// Mock AuthContext
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    token: "mock-requester-token",
    user: mockRequester,
    isAuthenticated: true,
  }),
}));

const mockDashboardData: RequesterDashboardResponse = {
  metrics: {
    myOpenTickets: 3,
    inProgress: 1,
    resolved: 2,
    closed: 5,
    waitingForRequester: 1,
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "VPN connection drops every 10 minutes",
      currentStatus: "IN_PROGRESS",
      requestedPriority: "HIGH",
      updatedAt: "2026-09-24T08:15:00.000Z",
    },
    {
      id: 102,
      ticketNumber: "TKT-2026-000102",
      summary: "Cannot access department shared drive",
      currentStatus: "RESOLVED",
      requestedPriority: "MEDIUM",
      updatedAt: "2026-09-24T09:30:00.000Z",
    },
  ],
};

describe("RequesterDashboard Component (Lab 4 - Issue #45 - UI-04)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-04: Renders greeting, 4 metric cards, and recent tickets with navigation callbacks", async () => {
    vi.spyOn(api, "apiGetRequesterDashboard").mockResolvedValue(mockDashboardData);

    const onSelectTicket = vi.fn();
    const onNavigateCreate = vi.fn();
    const onNavigateMyTickets = vi.fn();

    render(
      <RequesterDashboard
        onSelectTicket={onSelectTicket}
        onNavigateCreate={onNavigateCreate}
        onNavigateMyTickets={onNavigateMyTickets}
      />
    );

    // 1. Verify greeting
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Jennifer Anderson/i)).toBeInTheDocument();
    });

    // 2. Verify 4 metric cards
    expect(screen.getByTestId("metric-open-tickets")).toHaveTextContent("3");
    expect(screen.getByTestId("metric-in-progress")).toHaveTextContent("1");
    expect(screen.getByTestId("metric-resolved")).toHaveTextContent("2");
    expect(screen.getByTestId("metric-closed")).toHaveTextContent("5");

    // 3. Verify recent tickets
    expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
    expect(screen.getByText("VPN connection drops every 10 minutes")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000102")).toBeInTheDocument();

    // 4. Test clicking metric card drills down to queue
    fireEvent.click(screen.getByTestId("metric-open-tickets"));
    expect(onNavigateMyTickets).toHaveBeenCalledWith("OPEN");

    // 5. Test clicking recent ticket navigates to detail
    fireEvent.click(screen.getByText("TKT-2026-000101"));
    expect(onSelectTicket).toHaveBeenCalledWith(101);

    // 6. Test clicking Create Ticket quick action
    const createBtn = screen.getByRole("button", { name: /\+.*Create Ticket/i });
    fireEvent.click(createBtn);
    expect(onNavigateCreate).toHaveBeenCalled();
  });

  it("UI-04 (Empty State): Displays friendly zero-ticket prompt when requester has no tickets", async () => {
    vi.spyOn(api, "apiGetRequesterDashboard").mockResolvedValue({
      metrics: {
        myOpenTickets: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        waitingForRequester: 0,
      },
      recentTickets: [],
    });

    const onSelectTicket = vi.fn();
    const onNavigateCreate = vi.fn();
    const onNavigateMyTickets = vi.fn();

    render(
      <RequesterDashboard
        onSelectTicket={onSelectTicket}
        onNavigateCreate={onNavigateCreate}
        onNavigateMyTickets={onNavigateMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-tickets-state")).toBeInTheDocument();
      expect(screen.getByText(/You have not submitted any tickets yet/i)).toBeInTheDocument();
    });

    // Click "Submit Your First Ticket"
    const firstTicketBtn = screen.getByRole("button", { name: /Submit Your First Ticket/i });
    fireEvent.click(firstTicketBtn);
    expect(onNavigateCreate).toHaveBeenCalled();
  });
});
