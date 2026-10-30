import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../services/apiClient';
import './ProfileOnboardingModal.css';

const INDIAN_STATES = [
  'Maharashtra', 'Uttar Pradesh', 'Gujarat', 'Delhi', 'Karnataka', 
  'Madhya Pradesh', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh', 
  'West Bengal', 'Bihar', 'Kerala', 'Punjab', 'Haryana', 
  'Telangana', 'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh'
];

const PREFERRED_CATEGORY_OPTIONS = [
  { id: 'Agriculture & Farmers', icon: 'fa-seedling', labelKey: 'catAgriculture' },
  { id: 'Education & Scholarships', icon: 'fa-graduation-cap', labelKey: 'catEducation' },
  { id: 'Healthcare', icon: 'fa-heartbeat', labelKey: 'catHealthcare' },
  { id: 'Business & Entrepreneurship', icon: 'fa-briefcase', labelKey: 'catBusiness' },
  { id: 'Housing', icon: 'fa-home', labelKey: 'catHousing' },
  { id: 'Women & Child Welfare', icon: 'fa-female', labelKey: 'catWomen' },
  { id: 'Social Welfare & Financial Assistance', icon: 'fa-hand-holding-usd', labelKey: 'catSocial' },
  { id: 'Employment & Skills', icon: 'fa-tools', labelKey: 'catSkills' }
];

