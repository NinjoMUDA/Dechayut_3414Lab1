import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext.js";
import {
  RequesterDashboardResponse,
  apiGetRequesterDashboard,
} from "../api.js";

interface RequesterDashboardProps {
  onSelectTicket: (ticketId: number) => void;
  onNavigateCreate: () => void;
  onNavigateMyTickets: (statusFilter?: string) => void;
}

export const RequesterDashboard: React.FC<RequesterDashboardProps> = ({
  onSelectTicket,
  onNavigateCreate,
  onNavigateMyTickets,
}) => {
  const { activeRequester } = useRequester();
  const [data, setData] = useState<RequesterDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!activeRequester) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetRequesterDashboard(activeRequester.id);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [activeRequester]);

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

  const renderPriorityBadge = (p: string) => {
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
        <p className="mb-0">Loading your support dashboard...</p>
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

  const { metrics, recentTickets } = data;

  return (
    <div className="container-fluid px-0">
      {/* 1. Welcome Banner */}
      <div className="zen-card p-4 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h1 className="h4 fw-bold mb-1" style={{ color: "var(--color-primary)" }}>
              Welcome back, {activeRequester?.name || "Requester"} 👋
            </h1>
            <p className="text-muted small mb-0">
              Overview of your IT support tickets, status updates, and recent activity.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-zen-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={onNavigateCreate}
          >
            <span>+</span>
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. 4-Column Metric Cards */}
      <div className="row g-3 mb-4">
        {/* My Open Tickets */}
        <div className="col-6 col-md-3">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-success cursor-pointer"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateMyTickets("OPEN")}
            data-testid="metric-open-tickets"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">My Open Tickets</div>
            <div className="h2 fw-bold mb-1 text-success">{metrics.myOpenTickets}</div>
            <div className="text-muted small">Requires attention or active</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-6 col-md-3">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-primary"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateMyTickets("IN_PROGRESS")}
            data-testid="metric-in-progress"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">In Progress</div>
            <div className="h2 fw-bold mb-1 text-primary">{metrics.inProgress}</div>
            <div className="text-muted small">Being worked on by IT</div>
          </div>
        </div>

        {/* Resolved */}
        <div className="col-6 col-md-3">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-info"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateMyTickets("RESOLVED")}
            data-testid="metric-resolved"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">Resolved</div>
            <div className="h2 fw-bold mb-1 text-info">{metrics.resolved}</div>
            <div className="text-muted small">Pending confirmation/closing</div>
          </div>
        </div>

        {/* Closed */}
        <div className="col-6 col-md-3">
          <div
            className="zen-card p-3 h-100 shadow-sm border-start border-4 border-secondary"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateMyTickets("CLOSED")}
            data-testid="metric-closed"
          >
            <div className="text-muted small fw-semibold text-uppercase mb-1">Closed</div>
            <div className="h2 fw-bold mb-1 text-secondary">{metrics.closed}</div>
            <div className="text-muted small">Completed & archived</div>
          </div>
        </div>
      </div>

      {/* 3. Split 8:4 Grid */}
      <div className="row g-4">
        {/* Left Column (8 cols): Recent Tickets */}
        <div className="col-12 col-lg-8">
          <div className="zen-card p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 fw-bold mb-0">My Recent Tickets</h2>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                style={{ color: "var(--color-primary)" }}
                onClick={() => onNavigateMyTickets()}
              >
                View All My Tickets →
              </button>
            </div>

            {recentTickets.length === 0 ? (
              <div className="p-5 text-center my-3 bg-light rounded-3" data-testid="empty-tickets-state">
                <div className="fs-1 text-muted mb-2">🎫</div>
                <h3 className="h6 fw-bold text-dark mb-1">You have not submitted any tickets yet.</h3>
                <p className="text-muted small mb-3">
                  Need help with an IT issue, equipment, or access? Submit a request anytime.
                </p>
                <button
                  type="button"
                  className="btn btn-zen-primary btn-sm px-3 shadow-sm"
                  onClick={onNavigateCreate}
                >
                  Submit Your First Ticket
                </button>
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
                      <th scope="col">Updated</th>
                      <th scope="col" className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((t) => (
                      <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => onSelectTicket(t.id)}>
                        <td className="fw-semibold font-monospace small" style={{ color: "var(--color-primary)" }}>
                          {t.ticketNumber}
                        </td>
                        <td className="small text-truncate" style={{ maxWidth: 220 }}>
                          {t.summary}
                        </td>
                        <td>{renderStatusBadge(t.currentStatus)}</td>
                        <td>{renderPriorityBadge(t.requestedPriority)}</td>
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
                            View
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

        {/* Right Column (4 cols): Quick Actions & Support Help */}
        <div className="col-12 col-lg-4">
          {/* Quick Actions Card */}
          <div className="zen-card p-4 shadow-sm mb-4">
            <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
              <span>⚡</span>
              <span>Quick Actions</span>
            </h2>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-zen-primary btn-sm py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={onNavigateCreate}
              >
                <span>➕</span>
                <span>Create New Ticket</span>
              </button>
              <button
                type="button"
                className="btn btn-zen-secondary btn-sm py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => onNavigateMyTickets()}
              >
                <span>📋</span>
                <span>View All My Tickets</span>
              </button>
            </div>
          </div>

          {/* Helpdesk Contact Card */}
          <div className="zen-card p-4 shadow-sm">
            <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              <span>📞</span>
              <span>IT Service Desk Support</span>
            </h2>
            <div className="small text-muted mb-2">
              <strong>Operating Hours:</strong> Mon – Fri, 08:30 – 17:30
            </div>
            <div className="small text-muted mb-2">
              <strong>Direct Extension:</strong> +66 2 470 9000
            </div>
            <div className="small text-muted mb-3">
              <strong>Support Email:</strong> support@toktickit.com
            </div>
            <div className="p-2 bg-light rounded text-muted small">
              💡 For urgent server or security outages after hours, contact your on-call supervisor.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
