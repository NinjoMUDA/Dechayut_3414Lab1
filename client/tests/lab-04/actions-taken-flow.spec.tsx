import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ActionsTakenPanel } from "../../src/components/ActionsTakenPanel.js";
import * as api from "../../src/api.js";
import { ActionTaken, User } from "../../src/types/index.js";

const mockStaffUser: User = {
  id: 5,
  name: "Michael Brown",
  email: "michael.brown@toktickit.com",
  role: "IT_STAFF",
  isActive: true,
};

const initialAction: ActionTaken = {
  id: 1,
  ticketId: 101,
  actionDateTime: "2026-09-24T10:00:00.000Z",
  description: "Diagnosed bad cable connecting workstation to patch panel.",
  result: "Identified high packet loss and pin 3 misalignment.",
  performedById: 5,
  performedBy: mockStaffUser,
  followUpRequired: false,
  createdAt: "2026-09-24T10:00:00.000Z",
  updatedAt: "2026-09-24T10:00:00.000Z",
};

describe("E2E-01: Actions Taken Creation and Lifecycle Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("completes full Actions Taken creation and view flow with follow-up flag", async () => {
    let actionsList: ActionTaken[] = [initialAction];

    vi.spyOn(api, "apiGetActionsTaken").mockImplementation(async () => ({
      ticketId: 101,
      actions: actionsList,
    }));

    const createActionSpy = vi.spyOn(api, "apiCreateActionTaken").mockImplementation(
      async (tId, payload, _token) => {
        const newRecord: ActionTaken = {
          id: 2,
          ticketId: tId,
          actionDateTime: payload.actionDateTime || new Date().toISOString(),
          description: payload.description,
          result: payload.result,
          performedById: mockStaffUser.id,
          performedBy: mockStaffUser,
          followUpRequired: payload.followUpRequired || false,
          followUpNote: payload.followUpNote || null,
          attachmentNotes: payload.attachmentNotes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        actionsList = [...actionsList, newRecord];
        return newRecord;
      }
    );

    render(
      <ActionsTakenPanel
        ticketId={101}
        readOnly={false}
        currentUser={mockStaffUser}
        token="mock-token"
      />
    );

    // 1. Initial list verification
    await waitFor(() => {
      expect(screen.getByText("Diagnosed bad cable connecting workstation to patch panel.")).toBeInTheDocument();
    });

    // 2. Click "+ Record Action Taken"
    const recordBtn = screen.getByRole("button", { name: /\+.*Record Action Taken/i });
    fireEvent.click(recordBtn);

    // 3. Modal opens with auto-populated performer
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Record Action Taken/i })).toBeInTheDocument();
      expect(screen.getByText(/Michael Brown/i)).toBeInTheDocument();
    });

    // 4. Fill in form fields
    const descInput = screen.getByLabelText(/Action Description/i);
    fireEvent.change(descInput, { target: { value: "Replaced faulty RJ-45 cable and tested line speed" } });

    const resultInput = screen.getByLabelText(/^Result/i);
    fireEvent.change(resultInput, { target: { value: "Line speed restored to 1Gbps with 0% packet loss" } });

    // Toggle follow-up required checkbox
    const followUpCheckbox = screen.getByLabelText(/Follow-Up Required\?/i);
    fireEvent.click(followUpCheckbox);

    // Enter follow-up note
    const followUpNoteInput = screen.getByLabelText(/Follow-Up Note/i);
    fireEvent.change(followUpNoteInput, { target: { value: "Verify connection stability again in 24 hours" } });

    // Enter attachment note
    const attachmentNoteInput = screen.getByLabelText(/Attachment Reference Notes/i);
    fireEvent.change(attachmentNoteInput, { target: { value: "speedtest_benchmark.png" } });

    // 5. Submit the modal form
    const saveBtn = screen.getByRole("button", { name: /Save Action/i });
    fireEvent.click(saveBtn);

    // 6. Verify API was called with expected payload
    await waitFor(() => {
      expect(createActionSpy).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          description: "Replaced faulty RJ-45 cable and tested line speed",
          result: "Line speed restored to 1Gbps with 0% packet loss",
          followUpRequired: true,
          followUpNote: "Verify connection stability again in 24 hours",
          attachmentNotes: "speedtest_benchmark.png",
        }),
        "mock-token"
      );
    });

    // 7. Verify new action rendered in feed with follow-up badge and attachment note
    await waitFor(() => {
      expect(screen.getByText("Replaced faulty RJ-45 cable and tested line speed")).toBeInTheDocument();
      expect(screen.getByText("Line speed restored to 1Gbps with 0% packet loss")).toBeInTheDocument();
      expect(screen.getByText("Follow-Up Required")).toBeInTheDocument();
      expect(screen.getByText(/Verify connection stability again in 24 hours/)).toBeInTheDocument();
      expect(screen.getByText(/speedtest_benchmark\.png/)).toBeInTheDocument();
    });
  });
});
