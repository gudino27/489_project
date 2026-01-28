import React from 'react';

const PayrollSettingsModal = ({
  show,
  selectedEmployee,
  payrollForm,
  setPayrollForm,
  onClose,
  onSave,
}) => {
  if (!show || !selectedEmployee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content payroll-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Payroll Settings - {selectedEmployee.full_name}</h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Employment Type</label>
            <select
              value={payrollForm.employmentType}
              onChange={(e) =>
                setPayrollForm({
                  ...payrollForm,
                  employmentType: e.target.value,
                })
              }
            >
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
            </select>
          </div>

          {payrollForm.employmentType === "hourly" ? (
            <>
              <div className="form-group">
                <label>Hourly Rate *</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payrollForm.hourlyRate}
                    onChange={(e) =>
                      setPayrollForm({
                        ...payrollForm,
                        hourlyRate: e.target.value,
                      })
                    }
                    placeholder="25.50"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Overtime Rate (optional)</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payrollForm.overtimeRate}
                    onChange={(e) =>
                      setPayrollForm({
                        ...payrollForm,
                        overtimeRate: e.target.value,
                      })
                    }
                    placeholder={`${(parseFloat(payrollForm.hourlyRate) * 1.5).toFixed(2)} (1.5x)`}
                  />
                </div>
                <small>Leave blank for 1.5x hourly rate</small>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Annual Salary *</label>
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={payrollForm.salary}
                  onChange={(e) =>
                    setPayrollForm({
                      ...payrollForm,
                      salary: e.target.value,
                    })
                  }
                  placeholder="50000.00"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Pay Period Type</label>
            <select
              value={payrollForm.payPeriodType}
              onChange={(e) =>
                setPayrollForm({
                  ...payrollForm,
                  payPeriodType: e.target.value,
                })
              }
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly (Every 2 weeks)</option>
              <option value="semimonthly">Semi-Monthly (Twice a month)</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={() => onSave(selectedEmployee.id)}
          >
            Save Payroll Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollSettingsModal;
