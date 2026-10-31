import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  StaffDashboardResponse,
  apiGetStaffDashboard,
} from "../api.js";

interface StaffDashboardProps {
  onSelectTicket: (ticketId: number) => void;
  onNavigateQueue: (filter?: { status?: string; ownerId?: string }) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onSelectTicket,
  onNavigateQueue,
}) => {
  const { user, token } = useAuth();
  const [data, setData] = useState<StaffDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetStaffDashboard(token);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const renderStatusBadge = (status: string) => {
    const norm = status.toUpperCase();
    let badgeClass = "badge-status-new";
    if (norm === "OPEN" || norm === "IN_PROGRESS") badgeClass = "badge-status-inprogress";
    if (norm === "RESOLVED" || norm === "CLOSED") badgeClass = "badge-status-resolved";
    if (norm === "REOPENED") badgeClass = "badge-status-reopened";
    if (norm === "WAITING_FOR_REQUESTER") badgeClass = "bg-warning text-dark";
    if (norm === "CANCELLED") badgeClass = "badge-status-cancelled";

    return (
      <span className={`badge rounded-pill px-2 py-1 ${badgeClass} small`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const renderPriorityBadge = (p?: string | null) => {
    if (!p) return <span className="text-muted small">—</span>;
    const norm = p.toUpperCase();
    let badgeClass = "badge-priority-medium";
    if (norm === "LOW") badgeClass = "badge-priority-low";
    if (norm === "HIGH") badgeClass = "badge-priority-high";
    if (norm === "URGENT") badgeClass = "badge-priority-urgent";

    return <span className={`badge rounded-pill px-2 py-1 ${badgeClass} small`}>{p}</span>;
  };

  if (loading) {
    return (
      <div className="zen-card p-5 text-center text-muted">
        <div className="spinner-border text-success mb-3" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="mb-0">Loading IT Service Desk overview...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="zen-card p-4 text-center">
        <div className="alert alert-danger mb-3">⚠️ {error || "Unable to load dashboard data."}</div>
        <button type="button" className="btn btn-zen-primary btn-sm" onClick={loadDashboard}>
          🔄 Retry
        </button>
      </div>
    );
  }

  const { metrics, priorityBreakdown, recentQueueTickets, adminStats } = data;

  return (
    <div className="container-fluid px-0">
      {/* 1. Welcome Banner */}
      <div className="zen-card p-4 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h4 fw-bold mb-0" style={{ color: "var(--color-primary)" }}>
                IT Operations Dashboard
              </h1>
              <span className="badge bg-success-subtle text-success border border-success small">
                {user?.role === "ADMIN" ? "Administrator" : "IT Staff"}
              </span>
            </div>
            <p className="text-muted small mb-0">
              Welcome, {user?.name || "Staff Member"}. Real-time workload, queue volume, and priority breakdown.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-zen-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => onNavigateQueue()}
          >
            <span>📥</span>
            <span>View Ticket Queue</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (5-Column Responsive Grid) */}
      <div className="row g-3 mb-4">
        {/* New Tickets */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-info cursor-pointer"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateQueue({ status: "NEW" })}
            data-testid="metric-new-tickets"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">New</div>
            <div className="h3 fw-bold mb-1 text-info">{metrics.newTickets}</div>
            <div className="text-muted small">Untriaged incoming</div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-primary cursor-pointer"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateQueue({ status: "OPEN" })}
            data-testid="metric-open-tickets"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">Open</div>
            <div className="h3 fw-bold mb-1 text-primary">{metrics.openTickets}</div>
            <div className="text-muted small">Awaiting investigation</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-6 col-md-4 col-lg">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-warning cursor-pointer"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateQueue({ status: "IN_PROGRESS" })}
            data-testid="metric-in-progress"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">In Progress</div>
            <div className="h3 fw-bold mb-1 text-warning">{metrics.inProgress}</div>
            <div className="text-muted small">Active staff handling</div>
          </div>
        </div>

        {/* Waiting for Requester */}
        <div className="col-6 col-md-6 col-lg">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-secondary cursor-pointer"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateQueue({ status: "WAITING_FOR_REQUESTER" })}
            data-testid="metric-waiting-requester"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">Waiting</div>
            <div className="h3 fw-bold mb-1 text-secondary">{metrics.waitingForRequester}</div>
            <div className="text-muted small">Awaiting user response</div>
          </div>
        </div>

        {/* My Assigned */}
        <div className="col-12 col-md-6 col-lg">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-success cursor-pointer"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateQueue({ ownerId: "me" })}
            data-testid="metric-my-assigned"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">My Assigned</div>
            <div className="h3 fw-bold mb-1 text-success">{metrics.myAssigned}</div>
            <div className="text-muted small">Assigned to you</div>
          </div>
        </div>
      </div>

      {/* 3. Operational Split (8:4 Grid) */}
      <div className="row g-4">
        {/* Left Column (8 cols): Recent Queue Tickets */}
        <div className="col-12 col-lg-8">
          <div className="zen-card p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 fw-bold mb-0">Recent Queue Activity</h2>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                style={{ color: "var(--color-primary)" }}
                onClick={() => onNavigateQueue()}
              >
                View Full Queue →
              </button>
            </div>

            {recentQueueTickets.length === 0 ? (
              <div className="p-5 text-center my-3 bg-light rounded-3" data-testid="empty-queue-state">
                <div className="fs-1 text-muted mb-2">🎉</div>
                <h3 className="h6 fw-bold text-dark mb-1">All caught up! No active tickets in the queue.</h3>
                <p className="text-muted small mb-0">
                  Great work! All incoming support requests have been resolved or triaged.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th scope="col">Ticket No.</th>
                      <th scope="col">Summary</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Requester</th>
                      <th scope="col">Updated</th>
                      <th scope="col" className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQueueTickets.map((t) => (
                      <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => onSelectTicket(t.id)}>
                        <td className="fw-semibold font-monospace small" style={{ color: "var(--color-primary)" }}>
                          {t.ticketNumber}
                        </td>
                        <td className="small text-truncate" style={{ maxWidth: 200 }}>
                          {t.summary}
                        </td>
                        <td>{renderStatusBadge(t.currentStatus)}</td>
                        <td>{renderPriorityBadge(t.itPriority || t.requestedPriority)}</td>
                        <td className="small text-muted">{t.requester?.name || "—"}</td>
                        <td className="text-muted small">
                          {new Date(t.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm py-0 px-2 small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTicket(t.id);
                            }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Priority Breakdown & Quick Actions */}
        <div className="col-12 col-lg-4">
          {/* Priority Breakdown Card */}
          <div className="zen-card p-4 shadow-sm mb-4" data-testid="priority-breakdown-card">
            <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              <span>🎯</span>
              <span>Active Priority Breakdown</span>
            </h2>
            <div className="row g-2 text-center">
              <div className="col-6">
                <div className="p-2 border rounded bg-danger-subtle border-danger">
                  <div className="small fw-semibold text-danger">URGENT</div>
                  <div className="h4 fw-bold mb-0 text-danger">{priorityBreakdown.URGENT}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded bg-warning-subtle border-warning">
                  <div className="small fw-semibold text-warning-emphasis">HIGH</div>
                  <div className="h4 fw-bold mb-0 text-warning-emphasis">{priorityBreakdown.HIGH}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded bg-info-subtle border-info">
                  <div className="small fw-semibold text-info-emphasis">MEDIUM</div>
                  <div className="h4 fw-bold mb-0 text-info-emphasis">{priorityBreakdown.MEDIUM}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded bg-light border-secondary">
                  <div className="small fw-semibold text-secondary">LOW</div>
                  <div className="h4 fw-bold mb-0 text-secondary">{priorityBreakdown.LOW}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="zen-card p-4 shadow-sm mb-4">
            <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
              <span>⚡</span>
              <span>Quick Queue Filters</span>
            </h2>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-outline-success btn-sm py-2 d-flex align-items-center justify-content-between"
                onClick={() => onNavigateQueue({ ownerId: "me" })}
              >
                <span>👤 My Assigned Queue</span>
                <span className="badge bg-success">{metrics.myAssigned}</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-warning btn-sm py-2 d-flex align-items-center justify-content-between text-dark"
                onClick={() => onNavigateQueue({ ownerId: "unassigned" })}
              >
                <span>📥 Unassigned Tickets</span>
                <span className="badge bg-warning text-dark">{metrics.unassigned}</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => onNavigateQueue()}
              >
                <span>🔍 Browse All Tickets</span>
              </button>
            </div>
          </div>

          {/* Admin Stats Card (if Admin) */}
          {adminStats && (
            <div className="zen-card p-4 shadow-sm" data-testid="admin-stats-card">
              <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                <span>🛡️</span>
                <span>System Administration</span>
              </h2>
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <span className="small text-muted">Total Registered Users:</span>
                <span className="fw-bold small">{adminStats.totalUsers}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">Active Users:</span>
                <span className="fw-bold text-success small">{adminStats.activeUsers}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
