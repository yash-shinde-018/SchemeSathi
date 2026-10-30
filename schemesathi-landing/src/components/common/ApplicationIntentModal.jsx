import React from 'react';
import './ApplicationIntentModal.css';

/**
 * ApplicationIntentModal
 * 
 * Prompt displayed when citizen navigates away from a scheme details page:
 * Asks if the user wants to apply for the scheme ('YES' or 'MAYBE').
 * Based on user choice, the scheme is saved to My Applications for tracking,
 * and recommendations are updated.
 */
export default function ApplicationIntentModal({
  isOpen,
  scheme,
  onSelectOption,
  onClose
}) {
  if (!isOpen || !scheme) return null;

  return (
    <div className="intent-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="intent-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="intent-modal-close" onClick={onClose} title="Dismiss & Proceed">
          <i className="fa fa-times"></i>
        </button>

        {/* Header Icon & Title */}
        <div className="intent-modal-header">
          <div className="intent-icon-badge">
            <i className="fa fa-file-signature"></i>
          </div>
          <span className="intent-header-tag">Application Tracker</span>
          <h3 className="intent-modal-title">Do you want to apply for this scheme?</h3>
          <p className="intent-modal-subtitle">
            Keep track of your application progress and update your personalized recommendations.
          </p>
        </div>

        {/* Scheme Preview Banner */}
        <div className="intent-scheme-preview">
          <div className="intent-scheme-badge-row">
            <span className="intent-preview-category">
              <i className={`fa ${scheme.category?.icon || 'fa-landmark'}`}></i>
              {scheme.category?.name || scheme.category_name || 'Government Scheme'}
            </span>
            <span className="intent-preview-level">
              <i className="fa fa-map-pin"></i>
              {scheme.state || 'Central / All India'}
            </span>
          </div>
          <h4 className="intent-preview-name">{scheme.name}</h4>
          {scheme.ministry && (
            <p className="intent-preview-ministry">
              <i className="fa fa-building-columns"></i> {scheme.ministry}
            </p>
          )}
        </div>

        {/* Reality & Tracker Explanation */}
        <div className="intent-info-note">
          <i className="fa fa-circle-info"></i>
          <span>
            Government applications are submitted directly on official portals. Adding this scheme to <strong>My Applications</strong> lets you record your application details, track your progress, and mark it as applied.
          </span>
        </div>

        {/* Action Options */}
        <div className="intent-options-group">
          {/* Option 1: YES */}
          <button
            type="button"
            className="intent-btn intent-btn-yes"
            onClick={() => onSelectOption('YES')}
          >
            <div className="intent-btn-icon yes-icon">
              <i className="fa fa-circle-check"></i>
            </div>
            <div className="intent-btn-content">
              <span className="intent-btn-title">Yes, I want to apply</span>
              <span className="intent-btn-desc">Add to My Applications as Planning to Apply</span>
            </div>
            <i className="fa fa-arrow-right intent-btn-arrow"></i>
          </button>

          {/* Option 2: MAYBE */}
          <button
            type="button"
            className="intent-btn intent-btn-maybe"
            onClick={() => onSelectOption('MAYBE')}
          >
            <div className="intent-btn-icon maybe-icon">
              <i className="fa fa-clock"></i>
            </div>
            <div className="intent-btn-content">
              <span className="intent-btn-title">Maybe later</span>
              <span className="intent-btn-desc">Save in My Applications as Considering</span>
            </div>
            <i className="fa fa-arrow-right intent-btn-arrow"></i>
          </button>
        </div>

        {/* Option 3: Dismiss / Not Now */}
        <div className="intent-footer">
          <button
            type="button"
            className="intent-btn-dismiss"
            onClick={() => onSelectOption('NOT_NOW')}
          >
            Not now, just browsing →
          </button>
        </div>
      </div>
    </div>
  );
}
