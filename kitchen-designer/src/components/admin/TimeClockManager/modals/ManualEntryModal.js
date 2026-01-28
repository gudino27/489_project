import React from 'react';
import { FileEdit } from 'lucide-react';
import { getTodayPST } from '../utils/timezoneUtils';

const ManualEntryModal = ({
  show,
  manualEntry,
  setManualEntry,
  onSubmit,
  onClose,
  t,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content manual-entry-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            <FileEdit size={20} /> {t('timeclock.add_manual_entry_title')}
          </h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div
            className="warning-box"
            style={{
              background: "#e0f2fe",
              border: "1px solid #0ea5e9",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ margin: 0, color: "#075985", fontSize: "0.875rem" }}>
              {t('timeclock.manual_entry_note')}
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>{t('timeclock.label_date')} *</label>
              <input
                type="date"
                value={manualEntry.date}
                onChange={(e) =>
                  setManualEntry({ ...manualEntry, date: e.target.value })
                }
                max={getTodayPST()}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('timeclock.label_clock_in_time')} *</label>
                <input
                  type="time"
                  value={manualEntry.timeIn}
                  onChange={(e) =>
                    setManualEntry({
                      ...manualEntry,
                      timeIn: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('timeclock.label_clock_out_time')} *</label>
                <input
                  type="time"
                  value={manualEntry.timeOut}
                  onChange={(e) =>
                    setManualEntry({
                      ...manualEntry,
                      timeOut: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('timeclock.label_break_minutes')}</label>
              <input
                type="number"
                min="0"
                value={manualEntry.breakMinutes}
                onChange={(e) =>
                  setManualEntry({
                    ...manualEntry,
                    breakMinutes: e.target.value,
                  })
                }
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn-primary">
                {t('timeclock.add_time_entry_button')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryModal;
