import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import { AttachmentSection } from "../../src/components/AttachmentSection.js";
import * as api from "../../src/api.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  isActive: true,
};

const mockAttachments: api.Attachment[] = [
  {
    id: 10,
    ticketId: 101,
    originalFilename: "active_screenshot.png",
    fileSize: 51200,
    mimeType: "image/png",
    isRemoved: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 11,
    ticketId: 101,
    originalFilename: "removed_doc.pdf",
    fileSize: 102400,
    mimeType: "application/pdf",
    isRemoved: true,
    removalReason: "Superceded by newer version",
    removedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

describe("AttachmentSection Component", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
  });

  it("renders active and soft-removed attachments properly", () => {
    render(
      <RequesterProvider>
        <AttachmentSection ticketId={101} initialAttachments={mockAttachments} />
      </RequesterProvider>
    );

    expect(screen.getByText("active_screenshot.png")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("⬇️ Download")).toBeInTheDocument();

    expect(screen.getByText("removed_doc.pdf")).toBeInTheDocument();
    expect(screen.getByText("Removed")).toBeInTheDocument();
    expect(screen.getByText("🚫 Download Disabled")).toBeInTheDocument();
    expect(screen.getByText(/Superceded by newer version/i)).toBeInTheDocument();
  });

  it("opens modal and soft-removes attachment with reason", async () => {
    const softRemoveSpy = vi.spyOn(api, "softRemoveAttachment").mockResolvedValueOnce({
      ...mockAttachments[0],
      isRemoved: true,
      removalReason: "Old screenshot no longer relevant",
      removedAt: new Date().toISOString(),
    });

    render(
      <RequesterProvider>
        <AttachmentSection ticketId={101} initialAttachments={mockAttachments} />
      </RequesterProvider>
    );

    // Click Remove on active attachment
    fireEvent.click(screen.getByRole("button", { name: "✕ Remove" }));

    expect(screen.getByRole("heading", { name: "Remove Attachment" })).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/Enter reason for removal/i);
    fireEvent.change(reasonInput, { target: { value: "Old screenshot no longer relevant" } });

    fireEvent.click(screen.getByRole("button", { name: /Confirm Soft Removal/i }));

    await waitFor(() => {
      expect(softRemoveSpy).toHaveBeenCalledWith(10, "Old screenshot no longer relevant", 1);
    });
  });
});
