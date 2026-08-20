import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext.js";
import { MyTickets } from "../../src/components/MyTickets.js";
import * as api from "../../src/api.js";

const mockRequester1: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  isActive: true,
};

const mockTickets1: api.Ticket[] = [
  {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    requesterId: 1,
    categoryId: 2,
    relatedSystemId: 1,
    summary: "Laptop battery drains quickly",
    description: "Battery discharges rapidly after update.",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "NEW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 2, name: "Hardware" },
    relatedSystem: { id: 1, name: "Corporate Laptop" },
  },
  {
    id: 2,
    ticketNumber: "TKT-2026-000002",
    requesterId: 1,
    categoryId: 1,
    relatedSystemId: 2,
    summary: "VPN access authentication failed",
    description: "Cannot authenticate with credentials.",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    currentStatus: "IN_PROGRESS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 1, name: "Account and Access" },
    relatedSystem: { id: 2, name: "VPN" },
  },
];

describe("MyTickets Component", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester1));
    vi.restoreAllMocks();

    vi.spyOn(api, "getCategories").mockResolvedValue([
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
    ]);
  });

  it("renders list of tickets for active requester", async () => {
    vi.spyOn(api, "getTickets").mockResolvedValue({
      success: true,
      data: mockTickets1,
      pagination: { page: 1, limit: 10, totalItems: 2, totalPages: 1 },
    });

    render(
      <RequesterProvider>
        <MyTickets onCreateTicketClick={vi.fn()} />
      </RequesterProvider>
    );

    expect(screen.getByRole("heading", { name: "My Tickets" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Laptop battery drains quickly").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("TKT-2026-000002").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("updates search input and triggers new query", async () => {
    const getTicketsSpy = vi.spyOn(api, "getTickets").mockResolvedValue({
      success: true,
      data: [mockTickets1[0]],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });

    render(
      <RequesterProvider>
        <MyTickets onCreateTicketClick={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText(/Search by ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: "battery" } });

    await waitFor(() => {
      expect(getTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "battery" })
      );
    });
  });

  it("displays empty state when active requester has no tickets", async () => {
    vi.spyOn(api, "getTickets").mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });

    render(
      <RequesterProvider>
        <MyTickets onCreateTicketClick={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No tickets submitted yet/i)).toBeInTheDocument();
    });
  });

  it("displays no-results state and clear filters button when filters match 0 tickets", async () => {
    vi.spyOn(api, "getTickets").mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });

    render(
      <RequesterProvider>
        <MyTickets onCreateTicketClick={vi.fn()} />
      </RequesterProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search by ticket number/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText(/No matching tickets found/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Clear All Filters/i })).toBeInTheDocument();
    });
  });

  it("re-fetches tickets when active requester switches in context", async () => {
    const getTicketsSpy = vi.spyOn(api, "getTickets").mockResolvedValue({
      success: true,
      data: mockTickets1,
      pagination: { page: 1, limit: 10, totalItems: 2, totalPages: 1 },
    });

    const RequesterSwitchWrapper = () => {
      const { setActiveRequester } = useRequester();
      return (
        <div>
          <button
            onClick={() =>
              setActiveRequester({
                id: 2,
                name: "David Lee",
                email: "david.lee@example.com",
                isActive: true,
              })
            }
          >
            Switch to David
          </button>
          <MyTickets onCreateTicketClick={vi.fn()} />
        </div>
      );
    };

    render(
      <RequesterProvider>
        <RequesterSwitchWrapper />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(getTicketsSpy).toHaveBeenCalledWith(expect.objectContaining({ requesterId: 1 }));
    });

    // Switch requester to David Lee (id 2)
    fireEvent.click(screen.getByRole("button", { name: "Switch to David" }));

    await waitFor(() => {
      expect(getTicketsSpy).toHaveBeenCalledWith(expect.objectContaining({ requesterId: 2 }));
    });
  });
});
