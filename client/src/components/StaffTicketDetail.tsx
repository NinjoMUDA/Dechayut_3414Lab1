import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  Ticket,
  User,
  PublicComment,
  InternalNote,
  Priority,
  TicketStatus,
  getTicketDetail,
  getDownloadUrl,
  apiGetStaffUsers,
  apiUpdateStaffTicket,
  apiGetComments,
  apiAddComment,
  apiGetNotes,
  apiAddNote,
  apiResolveTicket,
} from "../api.js";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "RESOLVED"],
  CANCELLED: ["REOPENED"],
  PENDING: ["OPEN", "IN_PROGRESS", "CANCELLED"],
};

export const StaffTicketDetail: React.FC<StaffTicketDetailProps> = ({
  ticketId,
  onBack,
}) => {
  const { token, user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);

  // Communications tab state
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");
  const [commentText, setCommentText] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);
  const [commError, setCommError] = useState<string | null>(null);

  // Operations state
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("MEDIUM");
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>("NEW");
  const [resolutionSummary, setResolutionSummary] = useState<string>("");
  const [isSavingOps, setIsSavingOps] = useState<boolean>(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [opsSuccess, setOpsSuccess] = useState<boolean>(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicketDetail(ticketId, undefined, token);
      setTicket(data);
      setSelectedOwnerId(data.ticketOwnerId ? String(data.ticketOwnerId) : "unassigned");
      setSelectedPriority((data.itPriority || data.requestedPriority) as Priority);
      setSelectedStatus(data.currentStatus);
      setResolutionSummary(data.resolutionSummary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [ticketId, token]);

  const loadCommunications = useCallback(async () => {
    try {
      const [comms, nts, stf] = await Promise.all([
        apiGetComments(ticketId, token).catch(() => []),
        apiGetNotes(ticketId, token).catch(() => []),
        apiGetStaffUsers(token).catch(() => []),
      ]);
      setComments(comms);
      setNotes(nts);
      setStaffUsers(stf);
    } catch {
      // Ignore background load failures
    }
  }, [ticketId, token]);

  useEffect(() => {
    loadTicket();
    loadCommunications();
  }, [loadTicket, loadCommunications]);

  const handleClaimTicket = () => {
    if (user) {
      setSelectedOwnerId(String(user.id));
    }
  };

  const handleSaveOperations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOps(true);
    setOpsError(null);
    setOpsSuccess(false);

    try {
      const ownerIdPayload =
        selectedOwnerId === "unassigned" || !selectedOwnerId
          ? null
          : Number(selectedOwnerId);

      const updated = await apiUpdateStaffTicket(
        ticketId,
        {
          ticketOwnerId: ownerIdPayload,
          itPriority: selectedPriority,
          currentStatus: selectedStatus,
          resolutionSummary: selectedStatus === "RESOLVED" ? resolutionSummary : undefined,
        },
        token
      );

      setTicket(updated);
      setOpsSuccess(true);
      setTimeout(() => setOpsSuccess(false), 3000);
    } catch (err) {
      setOpsError(err instanceof Error ? err.message : "Failed to update ticket operations");
    } finally {
      setIsSavingOps(false);
    }
  };

  const handleToggleRequesterResolution = async () => {
    if (!ticket) return;
    try {
      const nextResolved = !ticket.requesterResolved;
      await apiResolveTicket(ticketId, nextResolved, token);
      setTicket((prev) => (prev ? { ...prev, requesterResolved: nextResolved } : prev));
    } catch (err) {
      alert("Unable to update problem resolution status");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    setCommError(null);
    try {
      const added = await apiAddComment(ticketId, commentText.trim(), token);
      setComments((prev) => [...prev, added]);
      setCommentText("");
    } catch (err) {
      setCommError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    setCommError(null);
    try {
      const added = await apiAddNote(ticketId, noteText.trim(), token);
      setNotes((prev) => [...prev, added]);
      setNoteText("");
    } catch (err) {
      setCommError(err instanceof Error ? err.message : "Failed to add internal note");
    } finally {
      setSubmittingNote(false);
    }
  };

  const renderPriorityBadge = (p: string | null | undefined) => {
    if (!p) return <span className="text-muted small">—</span>;
    const norm = p.toUpperCase();
    let badgeClass = "badge-priority-medium";
    if (norm === "LOW") badgeClass = "badge-priority-low";
    if (norm === "HIGH") badgeClass = "badge-priority-high";
    if (norm === "URGENT") badgeClass = "badge-priority-urgent";

    return <span className={`badge rounded-pill px-2 py-1 ${badgeClass} small`}>{p}</span>;
  };

  const renderStatusBadge = (s: string) => {
    const norm = s.toUpperCase();
    let badgeClass = "badge-status-new";
    if (norm === "OPEN" || norm === "IN_PROGRESS") badgeClass = "badge-status-inprogress";
    if (norm === "RESOLVED" || norm === "CLOSED") badgeClass = "badge-status-resolved";
    if (norm === "WAITING_FOR_REQUESTER") badgeClass = "bg-warning text-dark";
    if (norm === "REOPENED") badgeClass = "bg-danger text-white";

    return (
      <span className={`badge rounded-pill px-2 py-1 ${badgeClass} small`}>
        {s.replace(/_/g, " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="zen-card p-5 text-center text-muted">
        <div className="spinner-border text-success mb-3" role="status">
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <p className="mb-0">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-card p-4 text-center">
        <div className="alert alert-danger mb-3">⚠️ {error || "Ticket not found"}</div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back to Queue
        </button>
      </div>
    );
  }

  const allowedStatuses = VALID_TRANSITIONS[ticket.currentStatus] || [];

  return (
    <div className="container-fluid px-0">
      {/* Breadcrumb Header */}
      <nav aria-label="breadcrumb" className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none text-muted"
              onClick={onBack}
            >
              My Queue
            </button>
          </li>
          <li className="breadcrumb-item active fw-bold text-dark" aria-current="page">
            Ticket Detail ({ticket.ticketNumber})
          </li>
        </ol>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          onClick={onBack}
        >
          <span>←</span>
          <span>Back to Queue</span>
        </button>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="row g-4">
        {/* Left Column: Ticket Context & Details */}
        <div className="col-12 col-lg-7">
          <div className="zen-card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <span className="h4 fw-bold mb-0 me-2" style={{ color: "var(--color-primary)" }}>
                  {ticket.ticketNumber}
                </span>
                <span className="text-muted small">
                  Created {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <div>{renderStatusBadge(ticket.currentStatus)}</div>
            </div>

            <h5 className="fw-bold mb-3">{ticket.summary}</h5>

            {/* Requester Resolution Indicator */}
            {ticket.requesterResolved ? (
              <div className="alert alert-success d-flex align-items-center justify-content-between mb-3 py-2 px-3 shadow-sm" role="alert">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">✅</span>
                  <div>
                    <strong>Problem Resolved</strong>
                    <div className="small text-muted">The requester marked their problem as solved.</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={handleToggleRequesterResolution}
                >
                  Unmark
                </button>
              </div>
            ) : (
              <div className="alert alert-light border d-flex align-items-center justify-content-between mb-3 py-2 px-3" role="alert">
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="fs-5">⏳</span>
                  <div className="small">The requester has not yet indicated problem resolution.</div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleToggleRequesterResolution}
                >
                  Mark Resolved
                </button>
              </div>
            )}

            {/* Context Details Grid */}
            <div className="row g-3 mb-4 bg-light p-3 rounded">
              <div className="col-6 col-md-4">
                <div className="small text-muted">Requester</div>
                <div className="fw-semibold small">{ticket.requester?.name || "Unknown"}</div>
                <div className="text-muted small text-truncate">{ticket.requester?.email}</div>
              </div>
              <div className="col-6 col-md-4">
                <div className="small text-muted">Category</div>
                <div className="fw-semibold small">{ticket.category?.name || "—"}</div>
              </div>
              <div className="col-6 col-md-4">
                <div className="small text-muted">Related System</div>
                <div className="fw-semibold small">{ticket.relatedSystem?.name || "—"}</div>
              </div>
              <div className="col-6 col-md-4">
                <div className="small text-muted">Req. Priority</div>
                <div>{renderPriorityBadge(ticket.requestedPriority)}</div>
              </div>
              <div className="col-6 col-md-4">
                <div className="small text-muted">IT Priority</div>
                <div>{renderPriorityBadge(ticket.itPriority)}</div>
              </div>
              <div className="col-6 col-md-4">
                <div className="small text-muted">Assigned Owner</div>
                <div className="fw-semibold small">
                  {ticket.ticketOwner?.name || "Unassigned"}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h6 className="fw-semibold text-muted text-uppercase small mb-2">Description</h6>
              <div className="p-3 bg-white border rounded" style={{ whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </div>
            </div>

            {/* Resolution Summary (if present) */}
            {ticket.resolutionSummary && (
              <div className="mb-4">
                <h6 className="fw-semibold text-success text-uppercase small mb-2">Resolution Summary</h6>
                <div className="p-3 bg-success-subtle border border-success rounded small">
                  {ticket.resolutionSummary}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div>
              <h6 className="fw-semibold text-muted text-uppercase small mb-2">
                Attachments ({ticket.attachments?.filter((a) => !a.isRemoved).length || 0})
              </h6>
              {(!ticket.attachments || ticket.attachments.filter((a) => !a.isRemoved).length === 0) ? (
                <p className="text-muted small mb-0">No attachments uploaded for this ticket.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {ticket.attachments
                    .filter((a) => !a.isRemoved)
                    .map((att) => (
                      <div
                        key={att.id}
                        className="list-group-item d-flex justify-content-between align-items-center px-0 py-2"
                      >
                        <div className="d-flex align-items-center gap-2 text-truncate">
                          <span>📎</span>
                          <span className="fw-semibold small text-truncate">{att.originalFilename}</span>
                          <span className="text-muted small">
                            ({(att.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <a
                          href={getDownloadUrl(att.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Staff Operations & Communications */}
        <div className="col-12 col-lg-5">
          {/* Operations Card */}
          <div className="zen-card p-4 mb-4 shadow-sm">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <span>⚙️</span>
              <span>Ticket Operations</span>
            </h5>

            {opsSuccess && (
              <div className="alert alert-success py-2 small mb-3">
                Ticket operations updated successfully!
              </div>
            )}
            {opsError && (
              <div className="alert alert-danger py-2 small mb-3">⚠️ {opsError}</div>
            )}

            <form onSubmit={handleSaveOperations}>
              {/* Ownership */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="ticketOwnerSelect" className="form-label small fw-semibold text-muted mb-0">
                    Assigned Staff
                  </label>
                  {user && String(user.id) !== selectedOwnerId && (
                    <button
                      type="button"
                      className="btn btn-link p-0 small text-decoration-none fw-semibold"
                      style={{ color: "var(--color-primary)" }}
                      onClick={handleClaimTicket}
                    >
                      ✋ Claim Ticket
                    </button>
                  )}
                </div>
                <select
                  id="ticketOwnerSelect"
                  className="form-select form-select-sm"
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                >
                  <option value="unassigned">Unassigned</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* IT Priority */}
              <div className="mb-3">
                <label htmlFor="itPrioritySelect" className="form-label small fw-semibold text-muted mb-1">
                  IT Priority
                </label>
                <select
                  id="itPrioritySelect"
                  className="form-select form-select-sm"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              {/* Ticket Status Transition */}
              <div className="mb-3">
                <label htmlFor="ticketStatusSelect" className="form-label small fw-semibold text-muted mb-1">
                  Status Transition
                </label>
                <select
                  id="ticketStatusSelect"
                  className="form-select form-select-sm"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                >
                  <option value={ticket.currentStatus}>
                    {ticket.currentStatus} (Current)
                  </option>
                  {allowedStatuses.map((st) => (
                    <option key={st} value={st}>
                      → {st}
                    </option>
                  ))}
                </select>
                <div className="form-text small">
                  Permitted transitions from {ticket.currentStatus}: {allowedStatuses.join(", ") || "None"}
                </div>
              </div>

              {/* Resolution Summary (when RESOLVED) */}
              {(selectedStatus === "RESOLVED" || ticket.currentStatus === "RESOLVED") && (
                <div className="mb-3">
                  <label htmlFor="resolutionSummaryInput" className="form-label small fw-semibold text-muted mb-1">
                    Resolution Summary
                  </label>
                  <textarea
                    id="resolutionSummaryInput"
                    className="form-control form-control-sm"
                    rows={3}
                    placeholder="Describe how the problem was resolved..."
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-zen-primary btn-sm w-100 shadow-sm"
                disabled={isSavingOps}
              >
                {isSavingOps ? "Saving Changes..." : "Save Operational Changes"}
              </button>
            </form>
          </div>

          {/* Communications Card */}
          <div className="zen-card p-4 shadow-sm">
            {/* Tabs */}
            <ul className="nav nav-pills nav-fill mb-3" role="tablist">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn-sm ${activeTab === "comments" ? "active bg-success" : "text-muted"}`}
                  onClick={() => setActiveTab("comments")}
                >
                  💬 Public Comments ({comments.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn-sm ${activeTab === "notes" ? "active bg-warning text-dark" : "text-muted"}`}
                  onClick={() => setActiveTab("notes")}
                >
                  🔒 Internal Notes ({notes.length})
                </button>
              </li>
            </ul>

            {commError && <div className="alert alert-danger py-1 small mb-3">⚠️ {commError}</div>}

            {/* Tab 1: Public Comments */}
            {activeTab === "comments" && (
              <div>
                <div
                  className="comments-feed mb-3 overflow-auto"
                  style={{ maxHeight: "300px" }}
                  data-testid="comments-feed"
                >
                  {comments.length === 0 ? (
                    <p className="text-muted small text-center my-3">No comments yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-2 mb-2 bg-light border rounded small">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">
                            {c.author?.name}
                            <span className="badge bg-secondary ms-1 small">
                              {c.author?.role}
                            </span>
                          </span>
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{c.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment}>
                  <div className="mb-2">
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Write a public comment (visible to requester)..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-outline-success btn-sm w-100"
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment ? "Posting..." : "Post Public Comment"}
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Internal Notes (Confidential) */}
            {activeTab === "notes" && (
              <div>
                <div className="alert alert-warning py-1 px-2 small mb-3 text-dark">
                  🔒 <strong>Confidential:</strong> Internal notes are visible only to IT Staff and Administrators.
                </div>

                <div
                  className="notes-feed mb-3 overflow-auto"
                  style={{ maxHeight: "280px" }}
                  data-testid="notes-feed"
                >
                  {notes.length === 0 ? (
                    <p className="text-muted small text-center my-3">No internal notes yet.</p>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-2 mb-2 rounded small"
                        style={{ backgroundColor: "#FFF8E1", border: "1px solid #FFE082" }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold text-dark">
                            {n.author?.name}
                            <span className="badge bg-warning text-dark ms-1 small">
                              {n.author?.role}
                            </span>
                          </span>
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{n.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote}>
                  <div className="mb-2">
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Add an internal note (staff & admin only)..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-warning btn-sm w-100 text-dark fw-semibold"
                    disabled={submittingNote || !noteText.trim()}
                  >
                    {submittingNote ? "Adding..." : "Add Internal Note"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffTicketDetail;
