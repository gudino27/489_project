import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const Collapsible = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="collapsible">
      <button
        className="collapsible-header"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title}`}
      >
        <span className="collapsible-title sms-section-header text-center">
          {title}
        </span>
        <ChevronRight
          className={`collapsible-caret ${isOpen ? 'open' : ''}`}
          size={20}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
