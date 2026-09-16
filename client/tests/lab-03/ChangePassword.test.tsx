import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "../../src/context/AuthContext.js";
import { ChangePassword } from "../../src/components/ChangePassword.js";
import * as api from "../../src/api.js";

describe("ChangePassword Component (UI-02)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders change password form with checklist and disabled submit initially", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /Change Your Password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Current \(temporary\) password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm new password/i)).toBeInTheDocument();
    expect(screen.getByText(/Be at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Include upper and lower case letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Include a number/i)).toBeInTheDocument();

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it("enables Continue button only when all criteria and passwords match", async () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    const continueBtn = screen.getByRole("button", { name: /Continue/i });

    // Enter current password
    fireEvent.change(screen.getByLabelText(/Current \(temporary\) password/i), {
      target: { value: "OldPassword123!" },
    });
    expect(continueBtn).toBeDisabled();

    // Enter weak new password
    fireEvent.change(screen.getByLabelText(/^New password/i), {
      target: { value: "weak" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), {
      target: { value: "weak" },
    });
    expect(continueBtn).toBeDisabled();

    // Enter valid new password but mismatching confirm
    fireEvent.change(screen.getByLabelText(/^New password/i), {
      target: { value: "StrongPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), {
      target: { value: "MismatchPass123!" },
    });
    expect(continueBtn).toBeDisabled();

    // Enter valid matching confirm
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), {
      target: { value: "StrongPass123!" },
    });

    await waitFor(() => {
      expect(continueBtn).not.toBeDisabled();
    });
  });

  it("submits change password request and displays error on API failure", async () => {
    vi.spyOn(api, "apiChangePassword").mockRejectedValue(new Error("Current password is incorrect."));

    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Current \(temporary\) password/i), {
      target: { value: "WrongCurrent123!" },
    });
    fireEvent.change(screen.getByLabelText(/^New password/i), {
      target: { value: "NewValidPassword456!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), {
      target: { value: "NewValidPassword456!" },
    });

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Current password is incorrect/i);
    });
  });
});
