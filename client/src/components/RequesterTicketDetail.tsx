import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext.js";
import { Ticket, getTicketDetail } from "../api.js";
import { AttachmentSection } from "./AttachmentSection.js";

interface RequesterTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const RequesterTicketDetail: React.FC<RequesterTicketDetailProps> = ({
  ticketId,
  onBack,
}) => {
  const { activeRequester } = useRequester();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!activeRequester) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getTicketDetail(ticketId, activeRequester.id);
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [ticketId, activeRequester]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const renderPriorityBadge = (p?: string | null) => {
    if (!p) return <span className="text-muted small">Unassigned</span>;
    const norm = p.toUpperCase();
    let badgeClass = "badge-priority-medium";
    if (norm === "LOW") badgeClass = "badge-priority-low";
    if (norm === "HIGH") badgeClass = "badge-priority-high";
    if (norm === "URGENT") badgeClass = "badge-priority-urgent";

    return <span className={`badge rounded-pill px-3 py-1 ${badgeClass}`}>{p}</span>;
  };

  const renderStatusBadge = (s: string) => {
    const norm = s.toUpperCase();
    let badgeClass = "badge-status-new";
    if (norm === "OPEN" || norm === "IN_PROGRESS") badgeClass = "badge-status-inprogress";
    if (norm === "RESOLVED" || norm === "CLOSED") badgeClass = "badge-status-resolved";

    return <span className={`badge rounded-pill px-3 py-1 ${badgeClass}`}>{s}</span>;
  };

  if (loading) {
    return (
      <div className="zen-card p-5 text-center my-4">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted small mt-2">Loading ticket details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="zen-card p-5 text-center my-4">
        <div className="fs-1 text-danger mb-2">🚫</div>
        <h2 className="h5 fw-bold text-danger mb-2">Access Restricted</h2>
        <p className="text-muted small mb-4">{error}</p>
        <button type="button" className="btn btn-zen-primary btn-sm px-4" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="container-fluid px-0" style={{ maxWidth: 1100 }}>
      {/* Top Header & Breadcrumb */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 small">
            <li className="breadcrumb-item">
              <a
                href="#my-tickets"
                className="text-decoration-none"
                style={{ color: "var(--color-secondary-green)" }}
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
              >
                My Tickets
              </a>
            </li>
            <li className="breadcrumb-item active font-monospace fw-semibold" aria-current="page">
              {ticket.ticketNumber}
            </li>
          </ol>
        </nav>

        <button
          type="button"
          className="btn btn-zen-secondary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
          onClick={onBack}
        >
          <span>← Back to My Tickets</span>
        </button>
      </div>

      {/* Ticket Details Read-Only Grid Card (Figure 1 in labsheet) */}
      <div className="zen-card p-4 p-md-5 mb-4">
        <div className="border-bottom pb-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="badge bg-light text-muted border mb-1">Ticket Details (View Mode)</span>
            <h1 className="h3 fw-bold mb-0" style={{ color: "var(--color-text-main)" }}>
              Ticket No. <span className="font-monospace text-success">{ticket.ticketNumber}</span>
            </h1>
          </div>
          <div>{renderStatusBadge(ticket.currentStatus)}</div>
        </div>

        {/* Read-Only Grid */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">Ticket Date</div>
              <div className="fw-medium small">{formatDate(ticket.createdAt)}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">Category</div>
              <div className="fw-medium small">{ticket.category?.name || "-"}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">Related System</div>
              <div className="fw-medium small">{ticket.relatedSystem?.name || "-"}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">Requester</div>
              <div className="fw-medium small">{ticket.requester?.name || activeRequester?.name}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">Requested Priority</div>
              <div>{renderPriorityBadge(ticket.requestedPriority)}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">IT Priority</div>
              <div>{renderPriorityBadge(ticket.itPriority)}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">Ticket Owner</div>
              <div className="fw-medium small text-muted">Unassigned (IT Triage)</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 border bg-light h-100">
              <div className="text-muted small fw-semibold mb-1">Last Updated</div>
              <div className="fw-medium small">{formatDate(ticket.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mb-4">
          <label className="form-label small fw-semibold text-muted mb-1">Problem Summary</label>
          <div className="p-3 rounded-3 border bg-white fw-medium" style={{ color: "var(--color-text-main)" }}>
            {ticket.summary}
          </div>
        </div>

        {/* Description Card */}
        <div>
          <label className="form-label small fw-semibold text-muted mb-1">Full Description</label>
          <div
            className="p-3 rounded-3 border bg-white"
            style={{
              color: "var(--color-text-main)",
              whiteSpace: "pre-wrap",
              minHeight: 100,
              backgroundColor: "#FCFDFD",
            }}
          >
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <AttachmentSection
        ticketId={ticket.id}
        initialAttachments={ticket.attachments}
        onAttachmentsUpdated={fetchDetail}
      />
    </div>
  );
};
