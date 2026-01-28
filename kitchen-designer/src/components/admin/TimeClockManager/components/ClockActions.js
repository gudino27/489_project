import React from 'react';
import { Play, Square, Coffee } from 'lucide-react';

const ClockActions = ({
  isClockedIn,
  isOnBreak,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  actionLoading,
  t,
}) => {
  return (
    <div className="clock-actions">
      {!isClockedIn ? (
        <button
          className="clock-btn clock-in-btn"
          onClick={onClockIn}
          disabled={actionLoading}
        >
          <Play size={20} />
          {t("timeclock.check_in")}
        </button>
      ) : (
        <>
          <button
            className="clock-btn clock-out-btn"
            onClick={onClockOut}
            disabled={actionLoading}
          >
            <Square size={20} />
            {t("timeclock.check_out")}
          </button>

          {!isOnBreak ? (
            <button
              className="clock-btn break-btn"
              onClick={onStartBreak}
              disabled={actionLoading}
            >
              <Coffee size={20} />
              {t("timeclock.start_break")}
            </button>
          ) : (
            <button
              className="clock-btn break-btn end-break"
              onClick={onEndBreak}
              disabled={actionLoading}
            >
              <Coffee size={20} />
              {t("timeclock.end_break")}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ClockActions;
