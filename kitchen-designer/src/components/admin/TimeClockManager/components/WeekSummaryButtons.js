import React from 'react';

const WeekSummaryButtons = ({
  thisWeekHours,
  lastWeekHours,
  onThisWeekClick,
  onLastWeekClick,
  onSelectWeekClick,
  t,
}) => {
  return (
    <div className="week-buttons">
      <button className="week-btn" onClick={onThisWeekClick}>
        <span className="week-label">
          {t("timeclock.this_week")} ({thisWeekHours.toFixed(6)} Hours)
        </span>
      </button>

      <button className="week-btn" onClick={onLastWeekClick}>
        <span className="week-label">
          {t("timeclock.last_week")} ({lastWeekHours.toFixed(6)} Hours)
        </span>
      </button>

      <button className="week-btn" onClick={onSelectWeekClick}>
        <span className="week-label">{t("timeclock.select_week")}</span>
      </button>
    </div>
  );
};

export default WeekSummaryButtons;
