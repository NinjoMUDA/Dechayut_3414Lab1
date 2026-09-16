import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 E2E — Authentication & Password Gate (E2E-01, E2E-02)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(api, "checkSystem").mockResolvedValue({
      online: true,
      categories: [{ id: 1, name: "Network" }],
    });
    vi.spyOn(api, "getCategories").mockResolvedValue([{ id: 1, name: "Network" }]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([{ id: 1, name: "Campus Wi-Fi" }]);
    vi.spyOn(api, "getRequesters").mockResolvedValue([]);
    vi.spyOn(api, "getTickets").mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });
  });

  it("E2E-01: User logs in, dashboard loads with role badge, logs out successfully", async () => {
    const regularUser: api.User = {
      id: 101,
      name: "Alice Requester",
      email: "alice@example.com",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    };

    vi.spyOn(api, "apiLogin").mockResolvedValue({
      token: "valid-session-token",
      user: regularUser,
    });
    vi.spyOn(api, "apiGetMe").mockResolvedValue(regularUser);
    vi.spyOn(api, "apiLogout").mockResolvedValue({ success: true, message: "Logged out" });

    render(<App />);

    // 1. Initial screen displays Login
    await waitFor(() => {
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });

    // 2. Enter email and password
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    fireEvent.change(emailInput, { target: { value: "alice@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });

    // 3. Click Sign In
    const signInBtn = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInBtn);

    // 4. Verify Dashboard loads with user name & badge
    await waitFor(() => {
      expect(screen.getByText("Alice Requester")).toBeInTheDocument();
      expect(screen.getByText("Requester")).toBeInTheDocument();
      expect(screen.getByText("📋 My Tickets")).toBeInTheDocument();
    });

    // 5. User logs out
    const logoutBtn = screen.getByRole("button", { name: /Log out/i });
    fireEvent.click(logoutBtn);

    // 6. Verify redirected back to Login screen
    await waitFor(() => {
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });
  });

  it("E2E-02: First login with temporary password gate -> mandatory change password -> dashboard", async () => {
    const gatedUser: api.User = {
      id: 102,
      name: "Robert Initial",
      email: "robert@example.com",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
    };

    const updatedUser: api.User = {
      ...gatedUser,
      mustChangePassword: false,
    };

    vi.spyOn(api, "apiLogin").mockResolvedValue({
      token: "temp-session-token",
      user: gatedUser,
    });
    vi.spyOn(api, "apiGetMe").mockResolvedValue(gatedUser);
    vi.spyOn(api, "apiChangePassword").mockImplementation(async () => {
      // Upon successful password change, update getMe mock
      vi.spyOn(api, "apiGetMe").mockResolvedValue(updatedUser);
      return { success: true, message: "Password updated successfully" };
    });

    render(<App />);

    // 1. Enter login credentials
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "robert@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Initial123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    // 2. Trapped in ChangePassword screen; cannot see dashboard
    await waitFor(() => {
      expect(screen.getByText("Change Your Password")).toBeInTheDocument();
      expect(screen.getByText("You must change your password to continue.")).toBeInTheDocument();
    });
    expect(screen.queryByText("📋 My Tickets")).not.toBeInTheDocument();

    // 3. Enter new compliant password
    const currentPassInput = screen.getByLabelText(/current.*password/i);
    const newPassInput = screen.getByLabelText(/^new password/i);
    const confirmPassInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(currentPassInput, { target: { value: "Initial123!" } });
    fireEvent.change(newPassInput, { target: { value: "NewSecurePass123!" } });
    fireEvent.change(confirmPassInput, { target: { value: "NewSecurePass123!" } });

    // 4. Submit password update
    const updateBtn = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(updateBtn);

    // 5. Verification: user gate lifts and dashboard is rendered
    await waitFor(() => {
      expect(screen.getByText("Robert Initial")).toBeInTheDocument();
      expect(screen.getByText("📋 My Tickets")).toBeInTheDocument();
    });
  });
});
