import React from 'react';
import { formatDateTimePST } from '../utils/timezoneUtils';

const EditEntryModal = ({
  editingEntry,
  editForm,
  setEditForm,
  auditLog,
  onSave,
  onDelete,
  onClose,
  actionLoading,
}) => {
  if (!editingEntry) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Time Entry</h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="form-group">
            <label>Clock In Time *</label>
            <input
              type="datetime-local"
              value={editForm.clockInTime}
              onChange={(e) =>
                setEditForm({ ...editForm, clockInTime: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Clock Out Time</label>
            <input
              type="datetime-local"
              value={editForm.clockOutTime}
              onChange={(e) =>
                setEditForm({ ...editForm, clockOutTime: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Break Minutes</label>
            <input
              type="number"
              min="0"
              value={editForm.breakMinutes}
              onChange={(e) =>
                setEditForm({ ...editForm, breakMinutes: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              placeholder="Add any notes about this entry..."
            />
          </div>

          {auditLog.length > 0 && (
            <div className="audit-log">
              <h4>Change History</h4>
              {auditLog.map((log, idx) => (
                <div key={idx} className="audit-entry">
                  <div className="audit-user">
                    {log.modified_by_name || "System"}
                  </div>
                  <div className="audit-action">
                    {log.reason || log.modification_type || "Entry modified"}
                  </div>
                  <div className="audit-time">
                    {formatDateTimePST(log.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-modal btn-delete"
              onClick={onDelete}
              disabled={actionLoading}
            >
              Delete
            </button>
            <button
              type="submit"
              className="btn-modal btn-save"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEntryModal;
