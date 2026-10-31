import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterDashboard } from "../../src/components/RequesterDashboard.js";
import { StaffDashboard } from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";
import { User } from "../../src/types/index.js";

const mockRequesterUser: User = {
  id: 10,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  role: "REQUESTER",
  isActive: true,
};

const mockStaffUser: User = {
  id: 5,
  name: "Michael Brown",
  email: "michael.brown@toktickit.com",
  role: "IT_STAFF",
  isActive: true,
};

// Mock Contexts
vi.mock("../../src/context/RequesterContext.js", () => ({
  useRequester: () => ({
    activeRequester: mockRequesterUser,
  }),
}));

let activeUser: User = mockStaffUser;
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: activeUser,
    token: "mock-token",
    isAuthenticated: true,
  }),
}));

describe("E2E-03: Role-Based Dashboard Navigation and Drill-Down Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("verifies Requester dashboard metrics rendering and drill-down navigation", async () => {
    activeUser = mockRequesterUser;
    vi.spyOn(api, "apiGetRequesterDashboard").mockResolvedValue({
      metrics: {
        myOpenTickets: 2,
        inProgress: 1,
        resolved: 1,
        closed: 4,
        waitingForRequester: 0,
      },
      recentTickets: [
        {
          id: 301,
          ticketNumber: "TKT-2026-000301",
          summary: "Need access to project repository",
          currentStatus: "IN_PROGRESS",
          requestedPriority: "MEDIUM",
          updatedAt: "2026-09-24T12:00:00.000Z",
        },
      ],
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
      expect(screen.getByText(/Jennifer Anderson/i)).toBeInTheDocument();
      expect(screen.getByTestId("metric-open-tickets")).toHaveTextContent("2");
    });

    // Drill down via metric card
    fireEvent.click(screen.getByTestId("metric-in-progress"));
    expect(onNavigateMyTickets).toHaveBeenCalledWith("IN_PROGRESS");

    // Drill down to ticket detail
    fireEvent.click(screen.getByText("TKT-2026-000301"));
    expect(onSelectTicket).toHaveBeenCalledWith(301);
  });

  it("verifies IT Staff dashboard queue activity and filter navigation", async () => {
    activeUser = mockStaffUser;
    vi.spyOn(api, "apiGetStaffDashboard").mockResolvedValue({
      metrics: {
        newTickets: 3,
        openTickets: 5,
        inProgress: 4,
        waitingForRequester: 1,
        myAssigned: 2,
        unassigned: 6,
      },
      priorityBreakdown: {
        URGENT: 1,
        HIGH: 3,
        MEDIUM: 5,
        LOW: 0,
      },
      recentQueueTickets: [
        {
          id: 401,
          ticketNumber: "TKT-2026-000401",
          summary: "Core switch link flap on rack B",
          currentStatus: "NEW",
          itPriority: "URGENT",
          requester: { name: "Network Monitor" },
          updatedAt: "2026-09-24T13:00:00.000Z",
        },
      ],
    });

    const onSelectTicket = vi.fn();
    const onNavigateQueue = vi.fn();

    render(
      <StaffDashboard
        onSelectTicket={onSelectTicket}
        onNavigateQueue={onNavigateQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Michael Brown/i)).toBeInTheDocument();
      expect(screen.getByTestId("metric-new-tickets")).toHaveTextContent("3");
    });

    // Drill down to New Tickets queue
    fireEvent.click(screen.getByTestId("metric-new-tickets"));
    expect(onNavigateQueue).toHaveBeenCalledWith({ status: "NEW" });

    // Drill down to Assigned to Me
    fireEvent.click(screen.getByTestId("metric-my-assigned"));
    expect(onNavigateQueue).toHaveBeenCalledWith({ ownerId: "me" });

    // Click recent ticket
    fireEvent.click(screen.getByText("TKT-2026-000401"));
    expect(onSelectTicket).toHaveBeenCalledWith(401);
  });
});
