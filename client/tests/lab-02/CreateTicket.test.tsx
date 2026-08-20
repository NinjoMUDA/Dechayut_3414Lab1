import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import { CreateTicket } from "../../src/components/CreateTicket.js";
import * as api from "../../src/api.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  isActive: true,
};

const mockCategories: api.Category[] = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];

const mockSystems: api.RelatedSystem[] = [
  { id: 1, name: "Email" },
  { id: 2, name: "Corporate Laptop" },
];

describe("CreateTicket Component", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();

    vi.spyOn(api, "getCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue(mockSystems);
  });

  it("renders Create Ticket form with reference categories and systems", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    expect(screen.getByText(/Create Support Ticket/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue(/Jennifer Anderson/i)).toBeInTheDocument();
  });

  it("validates summary and description on submit and displays inline errors", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
    });

    // Attempt to submit empty form
    fireEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ticket Summary is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Problem Description is required/i)).toBeInTheDocument();
    });
  });

  it("submits valid ticket and displays official Ticket Number in success banner", async () => {
    const mockCreatedTicket: api.Ticket = {
      id: 10,
      ticketNumber: "TKT-2026-000010",
      requesterId: 1,
      categoryId: 2,
      relatedSystemId: 2,
      summary: "Laptop battery draining fast",
      description: "Battery discharges from 100% to 10% in under an hour.",
      requestedPriority: "HIGH",
      currentStatus: "NEW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(api, "createTicket").mockResolvedValueOnce(mockCreatedTicket);

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Brief summary/i), {
      target: { value: "Laptop battery draining fast" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Provide detailed information/i), {
      target: { value: "Battery discharges from 100% to 10% in under an hour." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ticket Created Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText("TKT-2026-000010")).toBeInTheDocument();
    });
  });

  it("preserves form values when API fails with server error", async () => {
    vi.spyOn(api, "createTicket").mockRejectedValueOnce(
      new Error("Database connection timed out")
    );

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
    });

    const summaryInput = screen.getByPlaceholderText(/Brief summary/i) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(/Provide detailed information/i) as HTMLTextAreaElement;

    fireEvent.change(summaryInput, {
      target: { value: "VPN connectivity lost" },
    });
    fireEvent.change(descInput, {
      target: { value: "Unable to authenticate through the campus VPN gateway." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/Submission Error:/i)).toBeInTheDocument();
      expect(screen.getByText(/Database connection timed out/i)).toBeInTheDocument();
    });

    // Verify inputs remain preserved
    expect(summaryInput.value).toBe("VPN connectivity lost");
    expect(descInput.value).toBe("Unable to authenticate through the campus VPN gateway.");
  });
});
