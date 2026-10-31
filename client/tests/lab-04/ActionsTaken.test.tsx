import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ActionsTakenPanel } from "../../src/components/ActionsTakenPanel.js";
import * as api from "../../src/api.js";
import { ActionTaken, User } from "../../src/types/index.js";

const mockActions: ActionTaken[] = [
  {
    id: 1,
    ticketId: 101,
    actionDateTime: "2026-09-24T10:30:00.000Z",
    description: "Inspected network cable and replaced RJ-45 connector.",
    result: "Link light restored and ping latency dropped to 2ms.",
    performedById: 5,
    performedBy: {
      id: 5,
      name: "Michael Brown",
      email: "michael@toktickit.com",
      role: "IT_STAFF",
    },
    followUpRequired: true,
    followUpNote: "Check connection stability again after 24 hours.",
    attachmentNotes: "network_diagnostics.txt",
    createdAt: "2026-09-24T10:30:00.000Z",
    updatedAt: "2026-09-24T10:30:00.000Z",
  },
];

const mockStaffUser: User = {
  id: 5,
  name: "Michael Brown",
  email: "michael@toktickit.com",
  role: "IT_STAFF",
  isActive: true,
};

describe("ActionsTakenPanel Component (Lab 4 - Issue #43)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-01: IT Staff views Actions Taken and opens Record Action modal with auto-populated performer", async () => {
    vi.spyOn(api, "apiGetActionsTaken").mockResolvedValue({
      ticketId: 101,
      actions: mockActions,
    });

    render(
      <ActionsTakenPanel
        ticketId={101}
        readOnly={false}
        token="test-staff-token"
        currentUser={mockStaffUser}
      />
    );

    // Verify initial load
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Actions Taken/i })).toBeInTheDocument();
      expect(screen.getByText("Inspected network cable and replaced RJ-45 connector.")).toBeInTheDocument();
      expect(screen.getByText("Link light restored and ping latency dropped to 2ms.")).toBeInTheDocument();
    });

    // Check "+ Record Action Taken" button is visible for staff
    const recordBtn = screen.getByRole("button", { name: /\+.*Record Action Taken/i });
    expect(recordBtn).toBeInTheDocument();

    // Click "+ Record Action Taken"
    fireEvent.click(recordBtn);

    // Verify modal appears
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Record Action Taken" })).toBeInTheDocument();
    });

    // Performer input is auto-populated and disabled (read-only)
    const performerInput = screen.getByDisplayValue("Michael Brown");
    expect(performerInput).toBeInTheDocument();
    expect(performerInput).toBeDisabled();
  });

  it("UI-02: Inline validation triggers when follow-up checkbox is toggled without a note", async () => {
    vi.spyOn(api, "apiGetActionsTaken").mockResolvedValue({
      ticketId: 101,
      actions: [],
    });

    render(
      <ActionsTakenPanel
        ticketId={101}
        readOnly={false}
        token="test-staff-token"
        currentUser={mockStaffUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No Actions Recorded Yet")).toBeInTheDocument();
    });

    // Open record modal
    const recordBtn = screen.getByRole("button", { name: /\+.*Record Action Taken/i });
    fireEvent.click(recordBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Record Action Taken" })).toBeInTheDocument();
    });

    // Fill in valid description and result
    const descInput = screen.getByPlaceholderText(/Detail the technical action taken/i);
    fireEvent.change(descInput, { target: { value: "Replaced faulty router power supply." } });

    const resultInput = screen.getByPlaceholderText(/Outcome of the action/i);
    fireEvent.change(resultInput, { target: { value: "Router booted normally." } });

    // Check "Follow-Up Required?" switch
    const followUpCheckbox = screen.getByLabelText(/Follow-Up Required\?/i);
    fireEvent.click(followUpCheckbox);

    // Follow-up note field should appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Explain what follow-up action is needed/i)).toBeInTheDocument();
    });

    // Click "Save Action" without providing follow-up note
    const saveBtn = screen.getByRole("button", { name: /Save Action/i });
    fireEvent.click(saveBtn);

    // Expect inline validation error
    await waitFor(() => {
      expect(screen.getByText(/Follow-up note is required when follow-up is needed/i)).toBeInTheDocument();
    });
  });

  it("UI-03: Requester views Actions Taken list in read-only mode without record/edit buttons", async () => {
    vi.spyOn(api, "apiGetActionsTaken").mockResolvedValue({
      ticketId: 101,
      actions: mockActions,
    });

    render(
      <ActionsTakenPanel
        ticketId={101}
        readOnly={true}
        token="test-requester-token"
        currentUser={null}
      />
    );

    // Verify actions list renders
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Actions Taken/i })).toBeInTheDocument();
      expect(screen.getByText("Inspected network cable and replaced RJ-45 connector.")).toBeInTheDocument();
      expect(screen.getByText(/Follow-Up Required/i)).toBeInTheDocument();
      expect(screen.getByText("Check connection stability again after 24 hours.")).toBeInTheDocument();
      expect(screen.getByText(/network_diagnostics\.txt/i)).toBeInTheDocument();
    });

    // Record Action button must NOT exist
    expect(screen.queryByRole("button", { name: /\+.*Record Action Taken/i })).not.toBeInTheDocument();

    // Edit button must NOT exist
    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
  });
});
