import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3 py-5">
      <div className="card shadow-sm border-0" style={{ maxWidth: "420px", width: "100%", borderRadius: "12px" }}>
        <div className="card-body p-4 p-md-5">
          {/* Brand Header */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: "48px", height: "48px", backgroundColor: "#EAF6EF", color: "#006B3C" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h4 className="fw-bold" style={{ color: "#1A2E22" }}>TokTickIT</h4>
            <p className="text-muted small">Sign in to your account</p>
          </div>

          {/* Error Banner */}
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label small fw-semibold" style={{ color: "#1A2E22" }}>
                Email address
              </label>
              <input
                id="emailInput"
                type="email"
                className="form-control"
                style={{ height: "44px", borderRadius: "8px" }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="passwordInput" className="form-label small fw-semibold" style={{ color: "#1A2E22" }}>
                Password
              </label>
              <div className="input-group">
                <input
                  id="passwordInput"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  style={{ height: "44px", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn w-100 text-white fw-semibold"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#006B3C",
                height: "44px",
                borderRadius: "8px",
                transition: "background-color 0.2s",
              }}
            >
              {isSubmitting ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
