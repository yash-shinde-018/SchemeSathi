import { useState } from 'react';
import PropTypes from 'prop-types';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/global.css';
import './LanguageSelector.css';

/**
 * Advanced LanguageSelector component with modern dropdown UI
 * Supporting all 6 Indian languages synced with global LanguageContext
 */
export default function LanguageSelector({
  placement = 'navbar',
}) {
  const { currentLanguage, currentLanguageData, languages, changeLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setDropdownOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setDropdownOpen(!dropdownOpen);
    }
  };

  const filteredLanguages = languages.filter((lang) =>
    lang.nativeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="advanced-language-selector" data-placement={placement}>
      {/* Trigger button */}
      <button
        type="button"
        className="language-trigger"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
        aria-label="Select language"
      >
        <span className="language-label">{currentLanguageData?.nativeLabel}</span>
        <span className="language-chevron">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {/* Advanced dropdown menu */}
      {dropdownOpen && (
        <div className="language-dropdown" role="listbox">
          {/* Search input */}
          <div className="language-search-container">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="search-icon"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="language-search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Language options */}
          <div className="language-options">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  role="option"
                  className={`language-option ${currentLanguage === language.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange(language.code)}
                  aria-selected={currentLanguage === language.code}
                >
                  <span className="option-label">{language.nativeLabel} ({language.label})</span>
                  {currentLanguage === language.code && (
                    <span className="option-checkmark">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="no-results">No languages found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

LanguageSelector.propTypes = {
  currentLanguage: PropTypes.oneOf(['en', 'hi', 'mr']),
  onLanguageChange: PropTypes.func,
  placement: PropTypes.oneOf(['navbar', 'footer']),
};
