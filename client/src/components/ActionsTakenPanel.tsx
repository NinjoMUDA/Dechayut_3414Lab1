import React, { useState, useEffect, useCallback } from "react";
import {
  ActionTaken,
  User,
  apiGetActionsTaken,
  apiCreateActionTaken,
  apiUpdateActionTaken,
} from "../api.js";

interface ActionsTakenPanelProps {
  ticketId: number;
  readOnly?: boolean;
  token?: string | null;
  currentUser?: User | null;
}

export const ActionsTakenPanel: React.FC<ActionsTakenPanelProps> = ({
  ticketId,
  readOnly = false,
  token,
  currentUser,
}) => {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);
  const [actionDateTime, setActionDateTime] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>("");
  const [attachmentNotes, setAttachmentNotes] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<boolean>(false);

  const formatToLocalDateTime = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetActionsTaken(ticketId, token);
      setActions(data.actions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load actions taken");
    } finally {
      setLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const openCreateModal = () => {
    setEditingAction(null);
    setActionDateTime(formatToLocalDateTime(new Date()));
    setDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (act: ActionTaken) => {
    setEditingAction(act);
    const d = new Date(act.actionDateTime);
    setActionDateTime(!isNaN(d.getTime()) ? formatToLocalDateTime(d) : formatToLocalDateTime(new Date()));
    setDescription(act.description);
    setResult(act.result);
    setFollowUpRequired(act.followUpRequired);
    setFollowUpNote(act.followUpNote || "");
    setAttachmentNotes(act.attachmentNotes || "");
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAction(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!description.trim() || description.trim().length < 5) {
      errors.description = "Action description is required (min 5 characters).";
    }

    if (!result.trim() || result.trim().length < 3) {
      errors.result = "Action result is required (min 3 characters).";
    }

    if (followUpRequired) {
      if (!followUpNote.trim() || followUpNote.trim().length < 3) {
        errors.followUpNote = "Follow-up note is required when follow-up is needed (min 3 characters).";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingAction) {
        await apiUpdateActionTaken(
          ticketId,
          editingAction.id,
          {
            actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
            description: description.trim(),
            result: result.trim(),
            followUpRequired,
            followUpNote: followUpRequired ? followUpNote.trim() : null,
            attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
          },
          token
        );
      } else {
        await apiCreateActionTaken(
          ticketId,
          {
            actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
            description: description.trim(),
            result: result.trim(),
            followUpRequired,
            followUpNote: followUpRequired ? followUpNote.trim() : null,
            attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
          },
          token
        );
      }
      closeModal();
      await loadActions();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : "Failed to save action taken",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "0.75rem", overflow: "hidden" }}>
      {/* Header */}
      <div
        className="card-header py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
        style={{ backgroundColor: "#1b4332", color: "#ffffff" }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="fs-5">📋</span>
          <h5 className="mb-0 fw-bold text-white">Actions Taken</h5>
          <span className="badge rounded-pill bg-light text-dark ms-2 fw-semibold">
            {actions.length}
          </span>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="btn btn-sm btn-light fw-semibold text-success shadow-sm d-flex align-items-center gap-1"
            onClick={openCreateModal}
          >
            <span>+</span>
            <span>Record Action Taken</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="card-body p-4" style={{ backgroundColor: "#fbfdfc" }}>
        {loading ? (
          <div className="text-center py-4 text-muted">
            <div className="spinner-border spinner-border-sm text-success me-2" role="status">
              <span className="visually-hidden">Loading actions...</span>
            </div>
            <span>Loading actions taken...</span>
          </div>
        ) : error ? (
          <div className="alert alert-danger py-2 px-3 small mb-0" role="alert">
            ⚠️ {error}
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-4 px-3 border rounded bg-white text-muted">
            <div className="fs-3 mb-2">📝</div>
            <h6 className="fw-semibold mb-1">No Actions Recorded Yet</h6>
            <p className="small mb-0 text-secondary">
              {readOnly
                ? "No operational actions have been recorded by IT staff for this ticket yet."
                : "Record your diagnostic, repair, or configuration actions to maintain full traceability."}
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {actions.map((act) => (
              <div
                key={act.id}
                className="border rounded-3 p-3 bg-white shadow-sm position-relative"
                style={{ borderColor: "#d8f3dc" }}
              >
                {/* Action Header: Date & Performer */}
                <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-bold small text-dark">
                      📅 {new Date(act.actionDateTime).toLocaleString()}
                    </span>
                    <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle small">
                      👤 {act.performedBy?.name || `Staff #${act.performedById}`}
                    </span>
                    {act.performedBy?.role && (
                      <span className="badge rounded-pill bg-light text-muted border small">
                        {act.performedBy.role}
                      </span>
                    )}
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm py-0 px-2"
                      style={{ fontSize: "0.8rem" }}
                      onClick={() => openEditModal(act)}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {/* Description */}
                <div className="mb-2">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>
                    Action Description
                  </div>
                  <div className="small text-dark" style={{ whiteSpace: "pre-wrap" }}>
                    {act.description}
                  </div>
                </div>

                {/* Result */}
                <div className="mb-2">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>
                    Result
                  </div>
                  <div className="small text-dark fw-medium" style={{ whiteSpace: "pre-wrap" }}>
                    {act.result}
                  </div>
                </div>

                {/* Follow-Up Flag & Note */}
                {act.followUpRequired && (
                  <div className="alert alert-warning py-2 px-3 mb-2 small d-flex flex-column gap-1">
                    <div className="d-flex align-items-center gap-2 fw-bold text-dark">
                      <span>⚠️</span>
                      <span>Follow-Up Required</span>
                    </div>
                    {act.followUpNote && (
                      <div className="text-secondary ps-4">{act.followUpNote}</div>
                    )}
                  </div>
                )}

                {/* Attachment Notes */}
                {act.attachmentNotes && (
                  <div className="small text-muted d-flex align-items-center gap-1 pt-1 border-top">
                    <span>📎</span>
                    <span className="fw-semibold">Attachment Reference:</span>
                    <span>{act.attachmentNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record / Edit Action Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow">
              <div
                className="modal-header py-3"
                style={{ backgroundColor: "#1b4332", color: "#ffffff" }}
              >
                <h5 className="modal-title fw-bold text-white">
                  {editingAction ? "Edit Action Taken" : "Record Action Taken"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={closeModal}
                />
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  {formErrors.submit && (
                    <div className="alert alert-danger py-2 px-3 small mb-3">
                      ⚠️ {formErrors.submit}
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Action Date / Time */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        Action Date & Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={actionDateTime}
                        onChange={(e) => setActionDateTime(e.target.value)}
                        required
                      />
                    </div>

                    {/* Performed By (Auto-populated / read-only) */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        Performed By (Auto)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light text-muted"
                        value={
                          editingAction
                            ? editingAction.performedBy?.name || currentUser?.name || "IT Staff"
                            : currentUser?.name || "Authenticated Staff"
                        }
                        disabled
                        readOnly
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Action Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control form-control-sm ${
                          formErrors.description ? "is-invalid" : ""
                        }`}
                        rows={3}
                        placeholder="Detail the technical action taken (e.g. replaced switch cable, checked RADIUS logs, ran battery utility)..."
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          if (formErrors.description) {
                            setFormErrors((prev) => ({ ...prev, description: "" }));
                          }
                        }}
                      />
                      {formErrors.description && (
                        <div className="invalid-feedback small">{formErrors.description}</div>
                      )}
                    </div>

                    {/* Result */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Result <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control form-control-sm ${
                          formErrors.result ? "is-invalid" : ""
                        }`}
                        rows={2}
                        placeholder="Outcome of the action (e.g. link light returned, driver installed, latency dropped to 2ms)..."
                        value={result}
                        onChange={(e) => {
                          setResult(e.target.value);
                          if (formErrors.result) {
                            setFormErrors((prev) => ({ ...prev, result: "" }));
                          }
                        }}
                      />
                      {formErrors.result && (
                        <div className="invalid-feedback small">{formErrors.result}</div>
                      )}
                    </div>

                    {/* Follow-up Required Checkbox */}
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="followUpRequiredCheck"
                          checked={followUpRequired}
                          onChange={(e) => {
                            setFollowUpRequired(e.target.checked);
                            if (!e.target.checked && formErrors.followUpNote) {
                              setFormErrors((prev) => ({ ...prev, followUpNote: "" }));
                            }
                          }}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="followUpRequiredCheck">
                          Follow-Up Required?
                        </label>
                      </div>
                    </div>

                    {/* Follow-up Note (Conditionally required) */}
                    {followUpRequired && (
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-warning-emphasis">
                          Follow-Up Note <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className={`form-control form-control-sm ${
                            formErrors.followUpNote ? "is-invalid" : ""
                          }`}
                          rows={2}
                          placeholder="Explain what follow-up action is needed and when..."
                          value={followUpNote}
                          onChange={(e) => {
                            setFollowUpNote(e.target.value);
                            if (formErrors.followUpNote) {
                              setFormErrors((prev) => ({ ...prev, followUpNote: "" }));
                            }
                          }}
                        />
                        {formErrors.followUpNote && (
                          <div className="invalid-feedback small">{formErrors.followUpNote}</div>
                        )}
                      </div>
                    )}

                    {/* Attachment Notes */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">
                        Attachment Reference Notes (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Look at diagnostic_log.txt or battery_report.png"
                        value={attachmentNotes}
                        onChange={(e) => setAttachmentNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer py-2 px-4 bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success btn-sm px-4 fw-semibold"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      "Save Action"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ActionsTakenPanel;
