import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export const ChangePassword: React.FC = () => {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password complexity checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUpperAndLower &&
    hasNumber &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      if (!passwordsMatch) {
        setErrorMessage("New password and confirmation do not match.");
      } else {
        setErrorMessage("Please fulfill all password requirements.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3 py-5">
      <div className="card shadow-sm border-0" style={{ maxWidth: "460px", width: "100%", borderRadius: "12px" }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <h4 className="fw-bold" style={{ color: "#1A2E22" }}>Change Your Password</h4>
            <p className="text-muted small">You must change your password to continue.</p>
          </div>

          {errorMessage && (
            <div
              className="alert alert-danger d-flex align-items-center mb-4 py-2 px-3 small border-0"
              role="alert"
              style={{ backgroundColor: "#FDF2F2", color: "#DC3545", borderRadius: "8px" }}
            >
              <svg className="me-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="currentPasswordInput" className="form-label small fw-semibold" style={{ color: "#1A2E22" }}>
                Current (temporary) password
              </label>
              <input
                id="currentPasswordInput"
                type="password"
                className="form-control"
                style={{ height: "44px", borderRadius: "8px" }}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="newPasswordInput" className="form-label small fw-semibold" style={{ color: "#1A2E22" }}>
                New password
              </label>
              <input
                id="newPasswordInput"
                type="password"
                className="form-control"
                style={{ height: "44px", borderRadius: "8px" }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPasswordInput" className="form-label small fw-semibold" style={{ color: "#1A2E22" }}>
                Confirm new password
              </label>
              <input
                id="confirmPasswordInput"
                type="password"
                className={`form-control ${confirmPassword && !passwordsMatch ? "is-invalid" : ""}`}
                style={{ height: "44px", borderRadius: "8px" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && !passwordsMatch && (
                <div className="invalid-feedback">Passwords do not match</div>
              )}
            </div>

            {/* Checklist */}
            <div className="mb-4 p-3 bg-light rounded" style={{ fontSize: "0.85rem" }}>
              <div className="fw-semibold mb-2" style={{ color: "#52665A" }}>Password must:</div>
              <div className={`d-flex align-items-center mb-1 ${hasMinLength ? "text-success fw-semibold" : "text-muted"}`}>
                <span className="me-2">{hasMinLength ? "✓" : "○"}</span> Be at least 8 characters
              </div>
              <div className={`d-flex align-items-center mb-1 ${hasUpperAndLower ? "text-success fw-semibold" : "text-muted"}`}>
                <span className="me-2">{hasUpperAndLower ? "✓" : "○"}</span> Include upper and lower case letters
              </div>
              <div className={`d-flex align-items-center ${hasNumber ? "text-success fw-semibold" : "text-muted"}`}>
                <span className="me-2">{hasNumber ? "✓" : "○"}</span> Include a number
              </div>
            </div>

            <button
              type="submit"
              className="btn w-100 text-white fw-semibold mb-2"
              disabled={!isFormValid || isSubmitting}
              style={{
                backgroundColor: "#006B3C",
                height: "44px",
                borderRadius: "8px",
              }}
            >
              {isSubmitting ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Saving...
                </span>
              ) : (
                "Continue"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              style={{ height: "40px", borderRadius: "8px" }}
              onClick={logout}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
