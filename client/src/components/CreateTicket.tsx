import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext.js";
import {
  Category,
  RelatedSystem,
  Priority,
  getCategories,
  getRelatedSystems,
  createTicket,
  Ticket,
} from "../api.js";

interface CreateTicketProps {
  onSuccessNavigate?: (ticket: Ticket) => void;
  onCancel?: () => void;
}

interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ATTACHMENTS = 5;

export const CreateTicket: React.FC<CreateTicketProps> = ({
  onSuccessNavigate,
  onCancel,
}) => {
  const { activeRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [loadingRefData, setLoadingRefData] = useState<boolean>(true);

  // Form Fields
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [relatedSystemId, setRelatedSystemId] = useState<number | "">("");
  const [requestedPriority, setRequestedPriority] = useState<Priority>("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  // Formatted current date for read-only Ticket Date display
  const [ticketDate] = useState<string>(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    setLoadingRefData(true);
    try {
      const [cats, systems] = await Promise.all([
        getCategories(),
        getRelatedSystems(),
      ]);
      setCategories(cats);
      setRelatedSystems(systems);
      if (cats.length > 0) setCategoryId(cats[0].id);
      if (systems.length > 0) setRelatedSystemId(systems[0].id);
    } catch (err) {
      setApiError("Failed to load categories or related systems. Please check backend connection.");
    } finally {
      setLoadingRefData(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setAttachmentError(`You can attach a maximum of ${MAX_ATTACHMENTS} files per ticket.`);
      return;
    }

    const newAttachments: AttachedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setAttachmentError(`File "${file.name}" is not an allowed type. Only JPG, PNG, WEBP, and PDF files are allowed.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachmentError(`File "${file.name}" exceeds the 5 MB file size limit.`);
        return;
      }
      newAttachments.push({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!categoryId) {
      newErrors.categoryId = "Please select a Category.";
    }
    if (!relatedSystemId) {
      newErrors.relatedSystemId = "Please select a Related System.";
    }

    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      newErrors.summary = "Ticket Summary is required.";
    } else if (trimmedSummary.length < 5) {
      newErrors.summary = "Ticket Summary must be at least 5 characters.";
    } else if (trimmedSummary.length > 100) {
      newErrors.summary = "Ticket Summary cannot exceed 100 characters.";
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      newErrors.description = "Problem Description is required.";
    } else if (trimmedDescription.length < 10) {
      newErrors.description = "Problem Description must be at least 10 characters.";
    } else if (trimmedDescription.length > 2000) {
      newErrors.description = "Problem Description cannot exceed 2000 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!activeRequester) {
      setApiError("No Development Requester selected. Please select a requester context.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        requesterId: activeRequester.id,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority,
      });

      setCreatedTicket(ticket);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedTicket(null);
    setSummary("");
    setDescription("");
    setAttachments([]);
    setErrors({});
    setApiError(null);
  };

  return (
    <div className="container-fluid px-0" style={{ maxWidth: 1000 }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <a
              href="#my-tickets"
              className="text-decoration-none"
              style={{ color: "var(--color-secondary-green)" }}
              onClick={(e) => {
                e.preventDefault();
                if (onCancel) onCancel();
              }}
            >
              My Tickets
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Create Ticket
          </li>
        </ol>
      </nav>

      {/* Success Banner */}
      {createdTicket && (
        <div className="zen-card p-4 mb-4 border-success" style={{ backgroundColor: "var(--color-pale-green)" }}>
          <div className="d-flex align-items-start gap-3">
            <span className="fs-2 text-success">✅</span>
            <div className="flex-grow-1">
              <h2 className="h4 fw-bold text-success mb-1">Ticket Created Successfully!</h2>
              <p className="mb-2" style={{ color: "var(--color-text-main)" }}>
                Your ticket has been recorded with official number:{" "}
                <strong className="fs-5 text-dark font-monospace">{createdTicket.ticketNumber}</strong>
              </p>
              <div className="d-flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-zen-primary btn-sm px-3"
                  onClick={() => onSuccessNavigate && onSuccessNavigate(createdTicket)}
                >
                  View My Tickets
                </button>
                <button
                  type="button"
                  className="btn btn-zen-secondary btn-sm px-3"
                  onClick={handleReset}
                >
                  Create Another Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Ticket Form Card */}
      {!createdTicket && (
        <div className="zen-card p-4 p-md-5">
          <div className="border-bottom pb-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h1 className="h3 fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>
                Create Support Ticket
              </h1>
              <p className="text-muted small mb-0">
                Describe the issue you are experiencing and provide any supporting attachments.
              </p>
            </div>
            <span className="badge bg-success fs-6 px-3 py-2 rounded-pill">Status: NEW</span>
          </div>

          {/* Safe Error Alert with Form State Preservation */}
          {apiError && (
            <div className="alert alert-danger shadow-sm d-flex align-items-start gap-2 mb-4" role="alert">
              <span className="fs-5">⚠️</span>
              <div>
                <strong>Submission Error:</strong> {apiError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* System / Read-Only Metadata Row */}
            <div className="row g-3 mb-4 p-3 rounded-3" style={{ backgroundColor: "#F8FAF9", border: "1px solid var(--color-border-subtle)" }}>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted mb-1">
                  Requester (Read-Only)
                </label>
                <input
                  type="text"
                  className="form-control form-control-readonly"
                  value={activeRequester ? `${activeRequester.name} (${activeRequester.email})` : "No Requester Selected"}
                  readOnly
                  disabled
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted mb-1">
                  Ticket Date (System Generated)
                </label>
                <input
                  type="text"
                  className="form-control form-control-readonly"
                  value={ticketDate}
                  readOnly
                  disabled
                />
              </div>
            </div>

            {/* Classification Row: Category, Related System, Priority */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label htmlFor="categorySelect" className="form-label small fw-semibold">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  id="categorySelect"
                  className={`form-select ${errors.categoryId ? "is-invalid" : ""}`}
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  disabled={loadingRefData}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <div className="invalid-feedback">{errors.categoryId}</div>}
              </div>

              <div className="col-md-4">
                <label htmlFor="systemSelect" className="form-label small fw-semibold">
                  Related System <span className="text-danger">*</span>
                </label>
                <select
                  id="systemSelect"
                  className={`form-select ${errors.relatedSystemId ? "is-invalid" : ""}`}
                  value={relatedSystemId}
                  onChange={(e) => setRelatedSystemId(Number(e.target.value))}
                  disabled={loadingRefData}
                >
                  {relatedSystems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.relatedSystemId && (
                  <div className="invalid-feedback">{errors.relatedSystemId}</div>
                )}
              </div>

              <div className="col-md-4">
                <label htmlFor="prioritySelect" className="form-label small fw-semibold">
                  Requested Priority <span className="text-danger">*</span>
                </label>
                <select
                  id="prioritySelect"
                  className="form-select"
                  value={requestedPriority}
                  onChange={(e) => setRequestedPriority(e.target.value as Priority)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Ticket Summary */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label htmlFor="summaryInput" className="form-label small fw-semibold mb-1">
                  Ticket Summary <span className="text-danger">*</span>
                </label>
                <span className={`small ${summary.length > 100 ? "text-danger" : "text-muted"}`}>
                  {summary.length}/100 chars
                </span>
              </div>
              <input
                type="text"
                id="summaryInput"
                className={`form-control ${errors.summary ? "is-invalid" : ""}`}
                placeholder="Brief summary of the issue (5 - 100 characters)"
                value={summary}
                maxLength={100}
                onChange={(e) => setSummary(e.target.value)}
              />
              {errors.summary && <div className="invalid-feedback">{errors.summary}</div>}
            </div>

            {/* Problem Description */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <label htmlFor="descriptionInput" className="form-label small fw-semibold mb-1">
                  Description <span className="text-danger">*</span>
                </label>
                <span className={`small ${description.length > 2000 ? "text-danger" : "text-muted"}`}>
                  {description.length}/2000 chars
                </span>
              </div>
              <textarea
                id="descriptionInput"
                rows={5}
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                placeholder="Provide detailed information about the issue, steps to reproduce, or affected services..."
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: "vertical", minHeight: 120 }}
              />
              {errors.description && <div className="invalid-feedback">{errors.description}</div>}
            </div>

            {/* Attachments Upload Section */}
            <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: "#F8FAF9", border: "1px solid var(--color-border-subtle)" }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label small fw-semibold mb-0">
                  📎 Supporting Attachments (Optional)
                </label>
                <span className="small text-muted">{attachments.length}/5 files</span>
              </div>
              <p className="text-muted small mb-2">
                Permitted types: <code>JPG</code>, <code>PNG</code>, <code>WEBP</code>, <code>PDF</code> (Max 5 MB per file)
              </p>

              <div className="input-group mb-2">
                <input
                  type="file"
                  id="attachmentFileInput"
                  className="form-control"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileChange}
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                />
              </div>

              {attachmentError && (
                <div className="text-danger small mb-2">{attachmentError}</div>
              )}

              {/* Selected Files List */}
              {attachments.length > 0 && (
                <ul className="list-group list-group-flush rounded-2 border">
                  {attachments.map((att) => (
                    <li
                      key={att.id}
                      className="list-group-item d-flex justify-content-between align-items-center py-2 bg-white"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span>📄</span>
                        <span className="small fw-medium">{att.name}</span>
                        <span className="badge bg-light text-secondary border">
                          {(att.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm py-0 px-2"
                        onClick={() => handleRemoveAttachment(att.id)}
                        aria-label={`Remove ${att.name}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Form Actions */}
            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              {onCancel && (
                <button
                  type="button"
                  className="btn btn-zen-secondary px-4"
                  onClick={onCancel}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-zen-primary px-4 d-flex align-items-center gap-2"
                disabled={submitting || loadingRefData}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Ticket</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
