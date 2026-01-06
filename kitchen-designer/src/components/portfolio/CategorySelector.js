import React from 'react';

// CategorySelector Component
// Displays category buttons and view mode toggle for the portfolio
const CategorySelector = ({
  categories,
  currentCategory,
  selectCategory,
  getCategoryName,
  viewMode,
  setViewMode,
  beforeAfterPairs,
  t
}) => {
  return (
    <div className="category-container">
      <h2 className="text-white mb-4">{t("portfolio.selectCategory")}</h2>
      <div className="category-buttons">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-button ${cat === currentCategory ? "active" : ""}`}
            onClick={() => selectCategory(cat)}
          >
            {getCategoryName(cat)}
          </button>
        ))}
      </div>

      {/* View Mode Toggle - only show if there are before/after pairs */}
      {currentCategory && beforeAfterPairs.length > 0 && (
        <div className="view-mode-toggle" style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginTop: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            className={`category-button ${viewMode === 'beforeAfter' ? 'active' : ''}`}
            onClick={() => setViewMode('beforeAfter')}
            style={{ minWidth: '120px' }}
          >
            Before/After
          </button>
          <button
            className={`category-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            style={{ minWidth: '120px' }}
          >
            Grid View
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