export default function ProfileOnboardingModal({ isOpen, onClose, onComplete, initialProfile = {} }) {
  const { t, translateCategory } = useLanguage();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state - starts completely blank/unselected for new users
  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: '',
    state: '',
    district: '',
    residence_type: '',
    occupation: '',
    annual_income: '',
    education_level: '',
    social_category: '',
    preferred_categories: []
  });

  useEffect(() => {
    if (initialProfile) {
      const p = initialProfile.profile || initialProfile;
      setFormData(prev => ({
        ...prev,
        date_of_birth: p.date_of_birth || '',
        gender: p.gender || '',
        state: p.state || '',
        district: p.district || '',
        residence_type: p.residence_type || p.area || '',
        occupation: p.occupation || '',
        annual_income: (p.annual_income !== null && p.annual_income !== undefined && p.annual_income !== '')
          ? String(p.annual_income)
          : (p.income !== null && p.income !== undefined && p.income !== '' ? String(p.income) : ''),
        education_level: p.education_level || p.education || '',
        social_category: p.social_category || '',
        preferred_categories: (Array.isArray(p.preferred_categories) && p.preferred_categories.length > 0)
          ? p.preferred_categories
          : []
      }));
    }
  }, [initialProfile]);

  if (!isOpen) return null;

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const calculatedAge = calculateAge(formData.date_of_birth);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (catId) => {
    setFormData(prev => {
      const current = prev.preferred_categories || [];
      const exists = current.includes(catId);
      const updated = exists 
        ? current.filter(id => id !== catId)
        : [...current, catId];
      return { ...prev, preferred_categories: updated };
    });
  };

  const handleIncomePreset = (val) => {
    setFormData(prev => ({ ...prev, annual_income: String(val) }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        state: formData.state || null,
        district: formData.district?.trim() || null,
        city: formData.district?.trim() || null,
        residence_type: formData.residence_type || null,
        area: formData.residence_type || null,
        occupation: formData.occupation || null,
        annual_income: (formData.annual_income && formData.annual_income !== '') ? Number(formData.annual_income) : null,
        income: (formData.annual_income && formData.annual_income !== '') ? Number(formData.annual_income) : null,
        education_level: formData.education_level || null,
        education: formData.education_level || null,
        social_category: formData.social_category || null,
        preferred_categories: Array.isArray(formData.preferred_categories) ? formData.preferred_categories : []
      };

      const res = await apiClient.users.updateProfile(payload);
      if (res && res.success) {
        // Clear any skip flags and cache updated profile
        try {
          sessionStorage.removeItem('schemesathi_onboarding_skipped');
          const uid = initialProfile?.id || initialProfile?.user_id;
          if (uid) {
            sessionStorage.removeItem(`schemesathi_onboarding_skipped_${uid}`);
          }
          if (res.data) {
            sessionStorage.setItem('schemesathi_user_profile', JSON.stringify(res.data));
          }
        } catch (e) {
          console.warn('[ProfileOnboardingModal] sessionStorage error:', e);
        }

        if (onComplete) onComplete(payload);
        onClose();
      } else {
        setError(res?.message || 'Failed to save profile. Please check your connection.');
      }
    } catch (err) {
      console.error('Error saving onboarding profile:', err);
      const errorMsg = err.message === 'Failed to fetch'
        ? 'Unable to connect to server. Please try submitting again.'
        : (err.message || 'Something went wrong while saving details.');
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Record skip in session so user is not prompted again this session
    try {
      const uid = initialProfile?.id || initialProfile?.user_id;
      if (uid) {
        sessionStorage.setItem(`schemesathi_onboarding_skipped_${uid}`, 'true');
      }
      sessionStorage.setItem('schemesathi_onboarding_skipped', 'true');
    } catch (e) {
      console.warn('[ProfileOnboardingModal] skip session error:', e);
    }
    onClose();
  };

  return (
    <div className="onboarding-modal-overlay" onClick={handleSkip}>
      <div 
        className="onboarding-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="onboarding-modal-header">
          <div className="onboarding-badge-row">
            <span className="onboarding-pill">
              <i className="fa fa-lightbulb"></i> 🎯 {t('onboardingStepBadge', 'Personalized Scheme Matching')}
            </span>
            <button 
              type="button" 
              className="onboarding-close-btn" 
              onClick={handleSkip}
              title={t('skipForNow', 'Skip for now')}
            >
              <i className="fa fa-times"></i>
            </button>
          </div>

          <h2 className="onboarding-title">
            {t('onboardingModalTitle', 'Complete Your Profile for Personalized Recommendations')}
          </h2>
          <p className="onboarding-subtitle">
            {t('onboardingModalSub', 'Provide a few quick details so SchemeSathi can match you with eligible government grants, subsidies, and scholarships.')}
          </p>

          {/* Stepper Tabs */}
          <div className="onboarding-stepper">
            <button 
              type="button"
              className={`stepper-tab ${step === 1 ? 'active' : 'completed'}`}
              onClick={() => setStep(1)}
            >
              <span className="stepper-num">{step > 1 ? '✓' : '1'}</span>
              <span className="stepper-label">{t('onboardingStep1', '1. Demographics & Location')}</span>
            </button>
            <div className="stepper-divider"></div>
            <button 
              type="button"
              className={`stepper-tab ${step === 2 ? 'active' : ''}`}
              onClick={() => setStep(2)}
            >
              <span className="stepper-num">2</span>
              <span className="stepper-label">{t('onboardingStep2', '2. Socio-Economic & Preferences')}</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="onboarding-error-banner">
            <i className="fa fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="onboarding-modal-form">
          <div className="onboarding-modal-body">
            {step === 1 ? (
              <div className="onboarding-step-content fade-in">
                {/* Row 1: DOB & Gender */}
                <div className="onboarding-grid-2">
                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-calendar-alt"></i> {t('dob', 'Date of Birth')}
                    </label>
                    <input 
                      type="date" 
                      name="date_of_birth"
                      className="onboarding-input"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                    {calculatedAge !== null && (
                      <span className="onboarding-hint-tag">
                        🎂 {t('age', 'Age')}: <strong>{calculatedAge} yrs</strong>
                      </span>
                    )}
                  </div>

                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-venus-mars"></i> {t('gender', 'Gender')}
                    </label>
                    <select 
                      name="gender" 
                      className="onboarding-select"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">-- {t('selectGender', 'Select Gender')} --</option>
                      <option value="MALE">👨 {t('genderMale', 'Male')}</option>
                      <option value="FEMALE">👩 {t('genderFemale', 'Female')}</option>
                      <option value="OTHER">⚧ {t('genderOther', 'Other')}</option>
                      <option value="PREFER_NOT_TO_SAY">🔒 {t('genderPreferNot', 'Prefer not to say')}</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: State & District */}
                <div className="onboarding-grid-2">
                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-map-marker-alt"></i> {t('state', 'State / Union Territory')}
                    </label>
                    <select 
                      name="state" 
                      className="onboarding-select"
                      value={formData.state}
                      onChange={handleInputChange}
                    >
                      <option value="">-- {t('selectState', 'Select State / UT')} --</option>
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-city"></i> {t('district', 'District / Taluka')}
                    </label>
                    <input 
                      type="text" 
                      name="district"
                      className="onboarding-input"
                      placeholder={t('districtPlaceholder', 'e.g. Pune, Nashik, Nagpur...')}
                      value={formData.district}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Row 3: Rural vs Urban Residence Type */}
                <div className="onboarding-field">
                  <label>
                    <i className="fa fa-mountain-sun"></i> {t('residenceArea', 'Residence Type / Area')} *
                  </label>
                  <div className="residence-pill-toggle">
                    <button
                      type="button"
                      className={`residence-pill ${formData.residence_type === 'RURAL' ? 'active' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, residence_type: p.residence_type === 'RURAL' ? '' : 'RURAL' }))}
                    >
                      <i className="fa fa-tree"></i>
                      <span>{t('residenceRural', '🌾 Rural (Gram Panchayat)')}</span>
                    </button>
                    <button
                      type="button"
                      className={`residence-pill ${formData.residence_type === 'URBAN' ? 'active' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, residence_type: p.residence_type === 'URBAN' ? '' : 'URBAN' }))}
                    >
                      <i className="fa fa-city"></i>
                      <span>{t('residenceUrban', '🏙️ Urban (Municipality/City)')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="onboarding-step-content fade-in">
                {/* Row 1: Occupation & Education */}
                <div className="onboarding-grid-2">
                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-briefcase"></i> {t('occupation', 'Primary Occupation')} *
                    </label>
                    <select 
                      name="occupation" 
                      className="onboarding-select"
                      value={formData.occupation}
                      onChange={handleInputChange}
                    >
                      <option value="">-- {t('selectOccupation', 'Select Occupation')} --</option>
                      <option value="Farmer">🌾 {t('occFarmer', 'Farmer / Agriculture')}</option>
                      <option value="Student">🎓 {t('occStudent', 'Student / Scholar')}</option>
                      <option value="Self-Employed">💼 {t('occSelfEmployed', 'Self Employed / Artisan')}</option>
                      <option value="Daily Wage Laborer">🔨 {t('occDailyWage', 'Daily Wage Laborer')}</option>
                      <option value="Salaried">👔 {t('occSalaried', 'Salaried Employee')}</option>
                      <option value="Homemaker">🏡 {t('occHomemaker', 'Homemaker')}</option>
                      <option value="Unemployed">⏳ {t('occUnemployed', 'Unemployed Youth')}</option>
                    </select>
                  </div>

                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-graduation-cap"></i> {t('education', 'Education Level')} *
                    </label>
                    <select 
                      name="education_level" 
                      className="onboarding-select"
                      value={formData.education_level}
                      onChange={handleInputChange}
                    >
                      <option value="">-- {t('selectEducation', 'Select Education Level')} --</option>
                      <option value="PRIMARY">{t('eduPrimary', 'Primary / Below 10th')}</option>
                      <option value="SECONDARY">{t('edu10th', '10th Pass (SSC)')}</option>
                      <option value="HIGHER_SECONDARY">{t('edu12th', '12th Pass (HSC)')}</option>
                      <option value="DIPLOMA">{t('eduDiploma', 'Diploma / ITI')}</option>
                      <option value="BACHELOR">{t('eduGraduate', 'Bachelor Degree / Graduate')}</option>
                      <option value="POST_GRADUATE">{t('eduPostGraduate', 'Post Graduate / Master')}</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Annual Income & Social Category */}
                <div className="onboarding-grid-2">
                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-rupee-sign"></i> {t('annualIncome', 'Annual Family Income (₹)')} *
                    </label>
                    <input 
                      type="number" 
                      name="annual_income"
                      className="onboarding-input"
                      placeholder="e.g. 150000"
                      value={formData.annual_income}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="income-chips">
                      <button type="button" onClick={() => handleIncomePreset(80000)} className={formData.annual_income === '80000' ? 'active' : ''}>&lt; ₹1L</button>
                      <button type="button" onClick={() => handleIncomePreset(200000)} className={formData.annual_income === '200000' ? 'active' : ''}>₹2L</button>
                      <button type="button" onClick={() => handleIncomePreset(350000)} className={formData.annual_income === '350000' ? 'active' : ''}>₹3.5L</button>
                      <button type="button" onClick={() => handleIncomePreset(600000)} className={formData.annual_income === '600000' ? 'active' : ''}>₹6L</button>
                    </div>
                  </div>

                  <div className="onboarding-field">
                    <label>
                      <i className="fa fa-id-card"></i> {t('socialCategory', 'Social Category / Caste')} *
                    </label>
                    <select 
                      name="social_category" 
                      className="onboarding-select"
                      value={formData.social_category}
                      onChange={handleInputChange}
                    >
                      <option value="">-- {t('selectSocialCategory', 'Select Social Category')} --</option>
                      <option value="GENERAL">{t('catGeneral', 'General / Open')}</option>
                      <option value="OBC">{t('catOBC', 'OBC (Other Backward Class)')}</option>
                      <option value="SC">{t('catSC', 'SC (Scheduled Caste)')}</option>
                      <option value="ST">{t('catST', 'ST (Scheduled Tribe)')}</option>
                      <option value="EWS">{t('catEWS', 'EWS (Economically Weaker Section)')}</option>
                      <option value="MINORITY">{t('catMinority', 'Minority Community')}</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Preferred Scheme Categories Multi-Select Chips */}
                <div className="onboarding-field">
                  <label>
                    <i className="fa fa-heart"></i> {t('preferredCategoriesTitle', 'Preferred Scheme Categories')}
                  </label>
                  <p className="onboarding-field-sub">
                    {t('preferredCategoriesSub', 'Select schemes you are most interested in (Tap to toggle):')}
                  </p>
                  <div className="categories-chip-grid">
                    {PREFERRED_CATEGORY_OPTIONS.map(cat => {
                      const isSelected = (formData.preferred_categories || []).includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`category-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleCategoryToggle(cat.id)}
                        >
                          <i className={`fa ${cat.icon}`}></i>
                          <span>{translateCategory(cat.id)}</span>
                          {isSelected && <i className="fa fa-check chip-check"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="onboarding-modal-footer">
            <div className="footer-left">
              <button 
                type="button" 
                className="skip-btn" 
                onClick={handleSkip}
                disabled={saving}
                title="Skip this setup and fill details later in Profile"
              >
                <i className="fa fa-forward-step"></i>
                <span>{t('skipForNow', 'Skip for now')}</span>
              </button>
            </div>

            <div className="footer-right">
              {step === 2 && (
                <button 
                  type="button" 
                  className="step-back-btn" 
                  onClick={() => setStep(1)}
                  disabled={saving}
                >
                  <i className="fa fa-arrow-left"></i>
                  <span>{t('previous', 'Back')}</span>
                </button>
              )}

              {step === 1 ? (
                <button 
                  type="button" 
                  className="step-next-btn"
                  onClick={() => setStep(2)}
                >
                  <span>{t('next', 'Next: Preferences')}</span>
                  <i className="fa fa-arrow-right"></i>
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="save-recommend-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i>
                      <span>{t('calculatingRecommendations', 'Updating recommendations...')}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check-circle"></i>
                      <span>{t('saveAndGetRecommendations', 'Save & Get Recommendations')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
