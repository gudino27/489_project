import React from 'react';

const CurrentStatusDisplay = ({
  isClockedIn,
  isOnBreak,
  clockInTime,
  elapsedTime,
  breakMinutes,
  formatTime,
  t,
}) => {
  if (!isClockedIn) return null;

  return (
    <div className="current-status-box">
      <div className="status-row">
        <span className="label">{t("timeclock.current_status")}:</span>
        <span className={`value ${isOnBreak ? "on-break" : "active"}`}>
          {isOnBreak ? t("timeclock.on_break") : t("timeclock.clocked_in")}
        </span>
      </div>
      <div className="status-row">
        <span className="label">{t("timeclock.clock_in_time")}:</span>
        <span className="value">{formatTime(clockInTime)}</span>
      </div>
      <div className="status-row">
        <span className="label">{t("timeclock.elapsed_time")}:</span>
        <span className="value">{elapsedTime}</span>
      </div>
      {breakMinutes > 0 && (
        <div className="status-row">
          <span className="label">{t("timeclock.break_time")}:</span>
          <span className="value">
            {breakMinutes} {t("timeclock.minutes")}
          </span>
        </div>
      )}
    </div>
  );
};

export default CurrentStatusDisplay;
