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
    vi.spyOn(api, "apiLogout").mockResolvedValue(undefined);

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

  it("E2E-01B: Session persistence rehydrates authenticated user from localStorage without re-login", async () => {
    const existingUser: api.User = {
      id: 105,
      name: "Persisted User",
      email: "persisted@example.com",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    };

    localStorage.setItem("toktickit_token", "persisted-token");
    vi.spyOn(api, "apiGetMe").mockResolvedValue(existingUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Persisted User")).toBeInTheDocument();
      expect(screen.getByText("📋 My Tickets")).toBeInTheDocument();
    });
    expect(screen.queryByText("Sign in to your account")).not.toBeInTheDocument();
  });

  it("E2E-01C: Role-based navigation redirects IT Staff to staff queue and Admin to user management", async () => {
    const staffUser: api.User = {
      id: 201,
      name: "Marcus Staff",
      email: "marcus@toktickit.com",
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    };

    const loginSpy = vi.spyOn(api, "apiLogin").mockResolvedValue({
      token: "staff-token",
      user: staffUser,
    });
    vi.spyOn(api, "apiGetMe").mockResolvedValue(staffUser);
    vi.spyOn(api, "apiGetStaffTickets").mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    });

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "marcus@toktickit.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: "StaffPass123!" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Ticket Queue" })).toBeInTheDocument();
      expect(screen.getByText("Marcus Staff")).toBeInTheDocument();
      expect(screen.getByText("IT Staff")).toBeInTheDocument();
    });

    unmount();
    localStorage.clear();

    const adminUser: api.User = {
      id: 301,
      name: "Grace Admin",
      email: "grace@toktickit.com",
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    };

    loginSpy.mockResolvedValue({
      token: "admin-token",
      user: adminUser,
    });
    vi.spyOn(api, "apiGetMe").mockResolvedValue(adminUser);
    vi.spyOn(api, "apiGetAdminUsers").mockResolvedValue([adminUser]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "grace@toktickit.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: "AdminPass123!" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /User Management/i })).toBeInTheDocument();
      expect(screen.getAllByText("Grace Admin").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Administrator/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("E2E-02: First login with temporary password gate -> mandatory change password -> dashboard & subsequent login", async () => {
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

    const loginSpy = vi.spyOn(api, "apiLogin").mockResolvedValue({
      token: "temp-session-token",
      user: gatedUser,
    });
    vi.spyOn(api, "apiGetMe").mockResolvedValue(gatedUser);
    vi.spyOn(api, "apiLogout").mockResolvedValue(undefined);
    vi.spyOn(api, "apiChangePassword").mockImplementation(async () => {
      vi.spyOn(api, "apiGetMe").mockResolvedValue(updatedUser);
      return { mustChangePassword: false };
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

    // 6. User logs out and performs subsequent login with new password
    const logoutBtn = screen.getByRole("button", { name: /Log out/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });

    // Next login: returns updatedUser with mustChangePassword = false
    loginSpy.mockResolvedValue({
      token: "new-session-token",
      user: updatedUser,
    });
    vi.spyOn(api, "apiGetMe").mockResolvedValue(updatedUser);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "robert@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: "NewSecurePass123!" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText("Robert Initial")).toBeInTheDocument();
      expect(screen.getByText("📋 My Tickets")).toBeInTheDocument();
    });
    expect(screen.queryByText("Change Your Password")).not.toBeInTheDocument();
  });
});
