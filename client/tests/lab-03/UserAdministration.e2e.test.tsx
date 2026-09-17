import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 E2E — Administrator User Management Lifecycle (E2E-04)", () => {
  const adminUser: api.User = {
    id: 1,
    name: "John Admin",
    email: "john.admin@toktickit.com",
    role: "ADMIN",
    isActive: true,
    mustChangePassword: false,
  };

  const initialUsers: api.User[] = [
    adminUser,
    {
      id: 2,
      name: "Second Admin",
      email: "second.admin@toktickit.com",
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 3,
      name: "Michael Staff",
      email: "michael.staff@toktickit.com",
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    localStorage.setItem("toktickit_token", "valid-admin-token");
    localStorage.setItem("toktickit_user", JSON.stringify(adminUser));

    vi.spyOn(api, "apiGetMe").mockResolvedValue(adminUser);
    vi.spyOn(api, "checkSystem").mockResolvedValue({ online: true, categories: [] });
    vi.spyOn(api, "getCategories").mockResolvedValue([]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([]);
    vi.spyOn(api, "apiGetAdminUsers").mockResolvedValue(initialUsers);
  });

  it("completes full Admin flow: Create User -> Edit User -> Reset Password -> Enforce Safety Rules", async () => {
    const createSpy = vi.spyOn(api, "apiCreateAdminUser").mockResolvedValue({
      id: 4,
      name: "Alex NewUser",
      email: "alex.new@toktickit.com",
      role: "IT_STAFF",
      isActive: true,
    });

    const updateSpy = vi.spyOn(api, "apiUpdateAdminUser").mockResolvedValue({
      id: 3,
      name: "Michael Staff Senior",
      email: "michael.staff@toktickit.com",
      role: "IT_STAFF",
      isActive: true,
    });

    const resetSpy = vi.spyOn(api, "apiResetUserPassword").mockResolvedValue({
      mustChangePassword: true,
    });

    render(<App />);

    // 1. Navbar displays Admin badge and User Management view is rendered
    await waitFor(() => {
      expect(screen.getAllByText("Administrator").length).toBeGreaterThan(0);
      expect(screen.getByRole("heading", { name: /User Management/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create User/i })).toBeInTheDocument();
    });

    // 2. Open Create User dialog
    const createBtn = screen.getByRole("button", { name: /Create User/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText("Create New User")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("e.g. Jane Doe"), {
      target: { value: "Alex NewUser" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. jane.doe@example.com"), {
      target: { value: "alex.new@toktickit.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save User/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alex NewUser",
          email: "alex.new@toktickit.com",
        }),
        expect.anything()
      );
    });

    // 3. Edit Michael Staff (ID 3)
    await waitFor(() => {
      expect(screen.getByTestId("edit-btn-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-btn-3"));

    await waitFor(() => {
      expect(screen.getByText("Edit User")).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue("Michael Staff");
    fireEvent.change(nameInput, { target: { value: "Michael Staff Senior" } });

    fireEvent.click(screen.getByTestId("save-user-btn"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ name: "Michael Staff Senior" }),
        expect.anything()
      );
    });

    // 4. Reset Password for Michael Staff (ID 3)
    await waitFor(() => {
      expect(screen.getByTestId("reset-btn-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reset-btn-3"));

    await waitFor(() => {
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
    });

    const passInput = screen.getByTestId("reset-password-input");
    fireEvent.change(passInput, { target: { value: "NewTempPassword123!" } });

    fireEvent.click(screen.getByTestId("confirm-reset-btn"));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(3, "NewTempPassword123!", expect.anything());
    });

    // 5. Verify Self-Deactivation & Self-Demotion safety guard (John Admin, ID 1)
    await waitFor(() => {
      expect(screen.getByTestId("edit-btn-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-btn-1"));

    await waitFor(() => {
      expect(screen.getByTestId("self-deactivation-warning")).toBeInTheDocument();
      expect(screen.getByTestId("edit-active-switch")).toBeDisabled();
      expect(screen.getByTestId("edit-role-select")).toBeDisabled();
    });
  });

  it("filters user list by keyword search, role, and active status", async () => {
    const listSpy = vi.spyOn(api, "apiGetAdminUsers").mockResolvedValue([
      {
        id: 3,
        name: "Michael Staff",
        email: "michael.staff@toktickit.com",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
      },
    ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument();
    });

    // Search by name
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
    fireEvent.change(searchInput, { target: { value: "Michael" } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Michael" }),
        expect.anything()
      );
    });

    // Filter by Role
    const roleSelect = screen.getByLabelText(/Filter by role/i);
    fireEvent.change(roleSelect, { target: { value: "IT_STAFF" } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ role: "IT_STAFF" }),
        expect.anything()
      );
    });

    // Filter by Status
    const statusSelect = screen.getByLabelText(/Filter by status/i);
    fireEvent.change(statusSelect, { target: { value: "ACTIVE" } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
        expect.anything()
      );
    });
  });

  it("enforces BR-11 last active administrator protection when editing the sole remaining admin", async () => {
    const soleAdmin: api.User = {
      id: 2,
      name: "Second Admin",
      email: "second.admin@toktickit.com",
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    };

    // Mock global active admin count query returning only 1 admin
    vi.spyOn(api, "apiGetAdminUsers").mockImplementation(async (params) => {
      if (params?.role === "ADMIN" && params?.isActive === true) {
        return [soleAdmin];
      }
      return [soleAdmin];
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-btn-2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-btn-2"));

    await waitFor(() => {
      expect(screen.getByTestId("last-admin-warning")).toBeInTheDocument();
      expect(screen.getByTestId("edit-active-switch")).toBeDisabled();
      expect(screen.getByTestId("edit-role-select")).toBeDisabled();
    });
  });
});
