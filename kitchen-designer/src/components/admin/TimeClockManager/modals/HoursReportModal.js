import React from 'react';
import { Search, Download } from 'lucide-react';

const HoursReportModal = ({
  show,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  hoursReportData,
  allEmployees,
  onFetchReport,
  onExportToCSV,
  onFetchEmployeeAudit,
  onClose,
  t,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content hours-report-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{t("timeclock.hours_report_title")}</h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="report-filters">
            <div className="form-group">
              <label>{t("timeclock.start_date")}</label>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t("timeclock.end_date")}</label>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
              />
            </div>
            <button onClick={onFetchReport} className="btn-primary">
              {t("timeclock.generate_report")}
            </button>
          </div>

          {hoursReportData.length > 0 && (
            <>
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>{t("timeclock.employee")}</th>
                      <th className="align-right">
                        {t("timeclock.total_hours")}
                      </th>
                      <th className="align-right">
                        {t("timeclock.regular_hours")}
                      </th>
                      <th className="align-right">
                        {t("timeclock.overtime_hours")}
                      </th>
                      <th className="align-right">
                        {t("timeclock.estimated_pay")}
                      </th>
                      <th className="align-center">{t("timeclock.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoursReportData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.employeeName}</td>
                        <td className="align-right bold">
                          {row.totalHours.toFixed(2)}
                        </td>
                        <td className="align-right">
                          {row.regularHours.toFixed(2)}
                        </td>
                        <td className="align-right">
                          {row.overtimeHours.toFixed(2)}
                        </td>
                        <td className="align-right pay-amount">
                          ${row.estimatedPay.toFixed(2)}
                        </td>
                        <td className="align-center">
                          <button
                            onClick={() =>
                              onFetchEmployeeAudit(
                                allEmployees.find((e) => e.id === row.employeeId)
                              )
                            }
                            className="btn-audit"
                          >
                            <Search size={16} /> {t("timeclock.audit")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <strong>{t("timeclock.total")}</strong>
                      </td>
                      <td className="align-right">
                        <strong>
                          {hoursReportData
                            .reduce((sum, row) => sum + row.totalHours, 0)
                            .toFixed(2)}
                        </strong>
                      </td>
                      <td className="align-right">
                        <strong>
                          {hoursReportData
                            .reduce((sum, row) => sum + row.regularHours, 0)
                            .toFixed(2)}
                        </strong>
                      </td>
                      <td className="align-right">
                        <strong>
                          {hoursReportData
                            .reduce((sum, row) => sum + row.overtimeHours, 0)
                            .toFixed(2)}
                        </strong>
                      </td>
                      <td className="align-right pay-amount">
                        <strong>
                          $
                          {hoursReportData
                            .reduce((sum, row) => sum + row.estimatedPay, 0)
                            .toFixed(2)}
                        </strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <button onClick={onExportToCSV} className="btn-export-csv">
                <Download size={16} /> {t("timeclock.download_csv_payroll")}
              </button>
            </>
          )}

          {hoursReportData.length === 0 &&
            reportStartDate &&
            reportEndDate && (
              <div className="no-data-message">
                <p>{t("timeclock.no_hours_data_found")}</p>
                <p className="hint">
                  {t("timeclock.try_selecting_different_date_range")}
                </p>
              </div>
            )}
        </div>

        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoursReportModal;
