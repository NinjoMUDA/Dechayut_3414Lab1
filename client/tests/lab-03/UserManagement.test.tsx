import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "../../src/context/AuthContext.js";
import { UserManagement } from "../../src/components/UserManagement.js";
import * as api from "../../src/api.js";

const mockAdminUser: api.User = {
  id: 10,
  name: "John Smith",
  email: "john.smith@toktickit.com",
  role: "ADMIN",
  isActive: true,
  mustChangePassword: false,
};

const mockUsers: api.User[] = [
  mockAdminUser,
  {
    id: 11,
    name: "Michael Brown",
    email: "michael.brown@toktickit.com",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: 12,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
  },
];

describe("UserManagement Component (UI-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem("toktickit_token", "fake-admin-token");
    localStorage.setItem("toktickit_user", JSON.stringify(mockAdminUser));

    vi.spyOn(api, "apiGetMe").mockResolvedValue(mockAdminUser);
    vi.spyOn(api, "apiGetAdminUsers").mockResolvedValue(mockUsers);
    vi.spyOn(api, "apiCreateAdminUser").mockResolvedValue({
      id: 99,
      name: "Alice Walker",
      email: "alice@example.com",
      role: "REQUESTER",
      isActive: true,
    });
    vi.spyOn(api, "apiUpdateAdminUser").mockResolvedValue({
      id: 11,
      name: "Michael Brown Updated",
      email: "michael.brown@toktickit.com",
      role: "IT_STAFF",
      isActive: true,
    });
    vi.spyOn(api, "apiResetUserPassword").mockResolvedValue({
      mustChangePassword: true,
    });
  });

  it("renders user table, header, search bar, and action buttons", async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
      expect(screen.getByTestId("user-row-10")).toHaveTextContent("John Smith");
      expect(screen.getByTestId("user-row-11")).toHaveTextContent("Michael Brown");
      expect(screen.getByTestId("user-row-12")).toHaveTextContent("Jennifer Anderson");
    });

    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
    expect(screen.getByText("Create User")).toBeInTheDocument();
  });

  it("opens create user modal and submits successfully", async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Create User")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create User"));

    expect(screen.getByText("Create New User")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("e.g. Jane Doe");
    const emailInput = screen.getByPlaceholderText("e.g. jane.doe@example.com");

    fireEvent.change(nameInput, { target: { value: "Alice Walker" } });
    fireEvent.change(emailInput, { target: { value: "alice@example.com" } });

    const submitBtn = screen.getByText("Save User");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.apiCreateAdminUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alice Walker",
          email: "alice@example.com",
        }),
        expect.anything()
      );
    });
  });

  it("enforces BR-10 self-deactivation protection when editing logged-in admin", async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("edit-btn-10")).toBeInTheDocument();
    });

    // Click edit for self (John Smith, id 10)
    fireEvent.click(screen.getByTestId("edit-btn-10"));

    expect(screen.getByTestId("self-deactivation-warning")).toBeInTheDocument();
    expect(screen.getByText(/You cannot deactivate your own account/i)).toBeInTheDocument();

    const activeSwitch = screen.getByTestId("edit-active-switch");
    expect(activeSwitch).toBeDisabled();

    // BR-27: Self-demotion is also disabled
    const roleSelect = screen.getByTestId("edit-role-select");
    expect(roleSelect).toBeDisabled();
    expect(screen.getByText(/Self-demotion disabled/i)).toBeInTheDocument();
  });

  it("enforces BR-11 protection when editing the sole active administrator", async () => {
    // Only 1 admin in mockUsers (John Smith)
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("edit-btn-10")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-btn-10"));

    await waitFor(() => {
      expect(screen.getByTestId("last-admin-warning")).toBeInTheDocument();
      expect(
        screen.getByText(/Cannot deactivate or demote the system's last active Administrator/i)
      ).toBeInTheDocument();
    });

    const roleSelect = screen.getByTestId("edit-role-select");
    expect(roleSelect).toBeDisabled();
  });

  it("opens reset password modal and submits password reset", async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("reset-btn-11")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reset-btn-11"));

    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-reset-btn")).toBeInTheDocument();

    const passInput = screen.getByTestId("reset-password-input");
    fireEvent.change(passInput, { target: { value: "NewSecurePass123!" } });

    fireEvent.click(screen.getByTestId("confirm-reset-btn"));

    await waitFor(() => {
      expect(api.apiResetUserPassword).toHaveBeenCalledWith(
        11,
        "NewSecurePass123!",
        expect.anything()
      );
    });
  });
});
