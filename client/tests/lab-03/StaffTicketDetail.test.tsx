import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "../../src/context/AuthContext.js";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";

const mockTicket: any = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  summary: "Broken display on work laptop",
  description: "Screen exhibits flickering horizontal green lines.",
  categoryId: 1,
  category: { id: 1, name: "Hardware" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Workstation" },
  requestedPriority: "MEDIUM",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  requesterId: 1,
  requester: { id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" },
  ticketOwnerId: null,
  ticketOwner: null,
  requesterResolved: false,
  resolutionSummary: null,
  createdAt: "2026-09-15T10:00:00.000Z",
  updatedAt: "2026-09-15T10:00:00.000Z",
  attachments: [],
};

const mockStaffUsers: any[] = [
  { id: 5, name: "Michael Brown", email: "michael@toktickit.com", role: "IT_STAFF" },
  { id: 6, name: "Lisa Martinez", email: "lisa@toktickit.com", role: "IT_STAFF" },
];

const mockComments: any[] = [
  {
    id: 1,
    ticketId: 101,
    content: "Initial diagnostic requested.",
    createdAt: "2026-09-15T11:00:00.000Z",
    author: { id: 5, name: "Michael Brown", role: "IT_STAFF" },
  },
];

const mockNotes: any[] = [
  {
    id: 1,
    ticketId: 101,
    content: "Internal note: vendor parts ordered under serial #88492.",
    createdAt: "2026-09-15T11:30:00.000Z",
    author: { id: 5, name: "Michael Brown", role: "IT_STAFF" },
  },
];

describe("StaffTicketDetail Component (UI-04)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "apiGetStaffUsers").mockResolvedValue(mockStaffUsers);
    vi.spyOn(api, "apiGetComments").mockResolvedValue(mockComments);
    vi.spyOn(api, "apiGetNotes").mockResolvedValue(mockNotes);
    vi.spyOn(api, "apiUpdateStaffTicket").mockResolvedValue({
      ...mockTicket,
      itPriority: "URGENT",
      ticketOwnerId: 5,
      ticketOwner: mockStaffUsers[0],
    });
    vi.spyOn(api, "apiAddComment").mockResolvedValue({
      id: 2,
      ticketId: 101,
      content: "A replacement display has arrived.",
      createdAt: "2026-09-15T12:00:00.000Z",
      author: { id: 5, name: "Michael Brown", role: "IT_STAFF" },
    });
    vi.spyOn(api, "apiAddNote").mockResolvedValue({
      id: 2,
      ticketId: 101,
      content: "Internal: hardware repair scheduled for 2 PM.",
      createdAt: "2026-09-15T12:15:00.000Z",
      author: { id: 5, name: "Michael Brown", role: "IT_STAFF" },
    });
  });

  it("renders ticket context, summary, description, and requester info", async () => {
    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000101").length).toBeGreaterThan(0);
      expect(screen.getByText("Broken display on work laptop")).toBeInTheDocument();
      expect(screen.getByText(/Screen exhibits flickering horizontal green lines/i)).toBeInTheDocument();
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
    });
  });

  it("renders staff operational controls: claim button, priority, and status transitions", async () => {
    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Ticket Operations/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Assigned Staff/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/IT Priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status Transition/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save Operational Changes/i })).toBeInTheDocument();
    });
  });

  it("submits operational changes when clicking Save Operational Changes", async () => {
    const updateSpy = vi.spyOn(api, "apiUpdateStaffTicket");

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/IT Priority/i)).toBeInTheDocument();
    });

    const prioritySelect = screen.getByLabelText(/IT Priority/i);
    fireEvent.change(prioritySelect, { target: { value: "URGENT" } });

    const saveBtn = screen.getByRole("button", { name: /Save Operational Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        101,
        expect.objectContaining({ itPriority: "URGENT" }),
        null
      );
    });
  });

  it("switches to Internal Notes tab and displays confidential indicator", async () => {
    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Public Comments/i)).toBeInTheDocument();
      expect(screen.getByText(/Internal Notes/i)).toBeInTheDocument();
    });

    // Switch to Internal Notes tab
    fireEvent.click(screen.getByText(/Internal Notes/i));

    await waitFor(() => {
      expect(screen.getByText(/Confidential:/i)).toBeInTheDocument();
      expect(screen.getByText(/Internal note: vendor parts ordered under serial/i)).toBeInTheDocument();
    });
  });

  it("submits new Public Comment and renders it in the list", async () => {
    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write a public comment/i)).toBeInTheDocument();
    });

    const commentInput = screen.getByPlaceholderText(/Write a public comment/i);
    fireEvent.change(commentInput, { target: { value: "A replacement display has arrived." } });

    const postBtn = screen.getByRole("button", { name: /Post Public Comment/i });
    fireEvent.click(postBtn);

    await waitFor(() => {
      expect(screen.getByText("A replacement display has arrived.")).toBeInTheDocument();
    });
  });

  it("submits new Internal Note and renders it in the confidential feed", async () => {
    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Internal Notes/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Internal Notes/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Add an internal note/i)).toBeInTheDocument();
    });

    const noteInput = screen.getByPlaceholderText(/Add an internal note/i);
    fireEvent.change(noteInput, { target: { value: "Internal: hardware repair scheduled for 2 PM." } });

    const addNoteBtn = screen.getByRole("button", { name: /Add Internal Note/i });
    fireEvent.click(addNoteBtn);

    await waitFor(() => {
      expect(screen.getByText("Internal: hardware repair scheduled for 2 PM.")).toBeInTheDocument();
    });
  });
});
