import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { StaffDashboard } from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";
import { StaffDashboardResponse, User } from "../../src/types/index.js";

const mockStaffUser: User = {
  id: 5,
  name: "Michael Brown",
  email: "michael.brown@toktickit.com",
  role: "IT_STAFF",
  isActive: true,
};

const mockAdminUser: User = {
  id: 1,
  name: "Sarah Chen",
  email: "sarah.chen@toktickit.com",
  role: "ADMIN",
  isActive: true,
};

let currentUser: User = mockStaffUser;

// Mock AuthContext
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: currentUser,
    token: "mock-staff-token",
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockStaffData: StaffDashboardResponse = {
  metrics: {
    newTickets: 4,
    openTickets: 8,
    inProgress: 5,
    waitingForRequester: 2,
    myAssigned: 6,
    unassigned: 3,
  },
  priorityBreakdown: {
    URGENT: 2,
    HIGH: 5,
    MEDIUM: 7,
    LOW: 1,
  },
  recentQueueTickets: [
    {
      id: 201,
      ticketNumber: "TKT-2026-000201",
      summary: "Database connection timeout in production",
      currentStatus: "NEW",
      itPriority: "URGENT",
      requester: { name: "Alice Smith" },
      updatedAt: "2026-09-24T11:00:00.000Z",
    },
  ],
};

describe("StaffDashboard Component (Lab 4 - Issue #45 - UI-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    currentUser = mockStaffUser;
  });

  it("UI-05: Renders 5 metric cards, priority breakdown, and recent queue activity", async () => {
    vi.spyOn(api, "apiGetStaffDashboard").mockResolvedValue(mockStaffData);

    const onSelectTicket = vi.fn();
    const onNavigateQueue = vi.fn();

    render(
      <StaffDashboard
        onSelectTicket={onSelectTicket}
        onNavigateQueue={onNavigateQueue}
      />
    );

    // 1. Verify greeting and role badge
    await waitFor(() => {
      expect(screen.getByText(/IT Operations Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText("IT Staff")).toBeInTheDocument();
    });

    // 2. Verify metric cards
    expect(screen.getByTestId("metric-new-tickets")).toHaveTextContent("4");
    expect(screen.getByTestId("metric-open-tickets")).toHaveTextContent("8");
    expect(screen.getByTestId("metric-in-progress")).toHaveTextContent("5");
    expect(screen.getByTestId("metric-waiting-requester")).toHaveTextContent("2");
    expect(screen.getByTestId("metric-my-assigned")).toHaveTextContent("6");

    // 3. Verify Priority Breakdown
    const prioCard = screen.getByTestId("priority-breakdown-card");
    expect(prioCard).toHaveTextContent("URGENT");
    expect(prioCard).toHaveTextContent("2");
    expect(prioCard).toHaveTextContent("HIGH");
    expect(prioCard).toHaveTextContent("5");

    // 4. Verify Recent Queue Ticket
    expect(screen.getByText("TKT-2026-000201")).toBeInTheDocument();
    expect(screen.getByText("Database connection timeout in production")).toBeInTheDocument();

    // 5. Test metric drill-down
    fireEvent.click(screen.getByTestId("metric-new-tickets"));
    expect(onNavigateQueue).toHaveBeenCalledWith({ status: "NEW" });

    // 6. Test clicking ticket row
    fireEvent.click(screen.getByText("TKT-2026-000201"));
    expect(onSelectTicket).toHaveBeenCalledWith(201);
  });

  it("UI-05 (Admin View): Renders admin stats card with user counts", async () => {
    currentUser = mockAdminUser;
    vi.spyOn(api, "apiGetStaffDashboard").mockResolvedValue({
      ...mockStaffData,
      adminStats: {
        totalUsers: 14,
        activeUsers: 12,
      },
    });

    render(
      <StaffDashboard
        onSelectTicket={vi.fn()}
        onNavigateQueue={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Administrator")).toBeInTheDocument();
      expect(screen.getByTestId("admin-stats-card")).toBeInTheDocument();
      expect(screen.getByText("14")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });
  });

  it("UI-05 (Empty Queue): Renders friendly all-caught-up prompt when queue is empty", async () => {
    vi.spyOn(api, "apiGetStaffDashboard").mockResolvedValue({
      metrics: {
        newTickets: 0,
        openTickets: 0,
        inProgress: 0,
        waitingForRequester: 0,
        myAssigned: 0,
        unassigned: 0,
      },
      priorityBreakdown: {
        URGENT: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
      recentQueueTickets: [],
    });

    render(
      <StaffDashboard
        onSelectTicket={vi.fn()}
        onNavigateQueue={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-queue-state")).toBeInTheDocument();
      expect(screen.getByText(/All caught up! No active tickets in the queue/i)).toBeInTheDocument();
    });
  });
});
