import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext.js";
import { RequesterSelector } from "../../src/components/RequesterSelector.js";
import * as api from "../../src/api.js";

const mockRequesters: api.RequesterUser[] = [
  { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.com", isActive: true },
  { id: 2, name: "David Lee", email: "david.lee@example.com", isActive: true },
];

describe("RequesterSelector Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the modal with testing disclaimer and active requesters dropdown", async () => {
    vi.spyOn(api, "getRequesters").mockResolvedValueOnce(mockRequesters);

    render(
      <RequesterProvider>
        <RequesterSelector isOpen={true} onClose={vi.fn()} />
      </RequesterProvider>
    );

    expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument();
    expect(screen.getByText(/This is for testing only and is not a login screen/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /Development Requester/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Jennifer Anderson/i)).toBeInTheDocument();
    expect(screen.getByText(/David Lee/i)).toBeInTheDocument();
  });

  it("allows selecting a requester and clicking Continue", async () => {
    vi.spyOn(api, "getRequesters").mockResolvedValueOnce(mockRequesters);
    const onClose = vi.fn();

    const TestWrapper = () => {
      const { activeRequester } = useRequester();
      return (
        <div>
          <div data-testid="active-user">{activeRequester?.name ?? "None"}</div>
          <RequesterSelector isOpen={true} onClose={onClose} />
        </div>
      );
    };

    render(
      <RequesterProvider>
        <TestWrapper />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    // Select second requester (David Lee)
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("active-user").textContent).toBe("David Lee");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles API error when loading requesters fails", async () => {
    vi.spyOn(api, "getRequesters").mockRejectedValueOnce(
      new Error("Failed to connect to database")
    );

    render(
      <RequesterProvider>
        <RequesterSelector isOpen={true} onClose={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Requesters/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to connect to database/i)).toBeInTheDocument();
    });
  });
});
