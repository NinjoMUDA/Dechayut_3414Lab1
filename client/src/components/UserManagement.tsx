import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  User,
  Role,
  apiGetAdminUsers,
  apiCreateAdminUser,
  apiUpdateAdminUser,
  apiResetUserPassword,
} from "../api.js";

export const UserManagement: React.FC = () => {
  const { user: currentUser, token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    initialPassword: string;
  }>({
    name: "",
    email: "",
    role: "REQUESTER",
    isActive: true,
    initialPassword: "Password123!",
  });
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit User Modal State
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
  }>({
    name: "",
    email: "",
    role: "REQUESTER",
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password Modal State
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState<string>("Password123!");
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeParam =
        statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined;
      const data = await apiGetAdminUsers(
        {
          search,
          role: roleFilter !== "ALL" ? roleFilter : undefined,
          isActive: activeParam,
        },
        token
      );
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Compute active admin count across currently known users
  const activeAdminCount = users.filter((u) => u.role === "ADMIN" && u.isActive).length;

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateForm({
      name: "",
      email: "",
      role: "REQUESTER",
      isActive: true,
      initialPassword: "Password123!",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      if (!createForm.name.trim()) throw new Error("Name is required");
      if (!createForm.email.trim()) throw new Error("Email is required");

      await apiCreateAdminUser(
        {
          name: createForm.name.trim(),
          email: createForm.email.trim().toLowerCase(),
          role: createForm.role,
          isActive: createForm.isActive,
          initialPassword: createForm.initialPassword,
        },
        token
      );

      setIsCreateOpen(false);
      setSuccessMsg(`User "${createForm.name}" created successfully.`);
      fetchUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditForm({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      isActive: userToEdit.isActive,
    });
    setEditError(null);
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError(null);

    try {
      if (!editForm.name.trim()) throw new Error("Name is required");
      if (!editForm.email.trim()) throw new Error("Email is required");

      // BR-10 client guard
      if (currentUser && editingUser.id === currentUser.id && !editForm.isActive) {
        throw new Error("You cannot deactivate your own account");
      }

      // BR-11 client guard
      if (
        editingUser.role === "ADMIN" &&
        editingUser.isActive &&
        activeAdminCount <= 1 &&
        (!editForm.isActive || editForm.role !== "ADMIN")
      ) {
        throw new Error("Cannot deactivate or demote the last active Administrator");
      }

      await apiUpdateAdminUser(
        editingUser.id,
        {
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
          role: editForm.role,
          isActive: editForm.isActive,
        },
        token
      );

      setIsEditOpen(false);
      setSuccessMsg(`User "${editForm.name}" updated successfully.`);
      fetchUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Reset Modal
  const handleOpenReset = (userToReset: User) => {
    setResetTargetUser(userToReset);
    setResetPassword("Password123!");
    setResetError(null);
    setIsResetOpen(true);
  };

  // Submit Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetLoading(true);
    setResetError(null);

    try {
      if (!resetPassword || resetPassword.length < 6) {
        throw new Error("Temporary password must be at least 6 characters");
      }

      await apiResetUserPassword(resetTargetUser.id, resetPassword, token);
      setIsResetOpen(false);
      setSuccessMsg(`Password reset successfully for ${resetTargetUser.name}.`);
      fetchUsers();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  // Helpers for safety logic on editingUser
  const isEditingSelf = currentUser && editingUser ? currentUser.id === editingUser.id : false;
  const isEditingLastAdmin =
    editingUser &&
    editingUser.role === "ADMIN" &&
    editingUser.isActive &&
    activeAdminCount <= 1;

  const renderRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontSize: "0.75rem", fontWeight: 600 }}
          >
            Administrator
          </span>
        );
      case "IT_STAFF":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#E0F2FE", color: "#0369A1", fontSize: "0.75rem", fontWeight: 600 }}
          >
            IT Staff
          </span>
        );
      default:
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontSize: "0.75rem", fontWeight: 600 }}
          >
            Requester
          </span>
        );
    }
  };

  const renderStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span
        className="badge rounded-pill px-2 py-1"
        style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontSize: "0.75rem", fontWeight: 600 }}
      >
        Active
      </span>
    ) : (
      <span
        className="badge rounded-pill px-2 py-1"
        style={{ backgroundColor: "#F3F4F6", color: "#6B7280", fontSize: "0.75rem", fontWeight: 600 }}
      >
        Inactive
      </span>
    );
  };

  return (
    <div className="user-management-container">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>
            User Management
          </h1>
          <p className="text-muted small mb-0">
            Create, manage roles, configure status, and reset credentials for system users.
          </p>
        </div>
        <button
          className="btn btn-zen-primary shadow-sm d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
        >
          <span>➕</span>
          <span>Create User</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm py-2 px-3 mb-3" role="alert">
          <strong>Success:</strong> {successMsg}
          <button
            type="button"
            className="btn-close py-2"
            aria-label="Close"
            onClick={() => setSuccessMsg(null)}
          ></button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="zen-card p-3 mb-4 shadow-sm">
        <div className="row g-2 align-items-center">
          {/* Search Box */}
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control form-control-sm border-start-0"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => setSearch("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Role Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              <option value="ALL">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="col-12 col-md-1 d-flex justify-content-end">
            <button
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={() => fetchUsers()}
              title="Refresh users"
              disabled={loading}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger shadow-sm py-2 px-3 mb-3">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Users Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading users...</span>
          </div>
          <p className="text-muted small mt-2">Loading user accounts...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="zen-card text-center py-5 px-3">
          <div className="display-6 mb-2">👤</div>
          <h2 className="h6 fw-bold mb-1 text-muted">No users found</h2>
          <p className="text-muted small mb-3">
            Try adjusting your search query or role filter.
          </p>
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => {
              setSearch("");
              setRoleFilter("ALL");
              setStatusFilter("ALL");
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="zen-card overflow-hidden shadow-sm d-none d-md-block mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" data-testid="user-table">
                <thead style={{ backgroundColor: "#F5F7F6" }}>
                  <tr className="small text-muted text-uppercase">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Email Address</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} data-testid={`user-row-${u.id}`}>
                      <td className="px-3">
                        <div className="fw-semibold" style={{ color: "var(--color-text-main)" }}>
                          {u.name}
                          {currentUser && currentUser.id === u.id && (
                            <span className="badge bg-light text-secondary border ms-2 small">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 text-muted small">{u.email}</td>
                      <td className="px-3">{renderRoleBadge(u.role)}</td>
                      <td className="px-3">{renderStatusBadge(u.isActive)}</td>
                      <td className="px-3 text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleOpenEdit(u)}
                            data-testid={`edit-btn-${u.id}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-outline-warning btn-sm text-dark"
                            onClick={() => handleOpenReset(u)}
                            data-testid={`reset-btn-${u.id}`}
                            title="Reset password"
                          >
                            🔑 Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="d-md-none d-flex flex-column gap-3 mb-4">
            {users.map((u) => (
              <div key={u.id} className="zen-card p-3 shadow-sm" data-testid={`user-card-${u.id}`}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h2 className="h6 fw-bold mb-0" style={{ color: "var(--color-text-main)" }}>
                      {u.name}
                      {currentUser && currentUser.id === u.id && (
                        <span className="badge bg-light text-secondary border ms-1 small">You</span>
                      )}
                    </h2>
                    <span className="text-muted small">{u.email}</span>
                  </div>
                  {renderStatusBadge(u.isActive)}
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                  <div>{renderRoleBadge(u.role)}</div>
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleOpenEdit(u)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-outline-warning btn-sm text-dark"
                      onClick={() => handleOpenReset(u)}
                    >
                      🔑 Reset
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <h2 className="modal-title h5 fw-bold mb-0">Create New User</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={createLoading}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {createError && (
                    <div className="alert alert-danger py-2 small mb-3">
                      {createError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Jane Doe"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      disabled={createLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="e.g. jane.doe@example.com"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      disabled={createLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
                      disabled={createLoading}
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Initial Password</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={createForm.initialPassword}
                      onChange={(e) => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                      disabled={createLoading}
                    />
                    <div className="form-text small text-muted">
                      User will be prompted to change password on first login.
                    </div>
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="createActiveSwitch"
                      checked={createForm.isActive}
                      onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                      disabled={createLoading}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="createActiveSwitch">
                      Account is Active
                    </label>
                  </div>
                </div>

                <div className="modal-footer py-2 bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-zen-primary btn-sm"
                    disabled={createLoading}
                  >
                    {createLoading ? "Saving..." : "Save User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditOpen && editingUser && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <h2 className="modal-title h5 fw-bold mb-0">Edit User</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setIsEditOpen(false)}
                    disabled={editLoading}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger py-2 small mb-3">
                      {editError}
                    </div>
                  )}

                  {/* Safety alerts */}
                  {isEditingSelf && (
                    <div className="alert alert-warning py-2 small mb-3" data-testid="self-deactivation-warning">
                      ⚠️ <strong>BR-10 Notice:</strong> You cannot deactivate your own account.
                    </div>
                  )}

                  {isEditingLastAdmin && (
                    <div className="alert alert-warning py-2 small mb-3" data-testid="last-admin-warning">
                      ⚠️ <strong>BR-11 Notice:</strong> Cannot deactivate or demote the system&apos;s last active Administrator.
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      disabled={editLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      disabled={editLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                      disabled={editLoading || !!isEditingLastAdmin}
                      data-testid="edit-role-select"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                    {isEditingLastAdmin && (
                      <div className="form-text small text-danger">
                        Demotion disabled: at least one active Administrator must remain.
                      </div>
                    )}
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="editActiveSwitch"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      disabled={editLoading || isEditingSelf || !!isEditingLastAdmin}
                      data-testid="edit-active-switch"
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="editActiveSwitch">
                      Account is Active
                    </label>
                    {(isEditingSelf || isEditingLastAdmin) && (
                      <div className="form-text small text-muted">
                        Deactivation is disabled to prevent system lockout.
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer py-2 bg-light d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm text-dark"
                    onClick={() => {
                      setIsEditOpen(false);
                      handleOpenReset(editingUser);
                    }}
                    disabled={editLoading}
                  >
                    🔑 Reset Initial Password
                  </button>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setIsEditOpen(false)}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-zen-primary btn-sm"
                      disabled={editLoading}
                      data-testid="save-user-btn"
                    >
                      {editLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetOpen && resetTargetUser && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <form onSubmit={handleResetSubmit}>
                <div className="modal-header py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <h2 className="modal-title h5 fw-bold mb-0">Reset Password</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setIsResetOpen(false)}
                    disabled={resetLoading}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {resetError && (
                    <div className="alert alert-danger py-2 small mb-3">
                      {resetError}
                    </div>
                  )}

                  <p className="small text-muted mb-3">
                    Assign a temporary password for <strong>{resetTargetUser.name}</strong> ({resetTargetUser.email}).
                    The user will be required to change this password on their next login.
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Temporary Initial Password</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      minLength={6}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      disabled={resetLoading}
                      data-testid="reset-password-input"
                    />
                  </div>
                </div>

                <div className="modal-footer py-2 bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setIsResetOpen(false)}
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning btn-sm text-dark fw-semibold"
                    disabled={resetLoading}
                    data-testid="confirm-reset-btn"
                  >
                    {resetLoading ? "Resetting..." : "Confirm Password Reset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
