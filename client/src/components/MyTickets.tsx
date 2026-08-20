import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext.js";
import {
  Ticket,
  Category,
  getCategories,
  getTickets,
  PaginatedResponse,
} from "../api.js";

interface MyTicketsProps {
  onCreateTicketClick: () => void;
  onSelectTicket?: (ticket: Ticket) => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({
  onCreateTicketClick,
  onSelectTicket,
}) => {
  const { activeRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  }>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Filter & Search states
  const [search, setSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [requestedPriority, setRequestedPriority] = useState<string>("");
  const [itPriority, setItPriority] = useState<string>("");
  const [status, setStatus] = useState<string>("");
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
      // Ignored for filter dropdown fallback
    }
  };

  const fetchTicketsList = useCallback(async () => {
    if (!activeRequester) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getTickets({
        requesterId: activeRequester.id,
        search,
        categoryId,
        requestedPriority,
        itPriority,
        status,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      });

      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [
    activeRequester,
    search,
    categoryId,
    requestedPriority,
    itPriority,
    status,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  useEffect(() => {
    fetchTicketsList();
  }, [fetchTicketsList]);

  const handleClearFilters = () => {
    setSearch("");
    setCategoryId("");
    setRequestedPriority("");
    setItPriority("");
    setStatus("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

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
    if (!p) return <span className="text-muted small">-</span>;
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

    return (
      <span className={`badge rounded-pill px-2 py-1 ${badgeClass} small`}>
        {s}
      </span>
    );
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryId !== "" ||
    requestedPriority !== "" ||
    itPriority !== "" ||
    status !== "";

  const startItem = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.totalItems);

  return (
    <div className="container-fluid px-0">
      {/* Top Header & Action Row */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>
            My Tickets
          </h1>
          <p className="text-muted small mb-0">View and track all of your support requests.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleClearFilters}
            >
              ↻ Clear Filters
            </button>
          )}
          <button
            type="button"
            className="btn btn-zen-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
            onClick={onCreateTicketClick}
          >
            <span>➕</span>
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="zen-card p-3 p-md-4 mb-4">
        <div className="row g-3">
          {/* Keyword Search Input */}
          <div className="col-12 col-lg-4">
            <label htmlFor="searchTicketsInput" className="form-label small fw-semibold text-muted mb-1">
              Search
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted">🔍</span>
              <input
                type="text"
                id="searchTicketsInput"
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
            <label htmlFor="categoryFilterSelect" className="form-label small fw-semibold text-muted mb-1">
              Category
            </label>
            <select
              id="categoryFilterSelect"
              className="form-select form-select-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value ? Number(e.target.value) : "");
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Requested Priority Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <label htmlFor="reqPriorityFilterSelect" className="form-label small fw-semibold text-muted mb-1">
              Req. Priority
            </label>
            <select
              id="reqPriorityFilterSelect"
              className="form-select form-select-sm"
              value={requestedPriority}
              onChange={(e) => {
                setRequestedPriority(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* IT Priority Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <label htmlFor="itPriorityFilterSelect" className="form-label small fw-semibold text-muted mb-1">
              IT Priority
            </label>
            <select
              id="itPriorityFilterSelect"
              className="form-select form-select-sm"
              value={itPriority}
              onChange={(e) => {
                setItPriority(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <label htmlFor="statusFilterSelect" className="form-label small fw-semibold text-muted mb-1">
              Status
            </label>
            <select
              id="statusFilterSelect"
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 mb-4" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
          <button className="btn btn-outline-danger btn-sm ms-auto py-0" onClick={fetchTicketsList}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="zen-card p-5 text-center my-4">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small mt-2">Loading tickets for active requester...</p>
        </div>
      )}

      {/* Empty State: Zero total tickets owned */}
      {!loading && !error && tickets.length === 0 && !hasActiveFilters && (
        <div className="zen-card p-5 text-center my-4">
          <div className="fs-1 mb-2">📋</div>
          <h2 className="h5 fw-bold mb-2">No tickets submitted yet</h2>
          <p className="text-muted small mb-3">
            You haven't submitted any IT support requests under this requester identity.
          </p>
          <button
            type="button"
            className="btn btn-zen-primary btn-sm px-4"
            onClick={onCreateTicketClick}
          >
            Create Your First Ticket
          </button>
        </div>
      )}

      {/* No Results State: Filters produced zero results */}
      {!loading && !error && tickets.length === 0 && hasActiveFilters && (
        <div className="zen-card p-5 text-center my-4">
          <div className="fs-1 mb-2">🔍</div>
          <h2 className="h5 fw-bold mb-2">No matching tickets found</h2>
          <p className="text-muted small mb-3">
            No tickets match your search keyword or selected filter criteria.
          </p>
          <button
            type="button"
            className="btn btn-zen-secondary btn-sm px-4"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Tickets Table (Desktop View $\ge 768$px) */}
      {!loading && !error && tickets.length > 0 && (
        <div className="zen-card p-0 mb-4 overflow-hidden d-none d-md-block">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th
                    style={{ cursor: "pointer", width: "16%" }}
                    onClick={() => handleSortToggle("ticketNumber")}
                  >
                    Ticket No. {sortBy === "ticketNumber" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    style={{ cursor: "pointer", width: "16%" }}
                    onClick={() => handleSortToggle("createdAt")}
                  >
                    Created Date {sortBy === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th style={{ width: "24%" }}>Summary</th>
                  <th style={{ width: "14%" }}>Category</th>
                  <th style={{ width: "10%" }}>Req. Priority</th>
                  <th style={{ width: "10%" }}>IT Priority</th>
                  <th style={{ width: "10%" }}>Status</th>
                </tr>
              </thead>
              <tbody className="small">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectTicket && onSelectTicket(t)}
                  >
                    <td>
                      <a
                        href={`#ticket-${t.id}`}
                        className="fw-bold font-monospace text-decoration-none"
                        style={{ color: "var(--color-primary-green)" }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (onSelectTicket) onSelectTicket(t);
                        }}
                      >
                        {t.ticketNumber}
                      </a>
                    </td>
                    <td className="text-muted">{formatDate(t.createdAt)}</td>
                    <td className="fw-medium text-truncate" style={{ maxWidth: 240 }} title={t.summary}>
                      {t.summary}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{t.category?.name || "-"}</span>
                    </td>
                    <td>{renderPriorityBadge(t.requestedPriority)}</td>
                    <td>{renderPriorityBadge(t.itPriority)}</td>
                    <td>{renderStatusBadge(t.currentStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tickets Cards (Mobile View $< 768$px) */}
      {!loading && !error && tickets.length > 0 && (
        <div className="d-md-none d-flex flex-column gap-3 mb-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="zen-card p-3"
              style={{ cursor: "pointer" }}
              onClick={() => onSelectTicket && onSelectTicket(t)}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="font-monospace fw-bold" style={{ color: "var(--color-primary-green)" }}>
                  {t.ticketNumber}
                </span>
                {renderStatusBadge(t.currentStatus)}
              </div>
              <h2 className="h6 fw-semibold mb-2" style={{ color: "var(--color-text-main)" }}>
                {t.summary}
              </h2>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>{t.category?.name || "General"}</span>
                <div>Priority: {renderPriorityBadge(t.requestedPriority)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && !error && pagination.totalItems > 0 && (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 small text-muted">
          <div>
            Showing <strong className="text-dark">{startItem}</strong> to{" "}
            <strong className="text-dark">{endItem}</strong> of{" "}
            <strong className="text-dark">{pagination.totalItems}</strong> tickets
          </div>

          {pagination.totalPages > 1 && (
            <nav aria-label="Ticket navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${pagination.page <= 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                  >
                    ‹ Previous
                  </button>
                </li>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                  <li
                    key={pg}
                    className={`page-item ${pg === pagination.page ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      style={
                        pg === pagination.page
                          ? { backgroundColor: "var(--color-primary-green)", borderColor: "var(--color-primary-green)" }
                          : {}
                      }
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${pagination.page >= pagination.totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next ›
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      )}
    </div>
  );
};
