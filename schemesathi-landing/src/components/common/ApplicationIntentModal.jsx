import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  translateSchemeTitle,
  translateAuthorityName,
  translateStateName,
} from '../../utils/schemeTranslator';
import './ApplicationIntentModal.css';

/**
 * ApplicationIntentModal
 * 
 * Prompt displayed when citizen navigates away from a scheme details page:
 * Asks if the user wants to apply for the scheme ('YES' or 'MAYBE').
 * Fully translated and reactive to selected language.
 */
export default function ApplicationIntentModal({
  isOpen,
  scheme,
  onSelectOption,
  onClose
}) {
  const { currentLanguage, t, translateCategory } = useLanguage();
  if (!isOpen || !scheme) return null;

  const translatedTitle = translateSchemeTitle(scheme.name, currentLanguage);
  const rawCat = scheme.category?.name || scheme.category_name || '';
  const translatedCategory = translateCategory(rawCat) || rawCat || t('governmentScheme', 'Government Scheme');
  const rawState = scheme.state || 'All India';
  const translatedState = translateStateName(rawState, currentLanguage) || rawState;
  const rawMinistry = scheme.ministry || scheme.ministry_department;
  const translatedMinistry = rawMinistry ? translateAuthorityName(rawMinistry, currentLanguage) : null;

  return (
    <div className="intent-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="intent-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="intent-modal-close" onClick={onClose} title={t('dismissAndProceed', 'Dismiss & Proceed')}>
          <i className="fa fa-times"></i>
        </button>

        {/* Header Icon & Title */}
        <div className="intent-modal-header">
          <div className="intent-icon-badge">
            <i className="fa fa-file-signature"></i>
          </div>
          <span className="intent-header-tag">{t('intentTrackerTag', 'Application Tracker')}</span>
          <h3 className="intent-modal-title">{t('intentModalTitle', 'Do you want to apply for this scheme?')}</h3>
          <p className="intent-modal-subtitle">
            {t('intentModalSubtitle', 'Keep track of your application progress and update your personalized recommendations.')}
          </p>
        </div>

        {/* Scheme Preview Banner */}
        <div className="intent-scheme-preview">
          <div className="intent-scheme-badge-row">
            <span className="intent-preview-category">
              <i className={`fa ${scheme.category?.icon || 'fa-landmark'}`}></i>
              {translatedCategory}
            </span>
            <span className="intent-preview-level">
              <i className="fa fa-map-pin"></i>
              {translatedState}
            </span>
          </div>
          <h4 className="intent-preview-name">{translatedTitle}</h4>
          {translatedMinistry && (
            <p className="intent-preview-ministry">
              <i className="fa fa-building-columns"></i> {translatedMinistry}
            </p>
          )}
        </div>

        {/* Reality & Tracker Explanation */}
        <div className="intent-info-note">
          <i className="fa fa-circle-info"></i>
          <span>
            {t('intentInfoNote', 'Government applications are submitted directly on official portals. Adding this scheme to My Applications lets you record your application details, track your progress, and mark it as applied.')}
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
              <span className="intent-btn-title">{t('intentYesTitle', 'Yes, I want to apply')}</span>
              <span className="intent-btn-desc">{t('intentYesDesc', 'Add to My Applications as Planning to Apply')}</span>
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
              <span className="intent-btn-title">{t('intentMaybeTitle', 'Maybe later')}</span>
              <span className="intent-btn-desc">{t('intentMaybeDesc', 'Save in My Applications as Considering')}</span>
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
            {t('intentDismiss', 'Not now, just browsing →')}
          </button>
        </div>
      </div>
    </div>
  );
}
