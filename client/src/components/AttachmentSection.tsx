import React, { useState } from "react";
import { useRequester } from "../context/RequesterContext.js";
import {
  Attachment,
  uploadAttachment,
  softRemoveAttachment,
  getDownloadUrl,
} from "../api.js";

interface AttachmentSectionProps {
  ticketId: number;
  initialAttachments?: Attachment[];
  onAttachmentsUpdated?: () => void;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ACTIVE_ATTACHMENTS = 5;

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  ticketId,
  initialAttachments = [],
  onAttachmentsUpdated,
}) => {
  const { activeRequester } = useRequester();

  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Soft-Remove Modal State
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);

  // Update attachments when props change
  React.useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  const activeCount = attachments.filter((a) => !a.isRemoved).length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file || !activeRequester) return;

    if (activeCount >= MAX_ACTIVE_ATTACHMENTS) {
      setUploadError(`Maximum limit of ${MAX_ACTIVE_ATTACHMENTS} active attachments reached.`);
      e.target.value = "";
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError(`File "${file.name}" is not an allowed type. Only JPG, PNG, WEBP, and PDF files are allowed.`);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File "${file.name}" exceeds the 5 MB size limit.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const newAttachment = await uploadAttachment(ticketId, file, activeRequester.id);
      setAttachments((prev) => [...prev, newAttachment]);
      if (onAttachmentsUpdated) onAttachmentsUpdated();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleOpenRemoveModal = (att: Attachment) => {
    setSelectedAttachment(att);
    setRemovalReason("");
    setRemoveError(null);
  };

  const handleConfirmSoftRemove = async () => {
    if (!selectedAttachment || !activeRequester) return;

    if (!removalReason.trim() || removalReason.trim().length < 3) {
      setRemoveError("Please enter a valid removal reason (minimum 3 characters).");
      return;
    }

    setRemoving(true);
    try {
      const updated = await softRemoveAttachment(
        selectedAttachment.id,
        removalReason.trim(),
        activeRequester.id
      );

      setAttachments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setSelectedAttachment(null);
      if (onAttachmentsUpdated) onAttachmentsUpdated();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Failed to remove attachment");
    } finally {
      setRemoving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  return (
    <div className="zen-card p-4 mb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-5">📎</span>
          <h2 className="h5 fw-bold mb-0" style={{ color: "var(--color-text-main)" }}>
            Supporting Attachments
          </h2>
          <span className="badge bg-light text-secondary border">
            {activeCount}/{MAX_ACTIVE_ATTACHMENTS} Active
          </span>
        </div>

        {/* Upload Button Trigger */}
        <div>
          <label
            htmlFor="ticketAttachmentInput"
            className={`btn btn-zen-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1 ${
              activeCount >= MAX_ACTIVE_ATTACHMENTS || uploading ? "disabled" : ""
            }`}
            style={{ cursor: activeCount >= MAX_ACTIVE_ATTACHMENTS || uploading ? "not-allowed" : "pointer" }}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>➕ Add Attachment</span>
              </>
            )}
          </label>
          <input
            type="file"
            id="ticketAttachmentInput"
            className="d-none"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileUpload}
            disabled={activeCount >= MAX_ACTIVE_ATTACHMENTS || uploading}
          />
        </div>
      </div>

      {uploadError && (
        <div className="alert alert-danger small py-2 mb-3" role="alert">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <p className="text-muted small mb-0 py-2">
          No supporting attachments have been uploaded for this ticket.
        </p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className={`p-3 rounded-3 border d-flex justify-content-between align-items-center flex-wrap gap-2 ${
                att.isRemoved ? "bg-light opacity-75" : "bg-white"
              }`}
            >
              <div className="d-flex align-items-center gap-3">
                <span className="fs-4">{att.mimeType.includes("pdf") ? "📄" : "🖼️"}</span>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold small" style={{ color: "var(--color-text-main)" }}>
                      {att.originalFilename}
                    </span>
                    {att.isRemoved ? (
                      <span className="badge bg-secondary text-white rounded-pill px-2 py-0 small">
                        Removed
                      </span>
                    ) : (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-0 small">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-muted small mt-1">
                    <span>Size: {formatFileSize(att.fileSize)}</span>
                    <span className="mx-2">•</span>
                    <span>Uploaded: {formatDate(att.createdAt)}</span>
                    {att.isRemoved && att.removalReason && (
                      <div className="text-danger small mt-1">
                        <em>Reason: "{att.removalReason}"</em>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex align-items-center gap-2">
                {!att.isRemoved && activeRequester && (
                  <>
                    <a
                      href={getDownloadUrl(att.id, activeRequester.id)}
                      className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                      download={att.originalFilename}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>⬇️ Download</span>
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleOpenRemoveModal(att)}
                    >
                      ✕ Remove
                    </button>
                  </>
                )}

                {att.isRemoved && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm disabled"
                    disabled
                    title="Removed files cannot be downloaded"
                  >
                    🚫 Download Disabled
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Soft Remove Confirmation Modal */}
      {selectedAttachment && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-card border-0 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h3 className="modal-title h5 fw-bold text-danger">Remove Attachment</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAttachment(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-3">
                  Are you sure you want to soft-remove{" "}
                  <strong className="text-dark">"{selectedAttachment.originalFilename}"</strong>?
                  <br />
                  The file will no longer be downloadable, but its metadata record will be preserved.
                </p>

                <div className="mb-3">
                  <label htmlFor="removalReasonInput" className="form-label small fw-semibold">
                    Removal Reason <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="removalReasonInput"
                    className={`form-control ${removeError ? "is-invalid" : ""}`}
                    rows={3}
                    placeholder="Enter reason for removal (e.g. replaced with updated file, uploaded by mistake)..."
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                  />
                  {removeError && <div className="invalid-feedback">{removeError}</div>}
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-zen-secondary btn-sm"
                  onClick={() => setSelectedAttachment(null)}
                  disabled={removing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  onClick={handleConfirmSoftRemove}
                  disabled={removing}
                >
                  {removing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Confirm Soft Removal</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
