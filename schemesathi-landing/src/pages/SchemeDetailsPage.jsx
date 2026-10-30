import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/apiClient';
import applicationService, { APPLICATIONS_UPDATED_EVENT } from '../services/applicationService';
import ApplicationIntentModal from '../components/common/ApplicationIntentModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useLanguage } from '../context/LanguageContext';
import { useSystemSettings } from '../context/SystemSettingsContext';
import {
  translateSchemeTitle,
  translateAuthorityName,
  translateStateName,
  translateStepTitle,
  translateTimelineChip,
  translateDocumentName,
  translateSchemeText,
  generateLocalizedAboutBullets
} from '../utils/schemeTranslator';
import '../styles/scheme-details.css';

// Module-level persistent cache across component re-mounts and language changes
const memoryTranslationCache = {};

const getCachedTranslations = (lang) => {
  if (!lang || lang === 'en') return {};
  if (memoryTranslationCache[lang]) return memoryTranslationCache[lang];
  try {
    const raw = sessionStorage.getItem(`schemesathi_trans_${lang}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryTranslationCache[lang] = parsed;
      return parsed;
    }
  } catch (e) {}
  return {};
};

const saveCachedTranslations = (lang, newMap) => {
  if (!lang || lang === 'en' || !newMap) return;
  if (!memoryTranslationCache[lang]) memoryTranslationCache[lang] = {};
  Object.assign(memoryTranslationCache[lang], newMap);
  try {
    sessionStorage.setItem(`schemesathi_trans_${lang}`, JSON.stringify(memoryTranslationCache[lang]));
  } catch (e) {}
};

export default function SchemeDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { isMaintenanceMode, showMaintenanceAlert } = useSystemSettings();
  const { currentLanguage, t, translateCategory, translateMode, translateGovtLevel } = useLanguage();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dynamicTranslations, setDynamicTranslations] = useState(() => ({
    [currentLanguage]: getCachedTranslations(currentLanguage)
  }));
  const [isTranslating, setIsTranslating] = useState(false);

  // Application Tracking & Intent States
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState(null);
  const [userApp, setUserApp] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const schemeRef = useRef(null);

  const refreshAppStatus = () => {
    if (id) {
      const app = applicationService.getApplication(id);
      setUserApp(app);
    }
  };

  useEffect(() => {
    fetchSchemeDetails();
    refreshAppStatus();
    window.scrollTo(0, 0);

    const handleAppUpdated = () => refreshAppStatus();
    window.addEventListener(APPLICATIONS_UPDATED_EVENT, handleAppUpdated);
    return () => window.removeEventListener(APPLICATIONS_UPDATED_EVENT, handleAppUpdated);
  }, [id]);

  // Keep scheme in ref for event listener
  useEffect(() => {
    schemeRef.current = scheme;
  }, [scheme]);

  // Dynamic Batch Translation Hook: Instant hydration from cache + concurrent fetch
  useEffect(() => {
    if (!scheme || currentLanguage === 'en') {
      setIsTranslating(false);
      return;
    }

    // 1. Instant hydration from client memory/sessionStorage (0ms latency)
    const existingCache = getCachedTranslations(currentLanguage);
    if (existingCache && Object.keys(existingCache).length > 0) {
      setDynamicTranslations(prev => ({
        ...prev,
        [currentLanguage]: {
          ...(prev[currentLanguage] || {}),
          ...existingCache
        }
      }));
    }

    const bData = getBenefitsData(scheme.benefits);
    const eData = getEligibilityData(scheme);
    const docs = getDocumentsList(scheme);
    const appFlow = parseApplicationProcess(scheme.application_process);

    const stringSet = new Set();
    if (scheme.name) stringSet.add(scheme.name);
    if (scheme.description) stringSet.add(scheme.description);
    if (scheme.ministry) stringSet.add(scheme.ministry);
    if (scheme.ministry_department) stringSet.add(scheme.ministry_department);
    if (bData?.bullets) bData.bullets.forEach(b => stringSet.add(b));
    if (eData?.criteriaBullets) eData.criteriaBullets.forEach(c => stringSet.add(c));
    if (eData?.notes) eData.notes.forEach(n => stringSet.add(n));
    if (eData?.exclusions) eData.exclusions.forEach(e => stringSet.add(e));
    if (docs) docs.forEach(d => stringSet.add(d));
    if (appFlow?.intro) stringSet.add(appFlow.intro);
    if (appFlow?.steps) {
      appFlow.steps.forEach(s => {
        if (s.title) stringSet.add(s.title);
        if (s.mainText) stringSet.add(s.mainText);
        if (s.note) stringSet.add(s.note);
        if (s.disbursal) stringSet.add(s.disbursal);
        if (s.phase) stringSet.add(s.phase);
      });
    }

    const allStrings = Array.from(stringSet).filter(Boolean);
    const missingStrings = allStrings.filter(s => !existingCache[s]);

    if (missingStrings.length === 0) {
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    let isMounted = true;

    apiClient.schemes.translate(missingStrings, currentLanguage)
      .then(res => {
        if (isMounted) {
          setIsTranslating(false);
          if (res?.success && res.translations) {
            saveCachedTranslations(currentLanguage, res.translations);
            setDynamicTranslations(prev => ({
              ...prev,
              [currentLanguage]: {
                ...(prev[currentLanguage] || {}),
                ...res.translations
              }
            }));
          }
        }
      })
      .catch(err => {
        if (isMounted) setIsTranslating(false);
        console.warn('Dynamic scheme translation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [scheme, currentLanguage]);

  // Background Pre-fetcher: Pre-caches translations in background while user reads in English
  useEffect(() => {
    if (!scheme) return;
    const bData = getBenefitsData(scheme.benefits);
    const eData = getEligibilityData(scheme);
    const docs = getDocumentsList(scheme);

    const stringSet = new Set();
    if (scheme.name) stringSet.add(scheme.name);
    if (scheme.description) stringSet.add(scheme.description);
    if (scheme.ministry) stringSet.add(scheme.ministry);
    if (bData?.bullets) bData.bullets.forEach(b => stringSet.add(b));
    if (eData?.criteriaBullets) eData.criteriaBullets.forEach(c => stringSet.add(c));
    if (docs) docs.forEach(d => stringSet.add(d));

    const sampleStrings = Array.from(stringSet).filter(Boolean).slice(0, 15);
    if (sampleStrings.length === 0) return;

    // Silently pre-cache for vernacular languages
    ['mr', 'hi'].forEach(targetLang => {
      const existing = getCachedTranslations(targetLang);
      const missing = sampleStrings.filter(s => !existing[s]);
      if (missing.length > 0) {
        apiClient.schemes.translate(missing, targetLang).then(res => {
          if (res?.success && res.translations) {
            saveCachedTranslations(targetLang, res.translations);
          }
        }).catch(() => {});
      }
    });
  }, [scheme?.id]);

  // Intercept navigation away (sidebar links, top brand, etc.) to trigger intent prompt
  useEffect(() => {
    const handleDocumentClick = (e) => {
      // Find closest anchor tag with an href
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('http') || href.startsWith('mailto:')) {
        return;
      }

      // If clicked the current page or an anchor within it, ignore
      const currentPath = window.location.pathname;
      if (href === currentPath) return;

      const currentScheme = schemeRef.current;
      if (currentScheme && currentScheme.id && !applicationService.hasUserDecided(currentScheme.id)) {
        e.preventDefault();
        e.stopPropagation();
        setPendingNavPath(href);
        setShowIntentModal(true);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  const handleBackNavigation = () => {
    if (scheme && scheme.id && !applicationService.hasUserDecided(scheme.id)) {
      setPendingNavPath('/explore');
      setShowIntentModal(true);
    } else {
      navigate('/explore');
    }
  };

  const handleIntentOption = async (option) => {
    setShowIntentModal(false);
    if (isMaintenanceMode && option !== 'NOT_NOW') {
      showMaintenanceAlert('Application tracking');
      return;
    }
    const targetPath = pendingNavPath;
    setPendingNavPath(null);

    if (option === 'YES') {
      await applicationService.recordIntent(scheme, 'YES');
      refreshAppStatus();
      setToastMsg(`Saved ${scheme.name} to My Applications (Planning to Apply)!`);
      setTimeout(() => setToastMsg(null), 4000);
      if (targetPath) {
        setTimeout(() => navigate(targetPath), 350);
      }
    } else if (option === 'MAYBE') {
      await applicationService.recordIntent(scheme, 'MAYBE');
      refreshAppStatus();
      setToastMsg(`Saved ${scheme.name} to My Applications (Considering).`);
      setTimeout(() => setToastMsg(null), 4000);
      if (targetPath) {
        setTimeout(() => navigate(targetPath), 350);
      }
    } else {
      applicationService.recordNotNow(scheme?.id);
      if (targetPath) {
        navigate(targetPath);
      }
    }
  };

  const handleQuickMarkApplied = async () => {
    if (isMaintenanceMode) {
      showMaintenanceAlert('Application tracking');
      return;
    }
    if (!scheme) return;
    await applicationService.markAsApplied(scheme.id, {
      appliedDate: new Date().toISOString()
    });
    refreshAppStatus();
    setToastMsg(`Marked ${scheme.name} as Applied on Official Portal! Recommendations updated.`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const fetchSchemeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient(`/schemes/${id}`);

      if (response && response.success) {
        const schemeData = response.scheme || response.data;
        setScheme(schemeData);
        setIsSaved(Boolean(schemeData.is_saved));
      } else {
        setError(response?.message || 'Failed to load scheme details');
      }
    } catch (err) {
      setError(err.message || 'Error fetching scheme details from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = async () => {
    if (isMaintenanceMode) {
      showMaintenanceAlert('Saving schemes');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setSaveLoading(true);
      const endpoint = isSaved ? `/schemes/${id}/unsave` : `/schemes/${id}/save`;
      const response = await apiClient(endpoint, { method: 'POST' });

      if (response && response.success) {
        setIsSaved(!isSaved);
      } else {
        alert(response?.message || 'Failed to update bookmark status');
      }
    } catch (err) {
      console.error('Save toggle error:', err);
      alert('Unable to update bookmark status. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Robust extractor that converts raw dataset text/paragraphs into valid, complete sentences
  const textToBulletList = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) {
      return text.flatMap(t => textToBulletList(t)).filter(Boolean);
    }
    if (typeof text === 'object') {
      return Object.values(text).flatMap(t => textToBulletList(t)).filter(Boolean);
    }
    if (typeof text !== 'string') return [String(text)];

    // 1. Remove non-ascii corrupted bullet characters
    let cleaned = text
      .replace(/[\ufffd\u2022\u25cf\u25aa\u25b8\u2013\u2014*•]+/g, ' ')
      .replace(/\r\n|\r/g, '\n')
      .trim();

    // 2. Protect decimals FIRST (e.g. 50,000.00 or 1.5 or 2.5%) before adding spaces
    const DEC = '___DEC___';
    cleaned = cleaned.replace(/(\d[\d,]*)\.(\d+)/g, (m, p1, p2) => p1 + DEC + p2);

    // 3. Protect common abbreviations (Coop., Govt., Dept., Ltd., No., Dr., etc., Rs., AD., i.e., e.g.)
    const DOT = '___DOT___';
    cleaned = cleaned.replace(/\b(Coop|Govt|Dept|Ltd|Pvt|Inc|No|Dr|Mr|Mrs|Ms|vs|etc|Rs|AD|i\.e|e\.g)\./gi, (m, p) => p + DOT);

    // 4. Fix missing space after punctuation (e.g. APCO.The or (H&T).Registers or projects.2)
    cleaned = cleaned.replace(/([a-zA-Z\)])\.([A-Z])/g, '$1. $2');
    cleaned = cleaned.replace(/([a-zA-Z])\.(\d)/g, '$1. $2');

    // 5. Fix missing space before Rs or rupee symbol
    cleaned = cleaned.replace(/([a-zA-Z])(Rs\b|Rs\.|₹)/g, '$1 $2');

    // 6. Re-join mid-sentence line breaks where previous line didn't end with terminal punctuation
    const rawLines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
    const joinedLines = [];
    rawLines.forEach(line => {
      if (
        joinedLines.length > 0 &&
        (!/[.!?:;]$/.test(joinedLines[joinedLines.length - 1]) ||
          /^[a-z,;]/.test(line) ||
          /^(?:and|or|in|to|its|of|for|with|by|from|etc\.?)\b/i.test(line))
      ) {
        joinedLines[joinedLines.length - 1] += ' ' + line;
      } else {
        joinedLines.push(line);
      }
    });

    const fullContent = joinedLines.join(' ');

    // 7. Check for explicit list delimiters: semicolons, numbers, or sentences
    const numberedItemRegex = /(?:^|\s)(?:\d+[\.\)]|[a-zA-Z][\.\)]|\(\d+\)|\([a-zA-Z]\))\s+([^0-9\n]+?)(?=(?:\s+\d+[\.\)]|\s+[a-zA-Z][\.\)]|\s+\(\d+\)|\s+\([a-zA-Z]\))|$)/g;
    const numberedMatches = [...fullContent.matchAll(numberedItemRegex)];

    let candidates = [];
    if (fullContent.includes(';')) {
      // Split by semicolon (standard delimiter used by admin to separate distinct criteria / benefits)
      candidates = fullContent
        .split(/;\s*/)
        .map(s => s.trim().replace(/[;\.]+\s*$/, '').trim())
        .filter(Boolean);
    } else if (numberedMatches.length > 1) {
      candidates = numberedMatches.map(m => m[1].trim());
    } else {
      // Split by terminal punctuation (. ! ?) followed by whitespace and Capital letter or numbered item
      candidates = fullContent
        .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    // 8. Restore protected tokens, clean, validate, and capitalize each candidate sentence
    const validSentences = [];
    for (let cand of candidates) {
      let s = cand
        .replace(new RegExp(DOT, 'g'), '.')
        .replace(new RegExp(DEC, 'g'), '.')
        .trim();

      // ONLY strip actual list markers (e.g. "1. ", "1) ", "(a) ", "• ", "- "), NOT initial numbers like "40% subsidy"
      s = s.replace(/^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\(\d+\)|\([a-zA-Z]\)|[-•*–—])\s*/, '').trim();

      // Remove meta labels like "Benefits:" or "Description:" if at the start
      s = s.replace(/^(?:Benefits|Description|Overview|Criteria)\s*:\s*/i, '').trim();

      // Discard empty or trivial fragments (< 3 chars or junk like "etc.")
      if (!s || s.length < 3 || /^(?:etc\.?|and|or|nil|na|n\/a)$/i.test(s)) {
        continue;
      }

      // Ensure the first letter is capitalized
      s = s.charAt(0).toUpperCase() + s.slice(1);

      // Ensure it ends with clean terminal punctuation
      if (!/[.!?:]$/.test(s)) {
        s += '.';
      }

      validSentences.push(s);
    }

    return validSentences.length > 0 ? validSentences : [fullContent.replace(new RegExp(DOT, 'g'), '.').replace(new RegExp(DEC, 'g'), '.')];
  };

  // Safe category parsing
  const getCategoryInfo = (cat) => {
    if (!cat) return { name: 'Social Welfare', icon: 'fa-hands-holding-child' };
    if (typeof cat === 'string') return { name: cat, icon: 'fa-folder-open' };
    if (typeof cat === 'object') {
      const name = cat.name || cat.title || 'Social Welfare';
      let icon = 'fa-folder-open';
      const lower = name.toLowerCase();
      if (lower.includes('educat') || lower.includes('scholar')) icon = 'fa-graduation-cap';
      else if (lower.includes('health') || lower.includes('arogya')) icon = 'fa-heart-pulse';
      else if (lower.includes('farm') || lower.includes('agri')) icon = 'fa-tractor';
      else if (lower.includes('women') || lower.includes('child')) icon = 'fa-person-breastfeeding';
      else if (lower.includes('welfare') || lower.includes('social') || lower.includes('financ')) icon = 'fa-hand-holding-dollar';
      else if (lower.includes('employ') || lower.includes('skill')) icon = 'fa-briefcase';
      return { name, icon };
    }
    return { name: String(cat), icon: 'fa-folder-open' };
  };

  // Extract distinct, high-value "About the Scheme" overview
  // Solves dataset overlap where description and benefits contain identical text
  const getAboutSchemeBullets = (schemeObj, benefitsDataObj) => {
    if (!schemeObj) return [];

    const rawDesc = typeof schemeObj.description === 'string' ? schemeObj.description.trim() : '';
    const rawBenefits = benefitsDataObj?.raw ? benefitsDataObj.raw.trim() : '';
    const categoryInfo = getCategoryInfo(schemeObj.category);
    const catName = categoryInfo.name;
    const ministry = schemeObj.ministry || schemeObj.ministry_department || 'Government of India';
    const govtLevel = (schemeObj.govt_level || '').toUpperCase() === 'CENTRAL' ? 'Central Government' : `${schemeObj.state || 'State'} Government`;
    const appMode = schemeObj.application_mode || 'Online';

    // Check if description is missing or identical/near-identical to benefits
    const isDuplicate = !rawDesc || (
      rawBenefits && (
        rawDesc.toLowerCase().replace(/[\s\W]+/g, '') === rawBenefits.toLowerCase().replace(/[\s\W]+/g, '') ||
        (rawDesc.length > 25 && rawBenefits.includes(rawDesc.slice(0, 35)))
      )
    );

    // If description is distinct and genuinely different from benefits, parse and return it
    if (!isDuplicate && rawDesc.length > 20) {
      return textToBulletList(rawDesc);
    }

    // Otherwise, generate a concise, high-value "About the Scheme" summary:
    const summaryBullets = [];

    // 1. Core Purpose Statement tailored by category & scheme name
    let purpose = `${schemeObj.name} is a dedicated ${govtLevel} welfare initiative administered by the ${ministry} to deliver critical financial and social assistance under the ${catName} sector.`;
    const catLower = catName.toLowerCase();
    const nameLower = (schemeObj.name || '').toLowerCase();

    if (catLower.includes('educat') || catLower.includes('scholar') || nameLower.includes('scholarship')) {
      purpose = `${schemeObj.name} is an academic financial assistance initiative managed by the ${ministry} to support eligible students in completing higher technical and professional diploma or degree education.`;
    } else if (catLower.includes('agri') || catLower.includes('farm') || nameLower.includes('kisan')) {
      purpose = `${schemeObj.name} is an agricultural support program under the ${ministry} designed to provide direct financial security, modern post-harvest infrastructure, and input subsidies to empower farmers.`;
    } else if (catLower.includes('women') || catLower.includes('child') || nameLower.includes('women')) {
      purpose = `${schemeObj.name} is a dedicated empowerment program under the ${ministry} created to advance socio-economic welfare, mobility, and financial self-reliance for women.`;
    } else if (catLower.includes('weav') || nameLower.includes('yarn') || nameLower.includes('textile') || nameLower.includes('subsidy')) {
      purpose = `${schemeObj.name} is an industrial welfare scheme under the ${ministry} to support weavers and cooperative societies by subsidizing raw material costs and boosting domestic handloom production.`;
    } else if (catLower.includes('health') || catLower.includes('arogya') || nameLower.includes('health') || nameLower.includes('bima')) {
      purpose = `${schemeObj.name} is a public health initiative administered by the ${ministry} providing critical healthcare coverage, hospitalization subsidies, and medical aid.`;
    } else if (catLower.includes('fellow') || nameLower.includes('fellowship') || nameLower.includes('research')) {
      purpose = `${schemeObj.name} is an international research and training program under the ${ministry} fostering academic exchange and scientific collaboration among researchers.`;
    }
    summaryBullets.push(purpose);

    // 2. Target Beneficiary Summary (extracted cleanly from eligibility criteria or scheme context)
    const rawElig = typeof schemeObj.eligibility === 'object' && schemeObj.eligibility
      ? (schemeObj.eligibility.criteria || JSON.stringify(schemeObj.eligibility))
      : String(schemeObj.eligibility || schemeObj.eligibility_criteria || '');

    let targetSummary = '';
    if (/orphan|covid|martyr|armed forces/i.test(rawElig) || /swanath/i.test(nameLower)) {
      targetSummary = 'Target Beneficiaries: Specifically designed for orphan students, children who lost parents during COVID-19, and wards of martyred Armed Forces or Central Armed Police Forces personnel.';
    } else if (catLower.includes('agri') || catLower.includes('farm') || /farmer|agricultural|kisan|crop|harvest|infra/i.test(nameLower) || (/farmer|agricultural|kisan/i.test(rawElig) && !catLower.includes('women'))) {
      targetSummary = 'Target Beneficiaries: Farmers, Primary Agricultural Credit Societies (PACS), Agri-entrepreneurs, Farmer Producer Organizations (FPOs), and agricultural cultivators.';
    } else if (/weavers?|handloom|societies|cooperative/i.test(rawElig) || /yarn|handloom/i.test(nameLower)) {
      targetSummary = 'Target Beneficiaries: Primary Handloom Weavers Cooperative Societies and registered artisan members engaged in active textile production.';
    } else if (catLower.includes('women') || /women|stree|mahila|kanya/i.test(nameLower) || /women|female|girl/i.test(rawElig)) {
      targetSummary = 'Target Beneficiaries: Working women, self-employed female workers, and eligible women-led households.';
    } else if (/student|scholarship|education/i.test(rawElig) || /scholarship|fellowship|vidya|student/i.test(nameLower)) {
      targetSummary = 'Target Beneficiaries: Enrolled students, scholars, and youth pursuing recognized academic or technical education.';
    } else if (rawElig && rawElig.length > 20) {
      const firstElig = rawElig.split(/[.!?\n]/)[0].replace(/^[\s\d.():•\-–*]+/, '').trim();
      if (firstElig.length > 15 && firstElig.length < 180) {
        targetSummary = `Target Beneficiaries: ${firstElig.charAt(0).toUpperCase() + firstElig.slice(1)}.`;
      }
    }
    if (targetSummary) {
      summaryBullets.push(targetSummary);
    }

    // 3. Application & Governance
    summaryBullets.push(
      `Application & Governance: Managed with end-to-end transparent verification via ${appMode} mode, ensuring direct and accountable delivery of benefits to verified applicants.`
    );

    return summaryBullets;
  };

  // Safe benefits extraction with bullet support
  const getBenefitsData = (benefits) => {
    if (!benefits) return null;
    if (typeof benefits === 'string') {
      const bullets = textToBulletList(benefits);
      return { bullets, raw: benefits };
    }
    if (typeof benefits === 'object') {
      if (Array.isArray(benefits)) {
        return { bullets: benefits.map(b => (typeof b === 'object' ? JSON.stringify(b) : String(b))), raw: '' };
      }
      if (benefits.details) {
        const bullets = textToBulletList(String(benefits.details));
        return { bullets, raw: String(benefits.details) };
      }
      const entries = Object.entries(benefits).map(
        ([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
      );
      return { bullets: entries, raw: '' };
    }
    return { bullets: [String(benefits)], raw: String(benefits) };
  };

  // Advanced eligibility parsing with notes and exclusions extraction
  const getEligibilityData = (schemeObj) => {
    const raw = schemeObj.eligibility || schemeObj.eligibility_criteria || schemeObj.eligibility_rules;
    if (!raw) return null;

    let text = '';
    if (typeof raw === 'string') {
      text = raw;
    } else if (typeof raw === 'object') {
      if (Array.isArray(raw)) {
        return { criteriaBullets: raw.map(String), notes: [], exclusions: [] };
      }
      if (raw.criteria) {
        text = String(raw.criteria);
      } else {
        const entries = Object.entries(raw).map(
          ([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
        );
        return { criteriaBullets: entries, notes: [], exclusions: [] };
      }
    }

    // Separate Exclusions
    let mainCriteriaText = text;
    let exclusionText = '';
    if (text.includes('Exclusions / Ineligibility:')) {
      const parts = text.split('Exclusions / Ineligibility:');
      mainCriteriaText = parts[0].trim();
      exclusionText = parts[1].trim();
    } else if (text.includes('Exclusions:')) {
      const parts = text.split('Exclusions:');
      mainCriteriaText = parts[0].trim();
      exclusionText = parts[1].trim();
    }

    // Separate Notes (NOTE 1:, NOTE 2:, etc.)
    const notes = [];
    if (/NOTE\s*\d*\s*:/i.test(mainCriteriaText)) {
      const noteMatches = mainCriteriaText.match(/NOTE\s*\d*\s*:[^]+?(?=(?:NOTE\s*\d*\s*:)|$)/gi);
      if (noteMatches) {
        noteMatches.forEach(n => {
          notes.push(n.trim());
        });
        // Remove the notes portion from main criteria
        mainCriteriaText = mainCriteriaText.replace(/NOTE\s*\d*\s*:[^]+$/i, '').trim();
      }
    }

    const criteriaBullets = textToBulletList(mainCriteriaText);
    const exclusions = exclusionText ? textToBulletList(exclusionText) : [];

    return { criteriaBullets, notes, exclusions };
  };

  // Safe, clean documents extraction that reconstructs valid, complete sentences from raw paragraph data
  const getDocumentsList = (schemeObj) => {
    const docs = schemeObj.documents_required || schemeObj.documents;
    if (!docs) return ['Valid Government Issued Photo Identity (Aadhaar / Voter ID / Ration Card).'];

    let rawList = [];
    if (Array.isArray(docs)) {
      rawList = docs.map(String);
    } else if (typeof docs === 'object' && docs !== null) {
      rawList = Object.values(docs).map(String);
    } else {
      rawList = [String(docs)];
    }

    // Split any blocks that contain embedded bullet characters (•, \u2022, etc.), semicolons, newlines, or numbered markers
    let expandedItems = [];
    for (let rawItem of rawList) {
      if (!rawItem || !rawItem.trim()) continue;
      let subItems = [];
      if (rawItem.includes(';')) {
        subItems = rawItem.split(/;\s*/);
      } else if (rawItem.includes('\n')) {
        subItems = rawItem.split(/[\r\n]+/);
      } else if (/(?:^|\s)(?:\d+[\.\)]|[a-zA-Z][\.\)])\s+/.test(rawItem)) {
        subItems = rawItem.split(/(?:^|\s)(?:\d+[\.\)]|[a-zA-Z][\.\)])\s+/).filter(Boolean);
      } else {
        subItems = rawItem.split(/(?:[\r\n]+\s*[•\ufffd\u25cf\u25aa\u25b8*–—]\s*|[•\ufffd\u25cf\u25aa\u25b8*–—]\s+)/);
      }
      for (let s of subItems) {
        if (s.trim()) expandedItems.push(s.trim());
      }
    }
    if (expandedItems.length === 0) expandedItems = rawList;

    // 1. Reassemble items where a parenthetical clause or mid-sentence break was split
    const rejoinedList = [];
    let inParen = false;
    let parenBuffer = '';

    for (let rawItem of expandedItems) {
      let item = rawItem.replace(/\s+/g, ' ').trim();
      if (!item) continue;

      const openCount = (item.match(/\(/g) || []).length;
      const closeCount = (item.match(/\)/g) || []).length;

      if (!inParen) {
        if (openCount > closeCount) {
          inParen = true;
          parenBuffer = item;
          continue;
        }
      } else {
        parenBuffer += ', ' + item;
        if (openCount < closeCount || parenBuffer.includes(')')) {
          inParen = false;
          item = parenBuffer;
          parenBuffer = '';
        } else {
          continue;
        }
      }

      // Check if previous item was incomplete and needs this item attached
      if (rejoinedList.length > 0) {
        const prev = rejoinedList[rejoinedList.length - 1];
        const prevNeedsContinuation =
          /[:\-,/]$/.test(prev) ||
          /\b(in case of|in ca of|of|for|with|and|or|to|by|from|latest|if|duly|copy of|audited)\s*$/i.test(prev) ||
          /^(?:article\s+of|proof\s+of\s+registration|address\s+proof)\s*:?$/i.test(prev);

        const currIsContinuation =
          /^[a-z,;)]/.test(item) ||
          /^(?:association|balance\s+sheet|tax\s+bill|registration|applicable|available|last\s+one\s+year|estimates|sanction)\b/i.test(item);

        if (prevNeedsContinuation || currIsContinuation) {
          rejoinedList[rejoinedList.length - 1] = prev.replace(/[:\s]+$/, '') + (prev.endsWith('/') || item.startsWith('/') ? '' : ' ') + item;
          continue;
        }
      }

      rejoinedList.push(item);
    }
    if (parenBuffer) {
      rejoinedList.push(parenBuffer);
    }

    // 2. Clean, validate, and format each document item into a complete, valid sentence
    const formattedDocs = [];
    for (let block of rejoinedList) {
      let s = block
        .replace(/[\ufffd\u2022\u25cf\u25aa\u25b8\u2013\u2014*•]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Strip leading list numbering, bullets, dashes, colons
      s = s.replace(/^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\(\d+\)|\([a-zA-Z]\)|[-•*–—])\s+/, '').trim();
      // Remove meta labels like "Documents to be submitted during application submission:"
      s = s.replace(/^documents?\s+(?:to\s+be\s+submitted|required)\s*(?:during\s+application\s+submission)?\s*:\s*/i, '').trim();

      // Discard empty or trivial fragments (< 5 chars or junk like "etc.")
      if (!s || s.length < 5 || /^(?:etc\.?|and|or|nil|na|n\/a|as applicable|if available\.?|if applicable\.?|applicable\.?)$/i.test(s)) {
        continue;
      }

      // If item starts with "if available" or "if applicable" as a short continuation, attach to previous doc
      if (/^(?:if\s+available|if\s+applicable|then\s+|applicable)/i.test(s) && formattedDocs.length > 0 && s.length < 35) {
        formattedDocs[formattedDocs.length - 1] = formattedDocs[formattedDocs.length - 1].replace(/\.?$/, '') + ` (${s.replace(/\.?$/, '')}).`;
        continue;
      }

      // Clean specific broken text patterns like "in ca of"
      s = s.replace(/\bin ca of\b/gi, 'in case of');
      s = s.replace(/Registers\s+Stock Register\s+Cash Book/gi, 'Registers: Stock Register, Cash Book');

      // Ensure first letter is capitalized
      s = s.charAt(0).toUpperCase() + s.slice(1);

      // Clean ending punctuation
      if (!/[.!?:]$/.test(s)) {
        s += '.';
      }

      formattedDocs.push(s);
    }

    return formattedDocs.length > 0
      ? formattedDocs
      : ['Valid Government Issued Photo Identity (Aadhaar / Voter ID / Ration Card).'];
  };

  // Extract and parse application process into a structured flowchart with continuous sequencing
  const parseApplicationProcess = (processText) => {
    if (!processText || typeof processText !== 'string') {
      return { mode: null, intro: null, steps: [] };
    }

    let text = processText.trim();

    // 1. Clean corrupted encoding / replacement chars (\ufffd) and standard bullet markers
    text = text.replace(/[\ufffd\u2022\u25cf\u25aa\u25b8\u2013\u2014•]+/g, '\n• ');
    // Convert leading asterisks or dashes as bullets (only when followed by space or number)
    text = text.replace(/(?:^|\n)\s*[\*\-]\s+(?=[A-Za-z0-9])/g, '\n• ');

    // 2. Extract Mode cleanly - strictly matched to valid mode strings
    let mode = null;
    const modeMatch = text.match(/^Mode:\s*(Online\s*(?:&|and)\s*Offline|Online\s*or\s*Offline|Online|Offline)\b/i);
    if (modeMatch) {
      mode = modeMatch[1].trim();
      text = text.slice(modeMatch[0].length).trim();
    }

    // 3. Un-glue URLs that are jammed against subsequent headings or step words
    // e.g. "gov.in/Application Process:" or "RegistrationLoginLogin:" or "LoginCreate profile:"
    text = text.replace(/(https?:\/\/[^\s]+?)(Application\s*Process|Registration|Login|Create\s+profile|Apply\s+Scheme|Step|Process|Phase)\b/gi, '$1 \n$2');

    // Un-glue "Application ProcessRegister" or "Application ProcessClick"
    text = text.replace(/Application\s*Process(?=[A-Z])/gi, 'Application Process: \n');

    // Separate mode or words squashed against Step e.g. "RegistrationStep-1:" or "OfflineStep 1:" or "page.Step 2:"
    text = text.replace(/([a-zA-Z0-9\)])(Step\s*-?\s*0?\d+\s*[:\-])/gi, '$1\n$2');
    text = text.replace(/([.!?])(Step\s*-?\s*0?\d+\s*[:\-])/gi, '$1\n$2');

    // 4. Extract Application Link / Portal Link if present at the start before steps
    let appLink = null;
    const linkMatch = text.match(/^(?:Application\s+link\s*:|Link\s*:|Portal\s*:)\s*(https?:\/\/[^\s\n]+)/i);
    if (linkMatch) {
      appLink = linkMatch[1].trim();
      text = text.slice(linkMatch[0].length).trim();
    }

    // Clean leading "Application Process:" marker
    text = text.replace(/^Application\s*Process\s*:\s*/i, '').trim();

    // 5. Identify known Phase headers
    const phaseNames = [
      'Check Application Status',
      'Application Tracking',
      'Selection Process',
      'Claiming Reimbursement of CGST',
      'Claiming Reimbursement',
      'Settlement of Claims',
      'Renewal Process',
      'Offline Application Process',
      'Online Application Process',
      'Scale-up Support',
      'New Login Registration',
      'RCMC Registration',
      'Registration Process on Digilocker portal',
      'Registration Process',
      'Apply Process',
      'Offline Application',
      'Online Application'
    ];

    phaseNames.forEach(pName => {
      const pRegex = new RegExp(`([.!?]|^|\\n)\\s*(${pName}\\s*[:\\-])`, 'gi');
      text = text.replace(pRegex, (m, p1, p2) => `${p1}\n___PHASE___${p2}\n`);
    });

    // 6. Standardize step markers into "\n___STEP___<num>: "
    // Case A: Explicit Step markers like "Step 1:", "Step-1:", "Step 01 -", "STEP 1:", "Step 1."
    text = text.replace(/(?:^|[\n.!?]|___PHASE___[^\n]+\n)\s*(?:Step|STEP)\s*-?\s*0?(\d+)\s*[:\-\.]?\s*/gi, '\n___STEP___$1: ');

    // Case B: Numbered bullet markers like "1. ", "2. ", "1.For", "2.For", "• 1. ", "1) "
    // Check if text already has ___STEP___ markers
    if (!text.includes('___STEP___')) {
      // Find numbered markers like 1., 2., 1), 2) (excluding decimals like 1.5)
      const numMarkerRegex = /(^|\n|[•\.\?!;\s])\s*(?:•\s*)?(\d{1,2}(?:\.(?![0-9])|\)))\s*(?=[A-Za-z0-9"'(\[])/g;
      const numMatches = [...text.matchAll(/(?:^|\n|[•\.\?!;\s])\s*(?:•\s*)?(\d{1,2}(?:\.(?![0-9])|\)))\s*(?=[A-Za-z0-9"'(\[])/g)];
      const numbersFound = numMatches.map(m => parseInt(m[1], 10));

      if (numbersFound.length >= 1 && (numbersFound.includes(1) || numbersFound[0] <= 2)) {
        text = text.replace(numMarkerRegex, (match, prefix, numMarker) => {
          const num = parseInt(numMarker, 10);
          const p = prefix === '\n' || prefix === '' ? '' : prefix;
          return `${p}\n___STEP___${num}: `;
        });
      }
    }

    // Case C: Named Workflow Stages like "Registration:", "Login:", "Create profile:", "Apply Scheme:" or "Process 1:", "Process 2:"
    if (!text.includes('___STEP___')) {
      const workflowStages = [
        'Process 1', 'Process 2', 'Process 3',
        'Registration', 'Login', 'Create profile', 'Apply Scheme', 'Apply',
        'Applying for Insurance', 'Submission', 'Verification'
      ];
      const foundStages = [];
      for (const stage of workflowStages) {
        const stageRegex = new RegExp(`(?:^|\\n|(?<=[.!?:]))\\s*(${stage})\\s*[:\\-]\\s*`, 'gi');
        let sm;
        while ((sm = stageRegex.exec(text)) !== null) {
          foundStages.push({ start: sm.index, end: sm.index + sm[0].length, stage });
        }
      }
      if (foundStages.length >= 2) {
        foundStages.sort((a, b) => b.start - a.start);
        foundStages.forEach((st, idx) => {
          const stepIdx = foundStages.length - idx;
          text = text.slice(0, st.start) + `\n___STEP___${stepIdx}: ${st.stage}: ` + text.slice(st.end);
        });
      }
    }

    // 7. Parse into raw step items
    const lines = text.split('\n');
    let currentPhase = null;
    const rawStepItems = [];
    let currentStepContent = '';
    let currentStepRawNum = 1;
    let intro = null;

    const flushStep = () => {
      let c = currentStepContent.trim();
      if (c) {
        // Strip leading bullet artifact if any
        c = c.replace(/^[•\-\*]\s*/, '').trim();
        rawStepItems.push({
          rawNum: currentStepRawNum,
          content: c,
          phase: currentPhase
        });
        currentStepContent = '';
      }
    };

    for (let line of lines) {
      let l = line.trim();
      if (!l) continue;

      if (l.startsWith('___PHASE___')) {
        flushStep();
        currentPhase = l.replace('___PHASE___', '').replace(/:\s*$/, '').trim();
        continue;
      }

      const stepMatch = l.match(/^___STEP___(\d+):\s*(.*)$/);
      if (stepMatch) {
        flushStep();
        currentStepRawNum = parseInt(stepMatch[1], 10);
        currentStepContent = stepMatch[2].trim();
      } else {
        if (currentStepContent) {
          currentStepContent += ' ' + l;
        } else {
          if (rawStepItems.length === 0 && !intro && !/^(?:\d+[\.\)]|Step\b|Phase\b)/i.test(l)) {
            intro = l;
          } else {
            currentStepContent = l;
          }
        }
      }
    }
    flushStep();

    // Case D: If still only 0 or 1 step, but text has multiple paragraphs or sentences, split into logical steps
    if (rawStepItems.length <= 1) {
      const contentToSplit = rawStepItems.length > 0 ? rawStepItems[0].content : (intro || text);
      if (contentToSplit) {
        // Check for multiple lines / bullet items
        const candidateParas = contentToSplit
          .split(/\n+|(?:\s*•\s*)/)
          .map(p => p.trim())
          .filter(Boolean);

        if (candidateParas.length >= 2) {
          rawStepItems.length = 0;
          candidateParas.forEach((cp, idx) => {
            rawStepItems.push({
              rawNum: idx + 1,
              content: cp,
              phase: currentPhase
            });
          });
        } else if (contentToSplit.length > 90) {
          // Split by sentence boundaries (period + space + Capital letter)
          const sentences = contentToSplit
            .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
            .map(s => s.trim())
            .filter(Boolean);

          if (sentences.length >= 2) {
            rawStepItems.length = 0;
            sentences.forEach((sent, idx) => {
              rawStepItems.push({
                rawNum: idx + 1,
                content: sent,
                phase: currentPhase
              });
            });
          }
        }
      }
    }

    // If still 0 steps but we have text, turn it into 1 actionable step
    if (rawStepItems.length === 0 && text) {
      const cleanText = text.replace(/^[•\-\*]\s*/, '').trim();
      if (cleanText) {
        rawStepItems.push({
          rawNum: 1,
          content: cleanText,
          phase: currentPhase
        });
      }
    }

    // If appLink was extracted and not already in step 1, provide portal context
    if (appLink && rawStepItems.length > 0) {
      if (!rawStepItems[0].content.includes(appLink)) {
        rawStepItems[0].content = `Visit the official application portal at ${appLink}. ${rawStepItems[0].content}`;
      }
    }

    // 8. Build strictly continuous, sequential steps (1, 2, 3, 4, 5...) without duplicates
    const finalSteps = [];
    const seenStepTexts = new Set();
    const existingTitles = new Set();
    let stepCounter = 1;

    // Helper to sanitize sentence punctuation and capitalization
    const cleanStepSentence = (str) => {
      if (!str) return null;
      let s = str
        .replace(/[\ufffd\u2022\u25cf\u25aa\u25b8\u2013\u2014*•]+/g, ' ')
        .replace(/\r\n|\r|\n/g, ' ')
        .replace(/([a-zA-Z0-9\)])\.([A-Z])/g, '$1. $2')
        .replace(/\s+/g, ' ')
        .trim();
      if (!s) return null;
      // Strip leading list numbering artifacts if present (e.g. "1. ", "• 1. ", "1) ", "(1) ")
      s = s.replace(/^(?:[•\-*]\s*)?(?:\d+[\.\)]|\([0-9a-zA-Z]\))\s*/, '').trim();
      if (!s) return null;
      s = s.charAt(0).toUpperCase() + s.slice(1);
      if (!/[.!?:]$/.test(s)) s += '.';
      return s;
    };

    // Helper to format titles cleanly into Title Case
    const toTitleCase = (str) => {
      if (!str) return '';
      return str
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((w, idx) => {
          const lw = w.toLowerCase();
          if (idx > 0 && ['and', '&', 'of', 'for', 'to', 'in', 'on', 'at', 'by', 'the', 'a', 'an'].includes(lw)) {
            return lw;
          }
          if (w.length >= 2 && w === w.toUpperCase() && !/[0-9]/.test(w)) {
            return w; // Keep uppercase acronyms (e.g. PMMSY, DPR, NGO, SC, ST)
          }
          return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        })
        .join(' ');
    };

    // Extract intuitive, highly specific step title directly related to each step's working
    const extractSmartStepTitle = (mainText, stepNum, existingSet, phase) => {
      const clean = (mainText || '').trim();
      const lower = clean.toLowerCase();
      const phaseLower = (phase || '').toLowerCase();

      const isAvailable = (t) => {
        return t && !existingSet.has(t.toLowerCase().trim());
      };

      // 1. Explicit Heading at start of step (e.g. "Applicant's Details: ...", "Loan Details: ...")
      // Forbids URLs (http:/https:), requires space after colon/dash, ignores "Step N" or "Note"
      const colonHeadingMatch = clean.match(/^([A-Z][A-Za-z0-9\s&/'’()-]{2,60})\s*[:–]\s+(\S.*)$/);
      if (colonHeadingMatch) {
        const heading = colonHeadingMatch[1].trim();
        const hLower = heading.toLowerCase();
        if (!hLower.startsWith('step') &&
          !hLower.startsWith('note') &&
          !hLower.endsWith('http') &&
          !hLower.endsWith('https') &&
          heading.split(/\s+/).length <= 9) {
          const formatted = toTitleCase(heading);
          if (isAvailable(formatted)) {
            return formatted;
          }
        }
      }

      // 2. Approval Tiers (e.g. "Approval at Taluka Nodal Officer level", "Final Approval at State Nodal Officer level")
      const approvalMatch = clean.match(/^(?:Final\s+)?Approval\s+(?:at|by)\s+([A-Za-z\s&/-]{3,30}?)(?:\s+level|\s+officer)?(?:\.|$)/i);
      if (approvalMatch) {
        const tier = toTitleCase(approvalMatch[1].trim());
        const cand = `${tier} Approval`;
        if (isAvailable(cand)) return cand;
      }

      // 3. Tab & Section Navigation: "Navigate to <Section> tab" or "Click on <Section> section"
      const navTabMatch = clean.match(/(?:navigate\s+to|click\s+on|click|select|go\s+to)\s+(?:the\s+)?['"]?([A-Za-z0-9\s&/,-]{3,35}?)['"]?\s+(?:tab|section|menu|link|button|services|scheme)\b/i);
      if (navTabMatch) {
        let tabName = navTabMatch[1].trim()
          .replace(/^(?:the|crs|tab|click\s+here\s+for|link\s+for|in\s+that\s+go\s+to)\s+/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (tabName.length >= 3 && tabName.length <= 32 && tabName.split(/\s+/).length <= 4) {
          const formatted = toTitleCase(tabName);
          const cand1 = `${formatted} Section`;
          if (isAvailable(cand1)) return cand1;
          const cand2 = `Select ${formatted}`;
          if (isAvailable(cand2)) return cand2;
        }
      }

      // 4. Action & Working Intent Matching
      let candidate = null;

      // Specific intent: Credentials & Login
      if (lower.includes('username') && lower.includes('password')) {
        candidate = 'Create Login Credentials';
      } else if (lower.includes('new applicant registration') || lower.includes('new registration')) {
        candidate = 'New Applicant Registration';
      } else if (lower.includes('complete profile') || lower.includes('profile 100%')) {
        candidate = 'Complete Profile Details';
      } else if ((lower.includes('pay') || lower.includes('payment')) && (lower.includes('fee') || lower.includes('fees') || lower.includes('challan') || lower.includes('receipt'))) {
        candidate = 'Apply Scheme & Pay Fees';
      } else if (lower.includes('farmer scheme')) {
        candidate = 'Select Farmer Scheme';
      }
      // A. Tracking & Application Status
      else if (phaseLower.includes('track') || phaseLower.includes('status') || lower.includes('track application') || lower.includes('application tracking')) {
        if (lower.includes('submit') || lower.includes('mobile') || lower.includes('account number') || lower.includes('application number') || lower.includes('enter')) {
          candidate = 'Submit Tracking Query';
        } else {
          candidate = 'Access Application Tracking';
        }
      }
      // B. Permits, Field Inspections & Initial Formalities
      else if (lower.includes('permit') && (lower.includes('construction') || lower.includes('tubewell') || lower.includes('obtain'))) {
        candidate = 'Obtain Mandatory Construction Permit';
      } else if (lower.includes('verification certificate') || lower.includes('hydrogeologist')) {
        candidate = 'Obtain Verification Certificate from Hydrogeologist';
      } else if (lower.includes('tubewell') && (lower.includes('construct') || lower.includes('filter point') || lower.includes('machinery'))) {
        candidate = 'Tubewell Construction & Inspection';
      } else if (lower.includes('noc') && (lower.includes('obtain') || lower.includes('approach'))) {
        candidate = 'Apply for Departmental NOC';
      }
      // C. Download Forms / Guidelines / Announcements
      else if (lower.includes('download') && (lower.includes('form') || lower.includes('format') || lower.includes('template') || lower.includes('proforma'))) {
        candidate = 'Download Application Form';
      } else if (lower.includes('print') && (lower.includes('form') || lower.includes('acknowledgement') || lower.includes('receipt'))) {
        candidate = 'Print Application Form / Acknowledgement';
      } else if (lower.includes('notification') && (lower.includes('published') || lower.includes('dailies') || lower.includes('publicity'))) {
        candidate = 'Scheme Notification & Announcement';
      } else if (lower.includes('desirous of applying') || (lower.includes('apply online from') && lower.includes('to'))) {
        candidate = 'Online Application Window';
      }
      // D. Photography / Affixing
      else if (lower.includes('stick your passport') || (lower.includes('affix') && (lower.includes('photo') || lower.includes('photograph')))) {
        candidate = 'Affix Passport-Sized Photograph';
      } else if (lower.includes('passport-sized photograph') && !lower.includes('upload')) {
        candidate = 'Affix Passport-Sized Photograph';
      }
      // E. Portal Registration & Authentication
      else if (lower.includes('login') || (lower.includes('sign in') && !lower.includes('sign in designated space')) || lower.includes('credentials') || lower.includes('password reset')) {
        candidate = 'Portal Login & Authentication';
      } else if (lower.includes('guideline') && (lower.includes('registration') || lower.includes('undertaking'))) {
        candidate = 'Review Registration Guidelines';
      } else if (lower.includes('self registration')) {
        candidate = 'Citizen Self-Registration';
      } else if (lower.includes('register') && (lower.includes('portal') || lower.includes('pmkisan') || lower.includes('sign up'))) {
        candidate = 'Portal Registration';
      }
      // F. Disbursal & Financial Sanction
      else if (lower.includes('disbursal') || lower.includes('credited directly') || lower.includes('sanctioned') || lower.includes('financial assistance is provided') || lower.includes('subsidy amount') || lower.includes('direct bank transfer')) {
        candidate = 'Financial Assistance & Disbursal';
      }
      // G. Official Scrutiny & Committee
      else if (lower.includes('verification of eligibility') || lower.includes('verify eligibility')) {
        candidate = 'Beneficiary Eligibility Verification';
      } else if (lower.includes('specialist doctor') || lower.includes('medical board') || (lower.includes('expert committee') && lower.includes('doctor'))) {
        candidate = 'Expert Medical Committee Scrutiny';
      } else if (lower.includes('scrutiny') || lower.includes('scrutinize') || lower.includes('verifies the application') || (lower.includes('committee') && lower.includes('verif'))) {
        candidate = 'Application Scrutiny & Verification';
      } else if (lower.includes('recommend') && !lower.includes('subsidy')) {
        candidate = 'Scrutiny & Recommendation';
      }
      // H. Specific Form Fields & Sections
      else if (lower.includes('district') && (lower.includes('block') || lower.includes('panchayat') || lower.includes('municipality') || lower.includes('corporation'))) {
        candidate = 'Enter District & Local Body Details';
      } else if (lower.includes('scooter') || lower.includes('driving license') || lower.includes('learner\'s license') || lower.includes('vehicle')) {
        candidate = 'Vehicle & License Details';
      } else if (lower.includes('land') && (lower.includes('details') || lower.includes('information') || lower.includes('holding') || lower.includes('7/12') || lower.includes('8 -a'))) {
        candidate = 'Land & Cultivation Details';
      } else if (lower.includes('budget') && (lower.includes('non-recurring') || lower.includes('recurring'))) {
        if (lower.includes('non-recurring') || lower.includes('non recurring')) {
          candidate = 'Non-Recurring Budget Details';
        } else {
          candidate = 'Recurring Budget Details';
        }
      } else if (lower.includes('equipment') || lower.includes('equipments in lab')) {
        candidate = 'Laboratory Equipment Details';
      } else if (lower.includes('project justification') || lower.includes('crs project')) {
        candidate = 'Project Justification Details';
      } else if (lower.includes('academic credential') || lower.includes('credential of institute') || (lower.includes('course') && lower.includes('college'))) {
        candidate = 'Academic & Institute Details';
      } else if (lower.includes('loan details') || (lower.includes('bank') && lower.includes('account number')) || lower.includes('ifsc') || lower.includes('loan sanction')) {
        candidate = 'Bank & Loan Account Details';
      } else if (lower.includes('applicant details') || lower.includes('personal details') || (lower.includes('personal information') && lower.includes('aadhaar')) || (lower.includes('name') && lower.includes('gender')) || (lower.includes('name') && lower.includes('date of birth'))) {
        candidate = 'Fill Personal & Applicant Details';
      } else if (lower.includes('documents enclosed') || lower.includes('mention the documents') || lower.includes('additional documents like')) {
        candidate = 'List Enclosed Documents';
      } else if (lower.includes('declaration') || lower.includes('signature') || lower.includes('sign on the') || lower.includes('do your signature')) {
        candidate = 'Applicant Signature & Declaration';
      }
      // I. Document Upload
      else if (lower.includes('upload') || lower.includes('scanned copy') || lower.includes('attach') || lower.includes('supporting document')) {
        if (lower.includes('photo') || lower.includes('photograph')) {
          candidate = 'Upload Photograph & Documents';
        } else {
          candidate = 'Upload Supporting Documents';
        }
      }
      // J. Departmental Register Entry
      else if (lower.includes('entries will be made') || lower.includes('register of application')) {
        candidate = 'Departmental Register Entry';
      }
      // K. Submission Authorities
      else if (lower.includes('assistant director') || lower.includes('ad(h&t)')) {
        candidate = 'Submit Claims to Assistant Director';
      } else if (lower.includes('superintendent')) {
        candidate = 'Submit to Hospital Superintendent';
      } else if (lower.includes('block office') || lower.includes('joint director') || lower.includes('nodal officer') || lower.includes('concerned office') || lower.includes('connect with group development officer')) {
        candidate = 'Submit to Designated Local Office';
      } else if (lower.includes('submit online') || lower.includes('click "submit"') || lower.includes('click on \'submit\'') || lower.includes('click on submit')) {
        candidate = 'Submit Online Application';
      } else if (lower.includes('submit') && lower.includes('application')) {
        candidate = 'Submit Application';
      }
      // L. General Navigation or Form Filling
      else if (lower.includes('official website') || lower.includes('portal') || lower.includes('navigate') || lower.includes('visit') || lower.includes('go to')) {
        candidate = 'Visit Official Portal & Section';
      } else if (lower.includes('fill') && (lower.includes('form') || lower.includes('details') || lower.includes('mandatory'))) {
        candidate = 'Fill Application Form Details';
      }

      // Return candidate if available and not yet used in this scheme
      if (candidate && isAvailable(candidate)) {
        return candidate;
      }

      // If candidate is already taken in this scheme, try specific contextual variations
      if (candidate && !isAvailable(candidate)) {
        const contextualTests = [
          { kw: 'address', title: 'Enter Address & Domicile Details' },
          { kw: 'income', title: 'Enter Family Income Details' },
          { kw: 'caste', title: 'Enter Category & Social Details' },
          { kw: 'bank', title: 'Enter Bank Account Details' },
          { kw: 'upload', title: 'Upload Required Certificates' },
          { kw: 'verify', title: 'Verify & Confirm Details' },
          { kw: 'submit', title: 'Final Review & Submission' }
        ];

        for (const test of contextualTests) {
          if (lower.includes(test.kw) && isAvailable(test.title)) {
            return test.title;
          }
        }

        const genericVariations = [
          `${candidate} - Part 2`,
          `${candidate} Verification`,
          `Complete ${candidate}`,
          `Review & ${candidate}`
        ];
        for (const v of genericVariations) {
          if (isAvailable(v)) return v;
        }
      }

      // 5. Fallback: Extract meaningful action phrase from first sentence
      const firstSentence = clean.split(/[.!?\n]/)[0].trim()
        .replace(/^(?:step\s*\d+[:\s.-]*|[\d.():•\-–*]+)\s*/i, '')
        .trim();
      const words = firstSentence.split(/\s+/).filter(Boolean);

      if (words.length >= 2 && words.length <= 6) {
        const phrase = toTitleCase(words.join(' '))
          .replace(/[:;,.]+$/, '').trim();
        if (isAvailable(phrase)) return phrase;
      }

      if (words.length > 6) {
        const phrase = toTitleCase(words.slice(0, 5).join(' '))
          .replace(/[:;,.]+$/, '').trim();
        if (isAvailable(phrase)) return phrase;
      }

      // 6. Guaranteed unique fallback
      let fallback = `Step ${stepNum} Details`;
      let count = 2;
      while (!isAvailable(fallback)) {
        fallback = `Step ${stepNum} Details (${count++})`;
      }
      return fallback;
    };

    for (let item of rawStepItems) {
      let clean = item.content.trim();

      // Deduplicate exact duplicate steps if any
      const normalized = clean.toLowerCase().replace(/[\s\W]+/g, '').slice(0, 100);
      if (seenStepTexts.has(normalized) && normalized.length > 20) {
        continue;
      }
      seenStepTexts.add(normalized);

      // Extract timeline
      let timeline = null;
      const timelineMatch = clean.match(/(?:within\s+next|within|in\s+next|in)\s+(\d+\s+(?:days|months|weeks|hours)|quarterly\s+basis)(?:\s+from\s+[^.,;\n]+)?/i);
      if (timelineMatch) {
        let t = timelineMatch[0].trim();
        timeline = t.charAt(0).toUpperCase() + t.slice(1);
      }

      // Extract Note if present
      let note = null;
      const noteMatch = clean.match(/NOTE\s*:\s*([^]+?)(?=(?:Disbursal|$))/i);
      if (noteMatch) {
        note = noteMatch[1].trim();
      }

      // Extract Disbursal if present
      let disbursal = null;
      const disbursalMatch = clean.match(/Disbursal(?:\s+of\s+the\s+Subsidy)?\s*:\s*([^]+)$/i);
      if (disbursalMatch) {
        disbursal = disbursalMatch[1].trim();
      }

      // Determine Main Text (strip NOTE and Disbursal)
      let mainText = clean;
      if (noteMatch) {
        mainText = mainText.split(/NOTE\s*:/i)[0].trim();
      } else if (disbursalMatch) {
        mainText = mainText.split(/Disbursal(?:\s+of\s+the\s+Subsidy)?\s*:/i)[0].trim();
      }

      mainText = cleanStepSentence(mainText) || mainText;
      note = cleanStepSentence(note);
      disbursal = cleanStepSentence(disbursal);

      // Extract unique, highly specific step title directly related to this step's working
      const title = extractSmartStepTitle(mainText, stepCounter, existingTitles, item.phase);
      existingTitles.add(title.toLowerCase().trim());

      finalSteps.push({
        number: stepCounter++, // Strictly continuous increasing sequence (1, 2, 3, 4, 5...)
        title,
        phase: item.phase || null,
        timeline,
        mainText,
        note,
        disbursal
      });
    }

    return { mode, intro, steps: finalSteps };
  };


  if (loading) {
    return (
      <DashboardLayout activePage="explore">
        <div className="scheme-loading-state">
          <div className="spinner-ring"></div>
          <h3>Fetching Scheme Information...</h3>
          <p>Retrieving complete eligibility criteria, documents, and portal details.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !scheme) {
    return (
      <DashboardLayout activePage="explore">
        <div className="scheme-error-card">
          <div className="error-icon-box">
            <i className="fa fa-triangle-exclamation"></i>
          </div>
          <h2>Scheme Not Found</h2>
          <p>{error || 'The requested scheme could not be retrieved from the database.'}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/explore')} className="btn-primary-teal">
              <i className="fa fa-arrow-left"></i> Return to Explore Schemes
            </button>
            <button onClick={fetchSchemeDetails} className="btn-secondary-outline">
              <i className="fa fa-rotate-right"></i> Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const category = getCategoryInfo(scheme.category);
  const isCentral = (scheme.govt_level || '').toUpperCase() === 'CENTRAL';
  const benefitsData = getBenefitsData(scheme.benefits);
  const langTrans = {
    ...(getCachedTranslations(currentLanguage) || {}),
    ...(dynamicTranslations[currentLanguage] || {})
  };

  const trSchemeTitle = (title) => {
    if (!title || currentLanguage === 'en') return title || '';
    if (langTrans[title]) return langTrans[title];
    return translateSchemeTitle(title, currentLanguage, langTrans);
  };

  const trSchemeText = (text) => {
    if (!text || currentLanguage === 'en') return text;
    if (langTrans[text]) return langTrans[text];
    return translateSchemeText(text, currentLanguage);
  };

  const trAuthority = (auth) => {
    if (!auth || currentLanguage === 'en') return auth || '';
    if (langTrans[auth]) return langTrans[auth];
    return translateAuthorityName(auth, currentLanguage);
  };

  const trDocument = (doc) => {
    if (!doc || currentLanguage === 'en') return doc || '';
    if (langTrans[doc]) return langTrans[doc];
    return translateDocumentName(doc, currentLanguage);
  };

  const trStepTitle = (title) => {
    if (!title || currentLanguage === 'en') return title || '';
    if (langTrans[title]) return langTrans[title];
    return translateStepTitle(title, currentLanguage);
  };

  const aboutBullets = currentLanguage === 'en'
    ? getAboutSchemeBullets(scheme, benefitsData)
    : (scheme?.description && (!benefitsData?.raw || scheme.description !== benefitsData.raw))
      ? textToBulletList(trSchemeText(scheme.description))
      : generateLocalizedAboutBullets(scheme, benefitsData, currentLanguage);
  const eligibilityData = getEligibilityData(scheme);
  const documentsList = getDocumentsList(scheme);
  const applicationFlow = parseApplicationProcess(scheme.application_process);
  const applicationSteps = applicationFlow.steps;
  const officialPortalUrl = scheme.official_url || scheme.application_url || scheme.myscheme_url || '';

  const renderBulletContent = (text) => {
    if (!text) return null;

    let title = null;
    let mainBody = text;

    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && colonIdx < 40) {
      title = text.slice(0, colonIdx);
      mainBody = text.slice(colonIdx + 1);
    }

    // Split mainBody by percentages or monetary amounts (e.g. 40% subsidy, 75% amount, ₹5,00,000)
    const metricRegex = /(\b\d+(?:\.\d+)?%\s*(?:subsidy|amount|bonus)?|₹\s*[\d,]+|\bRs\.?\s*[\d,]+)/gi;
    const parts = mainBody.split(metricRegex);

    return (
      <span>
        {title && <strong className="bullet-highlight-title">{title}:</strong>}
        {parts.map((part, i) => {
          if (metricRegex.test(part)) {
            return (
              <strong key={i} className="bullet-metric-badge">
                {part}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  };

  return (
    <DashboardLayout activePage="explore">
      <div className="scheme-detail-wrapper">
        {/* Feedback Toast Notification */}
        {toastMsg && (
          <div className="scheme-toast-banner">
            <div className="toast-content">
              <i className="fa fa-circle-check"></i>
              <span>{toastMsg}</span>
            </div>
            <button className="toast-dismiss" onClick={() => setToastMsg(null)}>
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}

        {/* Navigation & Breadcrumb Bar */}
        <div className="scheme-top-nav">
          <button onClick={handleBackNavigation} className="btn-back-pill" title="Back to Scheme Catalog">
            <i className="fa fa-arrow-left"></i> {t('backToFindSchemes', 'Back to Find Schemes')}
          </button>

          {isTranslating && (
            <div className="translation-live-indicator" role="status" aria-live="polite">
              <i className="fa-solid fa-arrows-rotate fa-spin"></i>
              <span>
                {currentLanguage === 'mr' ? 'मराठी अनुवाद लोड होत आहे...'
                  : currentLanguage === 'hi' ? 'हिंदी अनुवाद लोड हो रहा है...'
                  : currentLanguage === 'ta' ? 'மொழிபெயர்ப்பு ஏற்றப்படுகிறது...'
                  : currentLanguage === 'te' ? 'అనువాదం లోడ్ అవుతోంది...'
                  : currentLanguage === 'bn' ? 'অনুবাদ লোড হচ্ছে...'
                  : 'Updating language...'}
              </span>
            </div>
          )}

          <div className="nav-actions-right">
            {/* Application Tracker Badge / Quick Action */}
            {userApp?.status === 'APPLIED' ? (
              <div className="app-status-badge-top applied" title="You marked this scheme as applied on the official portal">
                <i className="fa fa-circle-check"></i>
                <span>{t('appliedOnPortal', 'Applied on Portal')}</span>
              </div>
            ) : userApp?.status === 'PLANNING' ? (
              <div className="app-status-actions-top">
                <span className="app-status-badge-top planning">
                  <i className="fa fa-hourglass-start"></i> {t('planningToApply', 'Planning to Apply')}
                </span>
                <button
                  className="btn-mark-applied-pill"
                  onClick={handleQuickMarkApplied}
                  title="Click once submitted on official portal"
                >
                  <i className="fa fa-check"></i> {t('markAsApplied', 'Mark as Applied')}
                </button>
              </div>
            ) : userApp?.status === 'CONSIDERING' ? (
              <div className="app-status-actions-top">
                <span className="app-status-badge-top considering">
                  <i className="fa fa-clock"></i> {t('considering', 'Considering')}
                </span>
                <button
                  className="btn-mark-applied-pill"
                  onClick={handleQuickMarkApplied}
                  disabled={isMaintenanceMode}
                  style={{
                    opacity: isMaintenanceMode ? 0.45 : 1,
                    cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                  }}
                  title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "Click once submitted on official portal"}
                >
                  <i className="fa fa-check"></i> {t('markAsApplied', 'Mark as Applied')}
                </button>
              </div>
            ) : (
              <button
                className={`btn-track-pill ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                onClick={() => {
                  if (isMaintenanceMode) {
                    showMaintenanceAlert('Application tracking');
                    return;
                  }
                  setShowIntentModal(true);
                }}
                disabled={isMaintenanceMode}
                style={{
                  opacity: isMaintenanceMode ? 0.45 : 1,
                  cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                }}
                title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "Track this scheme in My Applications"}
              >
                <i className="fa fa-file-signature"></i>
                <span>{t('trackApplication', 'Track Application')}</span>
              </button>
            )}

            <button
              className="btn-share-pill"
              onClick={handleShare}
              title="Copy scheme link"
            >
              <i className={copied ? "fa fa-check" : "fa fa-share-nodes"}></i>
              <span>{copied ? t('copied', 'Link Copied!') : t('share', 'Share')}</span>
            </button>

            <button
              className={`btn-save-pill ${isSaved ? 'is-saved' : ''}`}
              onClick={handleSaveToggle}
              disabled={saveLoading}
              title={isSaved ? "Remove from Saved Schemes" : "Save Scheme to Bookmarks"}
            >
              <i className={isSaved ? "fa fa-bookmark" : "fa-regular fa-bookmark"}></i>
              <span>{isSaved ? t('saved', 'Saved in My Schemes') : t('saveScheme', 'Save Scheme')}</span>
            </button>
          </div>
        </div>

        {/* Hero Card / Scheme Title Header */}
        <div className="scheme-hero-card">
          <div className="hero-top-badges">
            <span className={`pill-badge ${isCentral ? 'badge-central' : 'badge-state'}`}>
              <i className={isCentral ? "fa fa-flag" : "fa fa-map-location-dot"}></i>
              {isCentral ? t('centralGovt', 'Central Govt Scheme') : `${translateStateName(scheme.state, currentLanguage) || 'State'} ${t('govt', 'Government')}`}
            </span>
            <span className="pill-badge badge-category">
              <i className={`fa ${category.icon}`}></i>
              {translateCategory(category.name)}
            </span>
            <span className="pill-badge badge-mode">
              <i className="fa fa-laptop"></i>
              {translateMode(scheme.application_mode) || t('onlineApplication', 'Online Application')}
            </span>
            <span className="pill-badge badge-verified">
              <i className="fa fa-circle-check"></i>
              {t('verifiedBenefit', 'Verified Benefit')}
            </span>
            {userApp?.status === 'APPLIED' && (
              <span className="pill-badge badge-applied-live">
                <i className="fa fa-circle-check"></i>
                {t('appliedOnPortal', 'Applied on Official Portal')}
              </span>
            )}
            {userApp?.status === 'PLANNING' && (
              <span className="pill-badge badge-planning-live">
                <i className="fa fa-hourglass-start"></i>
                {t('inAppsPlanning', 'In Applications: Planning')}
              </span>
            )}
            {userApp?.status === 'CONSIDERING' && (
              <span className="pill-badge badge-considering-live">
                <i className="fa fa-clock"></i>
                {t('inAppsConsidering', 'In Applications: Considering')}
              </span>
            )}
          </div>

          <h1 className="scheme-hero-title">{trSchemeTitle(scheme.name)}</h1>

          <div className="scheme-hero-meta">
            <div className="meta-item">
              <i className="fa fa-building-columns"></i>
              <span>{trAuthority(scheme.ministry || scheme.ministry_department)}</span>
            </div>
            {scheme.state && !isCentral && (
              <div className="meta-item">
                <i className="fa fa-location-dot"></i>
                <span>{t('applicableIn', 'Applicable in')}: {translateStateName(scheme.state, currentLanguage)}</span>
              </div>
            )}
            <div className="meta-item">
              <i className="fa fa-id-card"></i>
              <span>{t('schemeId', 'Scheme ID')}: #{scheme.id}</span>
            </div>
          </div>

          {/* Quick Action Strip */}
          <div className="hero-action-strip">
            {officialPortalUrl && (
              <a
                href={officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-primary"
              >
                <i className="fa fa-arrow-up-right-from-square"></i>
                <span>{t('applyOnPortal', 'Apply on Official Portal')}</span>
              </a>
            )}

            {scheme.myscheme_url && (
              <a
                href={scheme.myscheme_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-secondary"
              >
                <i className="fa fa-globe"></i>
                <span>{t('nationalMySchemePortal', 'National myScheme Portal')}</span>
              </a>
            )}

            {userApp ? (
              <button
                onClick={() => navigate('/applications')}
                className="btn-hero-ghost"
                title="View in My Applications"
              >
                <i className="fa fa-clock-rotate-left"></i>
                <span>{t('navApplications', 'View in My Applications')}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isMaintenanceMode) {
                    showMaintenanceAlert('Application tracking');
                    return;
                  }
                  setShowIntentModal(true);
                }}
                disabled={isMaintenanceMode}
                className={`btn-hero-ghost ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                style={{
                  opacity: isMaintenanceMode ? 0.45 : 1,
                  cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                }}
                title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "Save and track application progress"}
              >
                <i className="fa fa-file-signature"></i>
                <span>{t('trackApplication', 'Track Application')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="scheme-highlights-grid">
          <div className="highlight-card">
            <div className="highlight-icon teal">
              <i className="fa fa-landmark"></i>
            </div>
            <div className="highlight-info">
              <label>{t('govtJurisdiction', 'Government Jurisdiction')}</label>
              <strong>{isCentral ? t('nationalAllIndia', 'National (All India)') : (translateStateName(scheme.state, currentLanguage) || t('stateLevel', 'State Level'))}</strong>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon blue">
              <i className="fa fa-tags"></i>
            </div>
            <div className="highlight-info">
              <label>{t('sectorCategory', 'Sector / Category')}</label>
              <strong>{translateCategory(category.name)}</strong>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon green">
              <i className="fa fa-file-signature"></i>
            </div>
            <div className="highlight-info">
              <label>{t('applicationMethod', 'Application Method')}</label>
              <strong>{translateMode(scheme.application_mode) || t('onlinePortal', 'Online Portal')}</strong>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon amber">
              <i className="fa fa-shield-halved"></i>
            </div>
            <div className="highlight-info">
              <label>{t('authority', 'Authority')}</label>
              <strong title={trAuthority(scheme.ministry || scheme.ministry_department)}>
                {trAuthority(scheme.ministry || scheme.ministry_department)}
              </strong>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="scheme-sections-layout">
          {/* Section 1: Overview / About the Scheme */}
          <div className="detail-section-card">
            <div className="section-card-header center-header">
              <div className="section-title-wrap">
                <div className="section-icon-badge teal">
                  <i className="fa fa-circle-info"></i>
                </div>
                <h2>{t('aboutScheme', 'About the Scheme')}</h2>
                <span className="header-badge-count">{t('schemeOverview', 'Scheme Overview')}</span>
              </div>
              <p className="section-subtitle">{t('aboutSchemeSub', 'Key background, institutional objectives, and target beneficiaries')}</p>
            </div>
            <div className="section-card-body">
              {aboutBullets.length > 0 ? (
                <div className="bullet-points-list">
                  {aboutBullets.map((bullet, idx) => (
                    <div key={idx} className="bullet-point-item">
                      <div className="bullet-icon-box teal">
                        <i className="fa fa-circle-check"></i>
                      </div>
                      <div className="bullet-text">
                        {renderBulletContent(trSchemeText(bullet))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bullet-points-list">
                  <div className="bullet-point-item">
                    <div className="bullet-icon-box teal">
                      <i className="fa fa-circle-info"></i>
                    </div>
                    <div className="bullet-text">
                      This government scheme provides social welfare, financial assistance, and development opportunities to eligible citizens.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Benefits & Financial Assistance */}
          {benefitsData && benefitsData.bullets.length > 0 && (
            <div className="detail-section-card benefits-card">
              <div className="section-card-header center-header">
                <div className="section-title-wrap">
                  <div className="section-icon-badge green">
                    <i className="fa fa-hand-holding-dollar"></i>
                  </div>
                  <h2>{t('benefitsAssistance', 'Benefits & Financial Assistance')}</h2>
                  <span className="header-badge-count">{t('whatYouReceive', 'What You Receive')}</span>
                </div>
                <p className="section-subtitle">{t('benefitsSub', 'Direct financial grants, fee concessions, allowances, and subsidies provided to eligible beneficiaries')}</p>
              </div>
              <div className="section-card-body">
                <div className="bullet-points-list">
                  {benefitsData.bullets.map((benefit, idx) => (
                    <div key={idx} className="bullet-point-item benefit-item">
                      <div className="bullet-icon-box green">
                        <i className="fa fa-gift"></i>
                      </div>
                      <div className="bullet-text">
                        {renderBulletContent(trSchemeText(benefit))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Eligibility Criteria */}
          {eligibilityData && (
            <div className="detail-section-card">
              <div className="section-card-header center-header">
                <div className="section-title-wrap">
                  <div className="section-icon-badge blue">
                    <i className="fa fa-user-check"></i>
                  </div>
                  <h2>{t('eligibilityCriteria', 'Eligibility Criteria')}</h2>
                  <span className="header-badge-count">{t('whoIsEligible', 'Who is Eligible')}</span>
                </div>
                <p className="section-subtitle">{t('eligibilitySub', 'Qualifying citizen criteria, conditions, and exclusion rules')}</p>
              </div>
              <div className="section-card-body">
                {/* Main Criteria Bullets */}
                {eligibilityData.criteriaBullets && eligibilityData.criteriaBullets.length > 0 && (
                  <div className="bullet-points-list">
                    {eligibilityData.criteriaBullets.map((crit, idx) => (
                      <div key={idx} className="bullet-point-item">
                        <div className="bullet-icon-box teal">
                          <i className="fa fa-check-double"></i>
                        </div>
                        <div className="bullet-text">
                          {renderBulletContent(trSchemeText(crit))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Important Notes (NOTE 1, NOTE 2) */}
                {eligibilityData.notes && eligibilityData.notes.length > 0 && (
                  <div className="notes-card-box">
                    <div className="notes-header">
                      <i className="fa fa-circle-info"></i>
                      <strong>{t('importantSchemeGuidelines', 'Important Scheme Guidelines & Filing Notes')}</strong>
                    </div>
                    <div className="bullet-points-list notes-list">
                      {eligibilityData.notes.map((note, idx) => (
                        <div key={idx} className="bullet-point-item note-item">
                          <div className="bullet-icon-box blue">
                            <i className="fa fa-info"></i>
                          </div>
                          <div className="bullet-text">
                            {renderBulletContent(trSchemeText(note))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exclusions / Ineligible Conditions */}
                {eligibilityData.exclusions && eligibilityData.exclusions.length > 0 && (
                  <div className="exclusions-warning-box">
                    <div className="exclusion-header">
                      <i className="fa fa-circle-exclamation"></i>
                      <strong>{t('exclusionsWhoNotEligible', 'Exclusions / Who is Not Eligible')}</strong>
                    </div>
                    <div className="bullet-points-list exclusions-list">
                      {eligibilityData.exclusions.map((excl, idx) => (
                        <div key={idx} className="bullet-point-item exclusion-item">
                          <div className="bullet-icon-box red">
                            <i className="fa fa-xmark"></i>
                          </div>
                          <div className="bullet-text">
                            {renderBulletContent(trSchemeText(excl))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Required Documents */}
          <div className="detail-section-card">
            <div className="section-card-header center-header">
              <div className="section-title-wrap">
                <div className="section-icon-badge amber">
                  <i className="fa fa-folder-open"></i>
                </div>
                <h2>{t('documentsRequired', 'Documents Required')}</h2>
                <span className="header-badge-count">{documentsList.length} {t('items', 'items')}</span>
              </div>
              <p className="section-subtitle">{t('documentsSub', 'Please ensure you have valid original and digital copies of the following documents before starting your application')}</p>
            </div>
            <div className="section-card-body">
              <div className="documents-grid">
                {documentsList.map((doc, idx) => (
                  <div key={idx} className="doc-item-card">
                    <div className="doc-card-inner">
                      <div className="doc-icon-badge">
                        <i className="fa fa-file-lines"></i>
                      </div>
                      <div className="doc-content">
                        <div className="doc-header-row">
                          <span className="doc-step-badge">{t('doc', 'DOC')} {String(idx + 1).padStart(2, '0')}</span>
                          <span className="doc-status-chip">
                            <i className="fa fa-circle-check"></i> {t('required', 'Required')}
                          </span>
                        </div>
                        <p className="doc-title">{trDocument(doc)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: How to Apply / Step-by-Step Flowchart */}
          {applicationSteps.length > 0 && (
            <div className="detail-section-card">
              <div className="section-card-header center-header">
                <div className="section-title-wrap">
                  <div className="section-icon-badge teal">
                    <i className="fa fa-diagram-project"></i>
                  </div>
                  <h2>{t('applicationGuide', 'Application Guide')}</h2>
                  <span className="header-badge-count">{applicationSteps.length} {t('steps', 'Steps')}</span>
                </div>
                <p className="section-subtitle">{t('applicationGuideSub', 'Sequential steps and procedural roadmap to apply for this scheme')}</p>
              </div>
              <div className="section-card-body">
                {applicationFlow.intro && (
                  <p className="flowchart-intro-text">
                    {trSchemeText(applicationFlow.intro)}
                  </p>
                )}

                <div className="flowchart-wrapper">
                  {/* Flowchart Start Cap */}
                  <div className="flowchart-start-cap">
                    <div className="flow-start-indicator">
                      <i className="fa-solid fa-play"></i>
                    </div>
                    <span className="flow-start-title">{t('startApplicationProcess', 'Start Application Process')}</span>
                    {applicationFlow.mode && (
                      <span className="flow-mode-pill">
                        <i className={applicationFlow.mode.toLowerCase().includes('online') ? 'fa fa-globe' : 'fa fa-building-columns'}></i>
                        {translateMode(applicationFlow.mode)} {t('modeOnline', 'Mode')}
                      </span>
                    )}
                  </div>

                  {/* Flowchart Step Nodes with Directional Connectors */}
                  {applicationSteps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      {/* Flow Connector Arrow pointing down */}
                      <div className="flowchart-connector" aria-hidden="true">
                        <div className="flow-connector-stem"></div>
                        <div className="flow-arrow-node">
                          <i className="fa-solid fa-arrow-down"></i>
                        </div>
                        <div className="flow-connector-stem"></div>
                      </div>

                      {/* Flowchart Process Card */}
                      <div className="flowchart-card">
                        <div className="flow-card-header">
                          <div className="flow-badge-title-group">
                            <span className="flow-step-badge">{t('step', 'STEP')} {step.number}</span>
                            <h4 className="flow-step-title">{trStepTitle(step.title)}</h4>
                            {step.phase && (
                              <span className="flow-phase-tag">
                                <i className="fa-solid fa-layer-group"></i>
                                <span>{trSchemeText(step.phase)}</span>
                              </span>
                            )}
                          </div>
                          {step.timeline && (
                            <span className="flow-timeline-chip">
                              <i className="fa-regular fa-clock"></i>
                              <span>{translateTimelineChip(step.timeline, currentLanguage)}</span>
                            </span>
                          )}
                        </div>
                        <div className="flow-card-body">
                          <p className="flow-step-text">{trSchemeText(step.mainText)}</p>
                          {step.note && (
                            <div className="flow-callout flow-callout-note">
                              <i className="fa-solid fa-circle-exclamation"></i>
                              <div>
                                <strong>{t('importantNote', 'Important Note:')}</strong>
                                <span>{trSchemeText(step.note)}</span>
                              </div>
                            </div>
                          )}
                          {step.disbursal && (
                            <div className="flow-callout flow-callout-disbursal">
                              <i className="fa-solid fa-hand-holding-dollar"></i>
                              <div>
                                <strong>{t('disbursalDetails', 'Disbursal Details:')}</strong>
                                <span>{trSchemeText(step.disbursal)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}

                  {/* Flow Connector to Final Milestone */}
                  <div className="flowchart-connector" aria-hidden="true">
                    <div className="flow-connector-stem"></div>
                    <div className="flow-arrow-node">
                      <i className="fa-solid fa-arrow-down"></i>
                    </div>
                    <div className="flow-connector-stem"></div>
                  </div>

                  {/* Flowchart Goal / Completion Cap */}
                  <div className="flowchart-goal-cap">
                    <div className="flow-goal-icon">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <div className="flow-goal-details">
                      <strong>{t('appApprovedBenefitsDisbursed', 'Application Approved & Benefits Disbursed')}</strong>
                      <span>{t('verificationCompleteDesc', 'Verification completed successfully. Entitlements or subsidy will be credited directly to the registered beneficiary account.')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Section 6: Official Portal and Support Action Banner */}
          <div className="detail-cta-banner">
            <div className="cta-banner-content">
              <h3>{t('readyToApplyHeading', 'Ready to Apply for this Government Scheme?')}</h3>
              <p>
                {t('readyToApplyDesc', 'Access the official government portal to submit your form online, or contact the helpline officers if you require guidance.')}
              </p>
              <div className="cta-banner-actions">
                {officialPortalUrl && (
                  <a
                    href={officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta-launch"
                    style={{ color: '#0f766e' }}
                  >
                    <i className="fa fa-arrow-up-right-from-square" style={{ color: '#0f766e' }}></i>
                    <span style={{ color: '#0f766e' }}>{t('launchOfficialPortal', 'Launch Official Application Portal')}</span>
                  </a>
                )}
                <button
                  onClick={() => navigate('/help-support')}
                  className="btn-cta-help"
                >
                  <i className="fa fa-headset"></i>
                  <span>{t('needHelpContact', 'Need Help? Contact Officer')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Intent Dialog (appears on exit intent or manual track click) */}
      <ApplicationIntentModal
        isOpen={showIntentModal}
        scheme={scheme}
        onSelectOption={handleIntentOption}
        onClose={() => handleIntentOption('NOT_NOW')}
      />
    </DashboardLayout>
  );
}

