import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  Ticket,
  Category,
  getCategories,
  apiGetStaffTickets,
} from "../api.js";
import { StaffQueuePagination } from "../types/index.js";

interface StaffTicketQueueProps {
  onSelectTicket?: (ticket: Ticket) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({
  onSelectTicket,
}) => {
  const { token, user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<StaffQueuePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  // Filter & Search states
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [requestedPriority, setRequestedPriority] = useState<string>("ALL");
  const [itPriority, setItPriority] = useState<string>("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL"); // "ALL", "me", "unassigned"
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // UI loading & error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch {
      // Ignored for filter fallback
    }
  };

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiGetStaffTickets(
        {
          search,
          category,
          status,
          requestedPriority,
          itPriority,
          ownerId: ownerFilter,
          sortBy,
          sortOrder,
          page: currentPage,
          pageSize: 10,
        },
        token
      );

      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket queue");
    } finally {
      setLoading(false);
    }
  }, [
    token,
    search,
    category,
    status,
    requestedPriority,
    itPriority,
    ownerFilter,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setStatus("ALL");
    setRequestedPriority("ALL");
    setItPriority("ALL");
    setOwnerFilter("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "ALL" ||
    status !== "ALL" ||
    requestedPriority !== "ALL" ||
    itPriority !== "ALL" ||
    ownerFilter !== "ALL";

  const renderPriorityBadge = (p: string | null | undefined) => {
    if (!p) {
      return <span className="text-muted small">—</span>;
    }
    const norm = p.toUpperCase();
    let badgeClass = "badge-priority-medium";
    if (norm === "LOW") badgeClass = "badge-priority-low";
    if (norm === "HIGH") badgeClass = "badge-priority-high";
    if (norm === "URGENT") badgeClass = "badge-priority-urgent";

    return (
      <span className={`badge rounded-pill px-2 py-1 ${badgeClass} small`}>
        {p}
      </span>
    );
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

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="container-fluid px-0">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>
            Ticket Queue
          </h1>
          <p className="text-muted small mb-0">
            {loading
              ? "Updating queue..."
              : pagination.total === 0
              ? "0 tickets found"
              : `Showing ${startItem} to ${endItem} of ${pagination.total} tickets`}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleClearFilters}
            >
              ? Clear Filters
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-success btn-sm"
            onClick={fetchQueue}
            disabled={loading}
          >
            ?? Refresh
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="zen-card p-3 p-md-4 mb-4">
        <div className="row g-3">
          {/* Keyword Search */}
          <div className="col-12 col-lg-4">
            <label htmlFor="staffQueueSearchInput" className="form-label small fw-semibold text-muted mb-1">
              Search
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted">??</span>
              <input
                type="text"
                id="staffQueueSearchInput"
                className="form-control"
                placeholder="Search by ticket number or summary..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <label htmlFor="staffQueueCategoryFilter" className="form-label small fw-semibold text-muted mb-1">
              Category
            </label>
            <select
              id="staffQueueCategoryFilter"
              className="form-select form-select-sm"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <label htmlFor="staffQueueStatusFilter" className="form-label small fw-semibold text-muted mb-1">
              Status
            </label>
            <select
              id="staffQueueStatusFilter"
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="WAITING_FOR_REQUESTER">WAITING FOR REQUESTER</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REOPENED">REOPENED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Requested Priority Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <label htmlFor="staffQueueReqPriorityFilter" className="form-label small fw-semibold text-muted mb-1">
              Req. Priority
            </label>
            <select
              id="staffQueueReqPriorityFilter"
              className="form-select form-select-sm"
              value={requestedPriority}
              onChange={(e) => {
                setRequestedPriority(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {/* IT Priority Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <label htmlFor="staffQueueItPriorityFilter" className="form-label small fw-semibold text-muted mb-1">
              IT Priority
            </label>
            <select
              id="staffQueueItPriorityFilter"
              className="form-select form-select-sm"
              value={itPriority}
              onChange={(e) => {
                setItPriority(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All IT Priorities</option>
              <option value="UNASSIGNED">Unassigned (None)</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {/* Assignment Filter */}
          <div className="col-12 col-md-6 col-lg-4">
            <label htmlFor="staffQueueAssignmentFilter" className="form-label small fw-semibold text-muted mb-1">
              Assignment
            </label>
            <div className="btn-group btn-group-sm w-100" role="group" id="staffQueueAssignmentFilter">
              <button
                type="button"
                className={`btn ${ownerFilter === "ALL" ? "btn-zen-primary" : "btn-outline-secondary"}`}
                onClick={() => {
                  setOwnerFilter("ALL");
                  setCurrentPage(1);
                }}
              >
                All
              </button>
              <button
                type="button"
                className={`btn ${ownerFilter === "me" ? "btn-zen-primary" : "btn-outline-secondary"}`}
                onClick={() => {
                  setOwnerFilter("me");
                  setCurrentPage(1);
                }}
              >
                Assigned to Me
              </button>
              <button
                type="button"
                className={`btn ${ownerFilter === "unassigned" ? "btn-zen-primary" : "btn-outline-secondary"}`}
                onClick={() => {
                  setOwnerFilter("unassigned");
                  setCurrentPage(1);
                }}
              >
                Unassigned
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger shadow-sm d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>?? {error}</div>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={fetchQueue}>
            Retry
          </button>
        </div>
      )}

      {/* Tickets List Area */}
      {loading ? (
        <div className="zen-card p-5 text-center text-muted">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mb-0">Loading ticket queue...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="zen-card p-5 text-center text-muted">
          <div className="display-6 mb-3">??</div>
          <h5 className="fw-semibold text-dark">No tickets found</h5>
          <p className="small mb-3">
            {hasActiveFilters
              ? "Try adjusting your search criteria or clearing filters to see more results."
              : "The IT Staff ticket queue is currently empty."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 992px) */}
          <div className="zen-card table-responsive d-none d-lg-block mb-4">
            <table className="table table-hover align-middle mb-0" data-testid="staff-queue-table">
              <thead className="table-light">
                <tr className="small text-muted text-uppercase">
                  <th
                    style={{ cursor: "pointer", width: "15%" }}
                    onClick={() => handleSort("ticketNumber")}
                  >
                    Ticket No {sortBy === "ticketNumber" && (sortOrder === "asc" ? "?" : "?")}
                  </th>
                  <th
                    style={{ cursor: "pointer", width: "13%" }}
                    onClick={() => handleSort("createdAt")}
                  >
                    Created {sortBy === "createdAt" && (sortOrder === "asc" ? "?" : "?")}
                  </th>
                  <th style={{ width: "24%" }}>Summary</th>
                  <th style={{ width: "10%" }}>Category</th>
                  <th style={{ width: "9%" }}>Req. Pri</th>
                  <th style={{ width: "9%" }}>IT Pri</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "10%" }}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    data-testid={`staff-queue-row-${t.id}`}
                    style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                    onClick={() => onSelectTicket?.(t)}
                  >
                    <td>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none fw-bold"
                        style={{ color: "var(--color-primary)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket?.(t);
                        }}
                      >
                        {t.ticketNumber}
                      </button>
                    </td>
                    <td className="small text-muted">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: "260px" }} title={t.summary}>
                        {t.summary}
                      </div>
                      <div className="small text-muted">
                        Req: {t.requester?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="small">{t.category?.name || "—"}</td>
                    <td>{renderPriorityBadge(t.requestedPriority)}</td>
                    <td>{renderPriorityBadge(t.itPriority)}</td>
                    <td>{renderStatusBadge(t.currentStatus)}</td>
                    <td className="small">
                      {t.ticketOwner ? (
                        <span className="badge bg-light text-dark border">
                          ?? {t.ticketOwner.name}
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-muted">
                          Unassigned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 992px) */}
          <div className="d-block d-lg-none mb-4">
            <div className="row g-3">
              {tickets.map((t) => (
                <div key={t.id} className="col-12">
                  <div
                    className="zen-card p-3 shadow-sm"
                    style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                    onClick={() => onSelectTicket?.(t)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold" style={{ color: "var(--color-primary)" }}>
                        {t.ticketNumber}
                      </span>
                      {renderStatusBadge(t.currentStatus)}
                    </div>
                    <h6 className="fw-semibold mb-1 text-truncate" title={t.summary}>
                      {t.summary}
                    </h6>
                    <div className="small text-muted mb-2">
                      Requester: {t.requester?.name || "Unknown"} • {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
                      <div className="d-flex gap-1 align-items-center">
                        <span className="small text-muted me-1">Pri:</span>
                        {renderPriorityBadge(t.itPriority || t.requestedPriority)}
                      </div>
                      <div className="small">
                        {t.ticketOwner ? (
                          <span className="badge bg-light text-dark border">
                            ?? {t.ticketOwner.name}
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-muted">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <nav aria-label="Ticket queue navigation" className="d-flex justify-content-center my-3">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${pagination.page <= 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                  >
                    &laquo; Previous
                  </button>
                </li>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                  <li key={pg} className={`page-item ${pg === pagination.page ? "active" : ""}`}>
                    <button
                      className="page-link"
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${pagination.page >= pagination.totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default StaffTicketQueue;

