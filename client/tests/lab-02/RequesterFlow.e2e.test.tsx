import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

const mockRequesters: api.RequesterUser[] = [
  { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.com", isActive: true },
  { id: 2, name: "David Lee", email: "david.lee@example.com", isActive: true },
];

const mockCategories: api.Category[] = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];

const mockSystems: api.RelatedSystem[] = [
  { id: 1, name: "Email" },
  { id: 2, name: "Corporate Laptop" },
];

describe("Lab 2 E2E — Complete Requester Workflow Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(api, "getRequesters").mockResolvedValue(mockRequesters);
    vi.spyOn(api, "getCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue(mockSystems);
  });

  it("completes full flow: Select Requester -> Create Ticket -> My Tickets -> Ticket Detail", async () => {
    const createdTicket: api.Ticket = {
      id: 501,
      ticketNumber: "TKT-2026-000501",
      requesterId: 1,
      categoryId: 2,
      relatedSystemId: 2,
      summary: "E2E Test Laptop Battery Issue",
      description: "Comprehensive end-to-end integration test problem description.",
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      currentStatus: "NEW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: { id: 2, name: "Hardware" },
      relatedSystem: { id: 2, name: "Corporate Laptop" },
      attachments: [],
    };

    vi.spyOn(api, "getTickets").mockResolvedValue({
      success: true,
      data: [createdTicket],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(api, "createTicket").mockResolvedValue(createdTicket);
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(createdTicket);

    render(<App />);

    // 1. Selector opens because no requester is stored
    await waitFor(() => {
      expect(screen.getByText("Select Development Requester")).toBeInTheDocument();
    });

    // 2. Select Jennifer Anderson (ID 1)
    const selectElem = screen.getByLabelText(/Development Requester/i);
    fireEvent.change(selectElem, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // 3. Verify Navbar displays active requester
    await waitFor(() => {
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
    });

    // 4. Click Create Ticket
    const createTicketBtns = screen.getAllByRole("button", { name: /Create Ticket/i });
    fireEvent.click(createTicketBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Create Support Ticket")).toBeInTheDocument();
    });

    // 5. Fill and submit ticket
    fireEvent.change(screen.getByPlaceholderText(/Brief summary/i), {
      target: { value: "E2E Test Laptop Battery Issue" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Provide detailed information/i), {
      target: { value: "Comprehensive end-to-end integration test problem description." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));

    // 6. Verify Ticket Creation Success Banner
    await waitFor(() => {
      expect(screen.getByText(/Ticket Created Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText("TKT-2026-000501")).toBeInTheDocument();
    });

    // 7. Click View My Tickets
    fireEvent.click(screen.getByRole("button", { name: /View My Tickets/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "My Tickets" })).toBeInTheDocument();
      expect(screen.getAllByText("TKT-2026-000501").length).toBeGreaterThanOrEqual(1);
    });

    // 8. Click Ticket link to view Ticket Detail
    fireEvent.click(screen.getAllByText("TKT-2026-000501")[0]);

    await waitFor(() => {
      expect(screen.getByText("Ticket Details (View Mode)")).toBeInTheDocument();
      expect(screen.getByText("E2E Test Laptop Battery Issue")).toBeInTheDocument();
      expect(screen.getByText("Comprehensive end-to-end integration test problem description.")).toBeInTheDocument();
    });

    // 9. Navigate back to My Tickets
    fireEvent.click(screen.getByRole("button", { name: /Back to My Tickets/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "My Tickets" })).toBeInTheDocument();
    });
  });
});
