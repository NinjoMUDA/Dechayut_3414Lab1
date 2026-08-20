import React, { useState, useEffect } from "react";
import { RequesterUser, getRequesters } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface RequesterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  canCancel?: boolean;
}

export const RequesterSelector: React.FC<RequesterSelectorProps> = ({
  isOpen,
  onClose,
  canCancel = true,
}) => {
  const { activeRequester, setActiveRequester } = useRequester();
  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequesters();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeRequester) {
      setSelectedId(activeRequester.id);
    } else if (requesters.length > 0) {
      setSelectedId(requesters[0].id);
    }
  }, [activeRequester, requesters]);

  const fetchRequesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRequesters();
      setRequesters(data);
      if (data.length > 0 && !activeRequester) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load requesters");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedId === "") return;
    const target = requesters.find((r) => r.id === Number(selectedId));
    if (target) {
      setActiveRequester(target);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
        <div className="modal-content zen-card border-0 shadow-lg p-3 p-md-4">
          <div className="modal-body text-center p-0">
            {/* Header Icon */}
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: 64,
                height: 64,
                backgroundColor: "var(--color-pale-green)",
                color: "var(--color-primary-green)",
                fontSize: 28,
              }}
            >
              👥
            </div>

            {/* Title & Explanatory Text */}
            <h2 className="h4 fw-bold mb-2" style={{ color: "var(--color-text-main)" }}>
              Select Development Requester
            </h2>
            <p className="text-muted small mb-4">
              Choose a development requester to simulate the current requester context for Lab 2.
              <br />
              <strong className="text-dark">This is for testing only and is not a login screen.</strong>
            </p>

            {/* Loading State */}
            {loading && (
              <div className="py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted small mt-2">Loading active requesters from database...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="alert alert-danger text-start small mb-3" role="alert">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <strong>⚠️ Error Loading Requesters</strong>
                  <button
                    className="btn btn-outline-danger btn-sm py-0 px-2"
                    onClick={fetchRequesters}
                  >
                    Retry
                  </button>
                </div>
                <div>{error}</div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && requesters.length === 0 && (
              <div className="alert alert-warning text-start small mb-3" role="alert">
                ⚠️ No active development requesters found. Please ensure database seed has been executed.
              </div>
            )}

            {/* Requester Dropdown */}
            {!loading && !error && requesters.length > 0 && (
              <div className="text-start mb-3">
                <label
                  htmlFor="requesterSelect"
                  className="form-label small fw-semibold"
                  style={{ color: "var(--color-text-main)" }}
                >
                  Development Requester <span className="text-danger">*</span>
                </label>
                <select
                  id="requesterSelect"
                  className="form-select form-select-lg fs-6 mb-2"
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                  style={{ borderColor: "var(--color-border-subtle)", height: 46 }}
                >
                  {requesters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.email})
                    </option>
                  ))}
                </select>
                <div className="d-flex align-items-center gap-1 text-muted small">
                  <span>ℹ️</span>
                  <span>Only active development requesters are shown.</span>
                </div>
              </div>
            )}

            {/* Lab 3 Authentication Notice Box */}
            <div
              className="p-3 text-start rounded-3 mb-4 d-flex align-items-start gap-2"
              style={{
                backgroundColor: "var(--color-pale-green)",
                border: "1px solid #C8E6D9",
              }}
            >
              <span className="fs-5">🛡️</span>
              <div>
                <div className="fw-semibold small text-success">Authentication coming in Lab 3</div>
                <div className="text-secondary small" style={{ fontSize: "0.8rem" }}>
                  In Lab 3, this selection will be replaced with secure authentication so you can access the
                  system with your own account.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2">
              {canCancel && activeRequester && (
                <button
                  type="button"
                  className="btn btn-zen-secondary px-4"
                  onClick={onClose}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="btn btn-zen-primary px-4 d-flex align-items-center gap-1"
                disabled={loading || requesters.length === 0 || selectedId === ""}
                onClick={handleContinue}
              >
                <span>Continue</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
