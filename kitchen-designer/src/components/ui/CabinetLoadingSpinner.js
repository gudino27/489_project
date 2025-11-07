import React from 'react';
import './CabinetLoadingSpinner.css';

const CabinetLoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="cabinet-loading-container">
      <div className="cabinet-spinner">
        {/* Cabinet Frame */}
        <div className="cabinet-frame">
          {/* Left side */}
          <div className="cabinet-side cabinet-left"></div>
          {/* Right side */}
          <div className="cabinet-side cabinet-right"></div>
          {/* Top */}
          <div className="cabinet-top"></div>
          {/* Bottom */}
          <div className="cabinet-bottom"></div>
          {/* Back panel */}
          <div className="cabinet-back"></div>
        </div>

        {/* Cabinet Doors */}
        <div className="cabinet-doors">
          <div className="cabinet-door cabinet-door-left">
            <div className="door-handle door-handle-left"></div>
          </div>
          <div className="cabinet-door cabinet-door-right">
            <div className="door-handle door-handle-right"></div>
          </div>
        </div>

        {/* Shelves being installed */}
        <div className="cabinet-shelves">
          <div className="shelf shelf-1"></div>
          <div className="shelf shelf-2"></div>
          <div className="shelf shelf-3"></div>
        </div>

        {/* Wood grain texture overlay */}
        <div className="wood-grain"></div>

        {/* Tools animation */}
        <div className="tools-container">
          <div className="tool hammer">🔨</div>
          <div className="tool screwdriver">🔧</div>
          <div className="tool ruler">📏</div>
        </div>
      </div>

      {/* Loading message */}
      {message && <p className="loading-message">{message}</p>}

      {/* Progress dots */}
      <div className="loading-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export default CabinetLoadingSpinner;
