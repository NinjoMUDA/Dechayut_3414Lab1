import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 E2E — IT Staff Triage Workflow (E2E-03)", () => {
  const staffUser: api.User = {
    id: 50,
    name: "Michael Staff",
    email: "michael.staff@toktickit.com",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
  };

  const initialTicket: api.Ticket = {
    id: 701,
    ticketNumber: "TKT-2026-000701",
    requesterId: 1,
    requester: { id: 1, name: "Jennifer Anderson", email: "jennifer@example.com", isActive: true },
    categoryId: 1,
    category: { id: 1, name: "Network" },
    relatedSystemId: 1,
    relatedSystem: { id: 1, name: "Campus Wi-Fi" },
    summary: "Wi-Fi Connectivity Dropping in Lab 3",
    description: "Wi-Fi disconnects every 5 minutes in building 3.",
    requestedPriority: "HIGH",
    itPriority: null,
    currentStatus: "NEW",
    ticketOwnerId: null,
    ticketOwner: null,
    requesterResolved: false,
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    attachments: [],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    localStorage.setItem("toktickit_token", "valid-staff-token");
    localStorage.setItem("toktickit_user", JSON.stringify(staffUser));

    vi.spyOn(api, "apiGetMe").mockResolvedValue(staffUser);
    vi.spyOn(api, "getCategories").mockResolvedValue([{ id: 1, name: "Network" }]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([{ id: 1, name: "Campus Wi-Fi" }]);
    vi.spyOn(api, "checkSystem").mockResolvedValue({ online: true, categories: [{ id: 1, name: "Network" }] });

    vi.spyOn(api, "apiGetStaffTickets").mockResolvedValue({
      success: true,
      data: [initialTicket],
      pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });

    vi.spyOn(api, "getTicketDetail").mockResolvedValue(initialTicket);
    vi.spyOn(api, "apiGetStaffUsers").mockResolvedValue([
      staffUser,
      { id: 51, name: "Lisa Colleague", email: "lisa@toktickit.com", role: "IT_STAFF", isActive: true },
    ]);
    vi.spyOn(api, "apiGetComments").mockResolvedValue([]);
    vi.spyOn(api, "apiGetNotes").mockResolvedValue([]);
  });

  it("completes full IT Staff flow: Queue -> Open Detail -> Claim Ownership -> Set IT Priority -> Status Transition -> Note & Comment", async () => {
    const updatedTicket: api.Ticket = {
      ...initialTicket,
      ticketOwnerId: 50,
      ticketOwner: { id: 50, name: "Michael Staff" },
      itPriority: "URGENT",
      currentStatus: "IN_PROGRESS",
    };

    const updateSpy = vi.spyOn(api, "apiUpdateStaffTicket").mockResolvedValue(updatedTicket);
    const addNoteSpy = vi.spyOn(api, "apiAddNote").mockResolvedValue({
      id: 901,
      ticketId: 701,
      authorId: 50,
      author: { id: 50, name: "Michael Staff", role: "IT_STAFF" },
      content: "Investigating network switch logs on floor 3.",
      createdAt: "2026-09-16T10:15:00.000Z",
    });
    const addCommentSpy = vi.spyOn(api, "apiAddComment").mockResolvedValue({
      id: 801,
      ticketId: 701,
      authorId: 50,
      author: { id: 50, name: "Michael Staff", role: "IT_STAFF" },
      content: "We are currently investigating the AP access points.",
      createdAt: "2026-09-16T10:20:00.000Z",
    });

    render(<App />);

    // 1. Queue is loaded displaying ticket
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Ticket Queue" })).toBeInTheDocument();
      expect(screen.getByTestId("staff-queue-row-701")).toBeInTheDocument();
    });

    // 2. Open Ticket Detail by clicking on ticket row
    fireEvent.click(screen.getByTestId("staff-queue-row-701"));

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000701")).toBeInTheDocument();
      expect(screen.getByText(/Ticket Detail/i)).toBeInTheDocument();
    });

    // 3. Claim ticket ownership
    const claimBtn = screen.getByRole("button", { name: /Claim Ticket/i });
    fireEvent.click(claimBtn);

    // 4. Update IT Priority to URGENT
    const prioritySelect = screen.getByLabelText(/IT Priority/i);
    fireEvent.change(prioritySelect, { target: { value: "URGENT" } });

    // 5. Transition Status from NEW -> IN_PROGRESS
    const statusSelect = screen.getByLabelText(/Status Transition/i);
    fireEvent.change(statusSelect, { target: { value: "IN_PROGRESS" } });

    // 6. Save Operational Changes
    const saveOpsBtn = screen.getByRole("button", { name: /Save Operational Changes/i });
    fireEvent.click(saveOpsBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        701,
        expect.objectContaining({
          ticketOwnerId: 50,
          itPriority: "URGENT",
          currentStatus: "IN_PROGRESS",
        }),
        expect.anything()
      );
    });

    // 7. Post an Internal Note (Staff only)
    const notesTab = screen.getByRole("button", { name: /Internal Notes/i });
    fireEvent.click(notesTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Add an internal note/i)).toBeInTheDocument();
    });

    const noteInput = screen.getByPlaceholderText(/Add an internal note/i);
    fireEvent.change(noteInput, { target: { value: "Investigating network switch logs on floor 3." } });

    const saveNoteBtn = screen.getByRole("button", { name: /Add Internal Note/i });
    fireEvent.click(saveNoteBtn);

    await waitFor(() => {
      expect(addNoteSpy).toHaveBeenCalledWith(
        701,
        "Investigating network switch logs on floor 3.",
        expect.anything()
      );
    });

    // 8. Post a Public Comment
    const commentsTab = screen.getByRole("button", { name: /Public Comments/i });
    fireEvent.click(commentsTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write a public comment/i)).toBeInTheDocument();
    });

    const commentInput = screen.getByPlaceholderText(/Write a public comment/i);
    fireEvent.change(commentInput, { target: { value: "We are currently investigating the AP access points." } });

    const postCommentBtn = screen.getByRole("button", { name: /Post Public Comment/i });
    fireEvent.click(postCommentBtn);

    await waitFor(() => {
      expect(addCommentSpy).toHaveBeenCalledWith(
        701,
        "We are currently investigating the AP access points.",
        expect.anything()
      );
    });
  });
});
