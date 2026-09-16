import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "../../src/context/AuthContext.js";
import { StaffTicketQueue } from "../../src/components/StaffTicketQueue.js";
import * as api from "../../src/api.js";

const mockTickets: any[] = [
  {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    summary: "VPN access issue",
    categoryId: 1,
    category: { id: 1, name: "Network" },
    requestedPriority: "HIGH",
    itPriority: "URGENT",
    currentStatus: "IN_PROGRESS",
    ticketOwnerId: 5,
    ticketOwner: { id: 5, name: "Michael Brown" },
    requesterId: 1,
    requester: { id: 1, name: "Jennifer Anderson" },
    requesterResolved: false,
    createdAt: "2026-09-15T10:00:00.000Z",
    updatedAt: "2026-09-15T10:00:00.000Z",
  },
  {
    id: 2,
    ticketNumber: "TKT-2026-000002",
    summary: "Monitor flickering",
    categoryId: 2,
    category: { id: 2, name: "Hardware" },
    requestedPriority: "MEDIUM",
    itPriority: null,
    currentStatus: "NEW",
    ticketOwnerId: null,
    ticketOwner: null,
    requesterId: 2,
    requester: { id: 2, name: "Robert Wilson" },
    requesterResolved: false,
    createdAt: "2026-09-15T11:00:00.000Z",
    updatedAt: "2026-09-15T11:00:00.000Z",
  },
];

describe("StaffTicketQueue Component (UI-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue([
      { id: 1, name: "Network" },
      { id: 2, name: "Hardware" },
    ]);
    vi.spyOn(api, "apiGetStaffTickets").mockResolvedValue({
      success: true,
      data: mockTickets,
      pagination: {
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });
  });

  it("renders page title, search bar, and filter controls", async () => {
    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /Ticket Queue/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by ticket number or summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Status$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Req. Priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IT Priority/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Showing 1 to 2 of 2 tickets")).toBeInTheDocument();
    });
  });

  it("displays tickets in the queue table with status, priorities, and assigned staff", async () => {
    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThan(0);
      expect(screen.getAllByText("VPN access issue").length).toBeGreaterThan(0);
      expect(screen.getAllByText("TKT-2026-000002").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Monitor flickering").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Michael Brown/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Unassigned/).length).toBeGreaterThan(0);
    });
  });

  it("triggers search and updates parameters when typing in search input", async () => {
    const getStaffTicketsSpy = vi.spyOn(api, "apiGetStaffTickets");

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search by ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: "VPN" } });

    await waitFor(() => {
      const calls = getStaffTicketsSpy.mock.calls;
      const matched = calls.some((call) => call[0]?.search === "VPN");
      expect(matched).toBe(true);
    });
  });

  it("triggers refetch when category or status filters change", async () => {
    const getStaffTicketsSpy = vi.spyOn(api, "apiGetStaffTickets");

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    const statusSelect = screen.getByLabelText(/^Status$/i);
    fireEvent.change(statusSelect, { target: { value: "NEW" } });

    await waitFor(() => {
      const calls = getStaffTicketsSpy.mock.calls;
      const matched = calls.some((call) => call[0]?.status === "NEW");
      expect(matched).toBe(true);
    });
  });

  it("renders empty state when no tickets match filters", async () => {
    vi.spyOn(api, "apiGetStaffTickets").mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No tickets found/i)).toBeInTheDocument();
      expect(screen.getByText(/0 tickets found/i)).toBeInTheDocument();
    });
  });

  it("renders pagination and allows navigating to next page", async () => {
    const getStaffTicketsSpy = vi.spyOn(api, "apiGetStaffTickets").mockResolvedValue({
      success: true,
      data: mockTickets,
      pagination: {
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      },
    });

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      const calls = getStaffTicketsSpy.mock.calls;
      const matched = calls.some((call) => call[0]?.page === 2);
      expect(matched).toBe(true);
    });
  });
});

