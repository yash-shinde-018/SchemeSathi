/**
 * SchemeSathi Intelligent Dynamic Translation Engine
 * 
 * Translates:
 * 1. Admin added schemes (titles, descriptions, benefits, eligibility, etc.)
 * 2. System notifications and admin broadcast alerts
 * 3. Citizen support query replies and ticket resolutions
 * 
 * Supports all 6 platform languages:
 * English (en), Hindi (hi), Marathi (mr), Tamil (ta), Telugu (te), Bengali (bn).
 */

import apiClient from '../services/apiClient';
import { translateSchemeTitle } from './schemeTranslator';

// In-memory cache for fast, zero-delay lookups
const inMemoryCache = {
  hi: {},
  mr: {},
  ta: {},
  te: {},
  bn: {}
};

/**
 * Load cached translations from localStorage on startup
 */
function getStorageCache(lang) {
  if (lang === 'en') return {};
  try {
    const raw = localStorage.getItem(`schemesathi_dyn_trans_${lang}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    return {};
  }
}

function saveStorageCache(lang, newTranslations) {
  if (lang === 'en' || !newTranslations) return;
  try {
    const current = getStorageCache(lang);
    const updated = { ...current, ...newTranslations };
    localStorage.setItem(`schemesathi_dyn_trans_${lang}`, JSON.stringify(updated));
    // Also merge into memory cache
    inMemoryCache[lang] = { ...(inMemoryCache[lang] || {}), ...newTranslations };
  } catch {}
}

// =========================================================================
// SYSTEM ANNOUNCEMENT & CITIZEN NOTICE TRANSLATIONS
// =========================================================================

export const ANNOUNCEMENT_DICTIONARY = {
  'New Camp is coming soon': {
    hi: 'नया शिविर जल्द ही आ रहा है',
    mr: 'नवीन शिबिर लवकरच येत आहे',
    ta: 'புதிய முகாம் விரைவில் வருகிறது',
    te: 'కొత్త క్యాంప్ త్వరలో రాబోతోంది',
    bn: 'শিগগিরই আসছে নতুন ক্যাম্প'
  },
  'new camp is coming soon': {
    hi: 'नया शिविर जल्द ही आ रहा है',
    mr: 'नवीन शिबिर लवकरच येत आहे',
    ta: 'புதிய முகாம் விரைவில் வருகிறது',
    te: 'కొత్త క్యాంప్ త్వరలో రాబోతోంది',
    bn: 'শিগগিরই আসছে নতুন ক্যাম্প'
  },
  'Special Direct Benefit Transfer (DBT) verification drive active in all district panchayats this week': {
    hi: 'इस सप्ताह सभी जिला पंचायतों में विशेष प्रत्यक्ष लाभ अंतरण (डीबीटी) सत्यापन अभियान सक्रिय है',
    mr: 'या आठवड्यात सर्व जिल्हा पंचायतींमध्ये विशेष थेट लाभ हस्तांतरण (DBT) पडताळणी मोहीम सुरू आहे',
    ta: 'இந்த வாரம் அனைத்து மாவட்ட பஞ்சாயத்துகளிலும் சிறப்பு நேரடி நன்மை பரிமாற்றம் (DBT) சரிபார்ப்பு இயக்கம் செயலில் உள்ளது',
    te: 'ఈ వారం అన్ని జిల్లా పంచాయతీలలో ప్రత్యేక డైరెక్ట్ బెనిఫిట్ ట్రాన్స్‌ఫర్ (డిబిటి) ధృవీకరణ డ్రైవ్ చురుకుగా ఉంది',
    bn: 'এই সপ্তাহে সমস্ত জেলা পঞ্চায়েতে বিশেষ প্রত্যক্ষ সুবিধা স্থানান্তর (ডিবিটি) যাচাইকরণ ড্রাইভ সক্রিয় রয়েছে'
  },
  'Special Direct Benefit Transfer (DBT) verification drive active in all district panchayats this week...': {
    hi: 'इस सप्ताह सभी जिला पंचायतों में विशेष प्रत्यक्ष लाभ अंतरण (डीबीटी) सत्यापन अभियान सक्रिय है...',
    mr: 'या आठवड्यात सर्व जिल्हा पंचायतींमध्ये विशेष थेट लाभ हस्तांतरण (DBT) पडताळणी मोहीम सुरू आहे...',
    ta: 'இந்த வாரம் அனைத்து மாவட்ட பஞ்சாயத்துகளிலும் சிறப்பு நேரடி நன்மை பரிமாற்றம் (DBT) சரிபார்ப்பு இயக்கம் செயலில் உள்ளது...',
    te: 'ఈ వారం అన్ని జిల్లా పంచాయతీలలో ప్రత్యేక డైరెక్ట్ బెనిఫిట్ ట్రాన్స్‌ఫర్ (డిబిటి) ధృవీకరణ డ్రైవ్ చురుకుగా ఉంది...',
    bn: 'এই সপ্তাহে সমস্ত জেলা পঞ্চায়েতে বিশেষ প্রত্যক্ষ সুবিধা স্থানান্তর (ডিবিটি) যাচাইকরণ ড্রাইভ সক্রিয় রয়েছে...'
  }
};

/**
 * Synchronous / instant translation for system announcement banner
 */
export function translateAnnouncement(text, lang = 'en') {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();
  if (!clean || lang === 'en') return clean;

  // 1. Direct dictionary match
  if (ANNOUNCEMENT_DICTIONARY[clean] && ANNOUNCEMENT_DICTIONARY[clean][lang]) {
    return ANNOUNCEMENT_DICTIONARY[clean][lang];
  }
  const lower = clean.toLowerCase();
  for (const [key, map] of Object.entries(ANNOUNCEMENT_DICTIONARY)) {
    if (key.toLowerCase() === lower && map[lang]) {
      return map[lang];
    }
  }

  // 2. In-memory cache match
  if (inMemoryCache[lang] && inMemoryCache[lang][clean]) {
    return inMemoryCache[lang][clean];
  }

  // 3. LocalStorage cache match
  const storage = getStorageCache(lang);
  if (storage && storage[clean]) {
    inMemoryCache[lang] = { ...(inMemoryCache[lang] || {}), [clean]: storage[clean] };
    return storage[clean];
  }

  return clean;
}

/**
 * Fetch dynamic translations from backend API for missing text strings
 */
export async function fetchDynamicTranslations(texts, targetLang = 'en') {
  if (!texts || texts.length === 0 || targetLang === 'en') {
    return {};
  }

  const cleanTexts = Array.from(new Set(texts.map(t => String(t || '').trim()).filter(Boolean)));
  if (cleanTexts.length === 0) return {};

  const memory = inMemoryCache[targetLang] || {};
  const storage = getStorageCache(targetLang);

  const results = {};
  const missing = [];

  for (const t of cleanTexts) {
    if (memory[t]) {
      results[t] = memory[t];
    } else if (storage[t]) {
      results[t] = storage[t];
      memory[t] = storage[t];
    } else if (ANNOUNCEMENT_DICTIONARY[t] && ANNOUNCEMENT_DICTIONARY[t][targetLang]) {
      results[t] = ANNOUNCEMENT_DICTIONARY[t][targetLang];
      memory[t] = ANNOUNCEMENT_DICTIONARY[t][targetLang];
    } else {
      missing.push(t);
    }
  }

  if (missing.length === 0) {
    return results;
  }

  try {
    const res = await apiClient.schemes.translate(missing, targetLang);
    if (res?.success && res.translations) {
      saveStorageCache(targetLang, res.translations);
      Object.assign(results, res.translations);
    }
  } catch (err) {
    console.warn(`[DynamicTranslator] Error translating texts for lang ${targetLang}:`, err);
  }

  return results;
}

// =========================================================================
// NOTIFICATION TEMPLATE TRANSLATIONS (Instant zero-latency pattern matching)
// =========================================================================

const NOTIF_TEMPLATES = {
  // 1. Welcome Notification
  welcome_title: {
    hi: (name) => `स्कीमसाथी में आपका स्वागत है, ${name}! 🎉`,
    mr: (name) => `स्कीमसाथी मध्ये आपले स्वागत आहे, ${name}! 🎉`,
    ta: (name) => `ஸ்கீம்சாதிக்கு உங்களை வரவேற்கிறோம், ${name}! 🎉`,
    te: (name) => `స్కీమ్‌సాథికి స్వాగతం, ${name}! 🎉`,
    bn: (name) => `স্কিমসাথীতে আপনাকে স্বাগতম, ${name}! 🎉`
  },
  welcome_desc: {
    hi: 'स्कीमसाथी में आपका स्वागत है! अपने लिए तैयार सरकारी योजनाओं को देखना शुरू करें। 100% सटीक सिफारिशों के लिए अपनी प्रोफ़ाइल पूरी करें।',
    mr: 'स्कीमसाथी मध्ये आपले स्वागत आहे! आपल्यासाठी तयार केलेल्या सरकारी योजना शोधण्यास प्रारंभ करा. 100% अचूक शिफारसींसाठी आपले प्रोफाइल पूर्ण करा.',
    ta: 'ஸ்கீம்சாதிக்கு வரவேற்கிறோம்! உங்களுக்கான அரசுத் திட்டங்களை ஆராயத் தொடங்குங்கள். துல்லியமான பரிந்துரைகளுக்கு சுயவிவரத்தை முடிக்கவும்.',
    te: 'స్కీమ్‌సాథికి స్వాగతం! మీ కోసం రూపొందించబడిన ప్రభుత్వ పథకాలను అన్వేషించండి. ఖచ్చితమైన సిఫార్సుల కోసం మీ ప్రొఫైల్‌ను పూర్తి చేయండి.',
    bn: 'স্কিমসাথীতে স্বাগতম! আপনার জন্য উপযুক্ত সরকারি প্রকল্পগুলি অন্বেষণ শুরু করুন। সঠিক সুপারিশের জন্য প্রোফাইল সম্পূর্ণ করুন।'
  },

  // 2. Single Scheme Published
  single_scheme_title: {
    hi: (scheme) => `नई योजना जोड़ी गई: ${scheme}`,
    mr: (scheme) => `नवीन योजना जोडली: ${scheme}`,
    ta: (scheme) => `புதிய திட்டம் சேர்க்கப்பட்டது: ${scheme}`,
    te: (scheme) => `కొత్త పథకం జోడించబడింది: ${scheme}`,
    bn: (scheme) => `নতুন প্রকল্প যুক্ত হয়েছে: ${scheme}`
  },
  single_scheme_desc: {
    hi: (scheme) => `प्रशासन द्वारा एक नई सरकारी योजना "${scheme}" प्रकाशित की गई है। अपनी पात्रता जांचें और आवेदन करें।`,
    mr: (scheme) => `प्रशासनाकडून एक नवीन सरकारी योजना "${scheme}" प्रकाशित केली गेली आहे. आपली पात्रता तपासा आणि अर्ज करा.`,
    ta: (scheme) => `நிர்வாகத்தால் ஒரு புதிய அரசு திட்டம் "${scheme}" வெளியிடப்பட்டுள்ளது. உங்கள் தகுதியைச் சரிபார்த்து விண்ணப்பிக்கவும்.`,
    te: (scheme) => `పరిపాలన ద్వారా కొత్త ప్రభుత్వ పథకం "${scheme}" ప్రచురించబడింది. మీ అర్హతను తనిఖీ చేసి దరఖాస్తు చేసుకోండి.`,
    bn: (scheme) => `প্রশাসন দ্বারা একটি নতুন সরকারি প্রকল্প "${scheme}" প্রকাশিত হয়েছে। আপনার যোগ্যতা পরীক্ষা করে আবেদন করুন।`
  },

  // 3. Batch Schemes Imported
  batch_schemes_title: {
    hi: (count) => `${count} नई सरकारी योजनाएं जोड़ी गईं`,
    mr: (count) => `${count} नवीन सरकारी योजना जोडल्या गेल्या`,
    ta: (count) => `${count} புதிய அரசு திட்டங்கள் சேர்க்கப்பட்டன`,
    te: (count) => `${count} కొత్త ప్రభుత్వ పథకాలు జోడించబడ్డాయి`,
    bn: (count) => `${count}টি নতুন সরকারি প্রকল্প যুক্ত হয়েছে`
  },
  batch_schemes_desc: {
    hi: (count) => `प्रशासन ने पूरे भारत में ${count} नई कल्याणकारी योजनाओं को आयात और सूचीबद्ध किया है।`,
    mr: (count) => `प्रशासनाने संपूर्ण भारतात ${count} नवीन कल्याणकारी योजना आयात आणि सूचीबद्ध केल्या आहेत.`,
    ta: (count) => `நிர்வாகம் இந்தியா முழுவதும் ${count} புதிய நலத்திட்டங்களை பட்டியலிட்டுள்ளது.`,
    te: (count) => `పరిపాలన భారతదేశం అంతటా ${count} కొత్త సంక్షేమ పథకాలను కేటలాగ్ చేసింది.`,
    bn: (count) => `প্রশাসন সমগ্র ভারতে ${count}টি নতুন কল্যাণমূলক প্রকল্প তালিকাভুক্ত করেছে।`
  },

  // 4. Query / Grievance Reply
  query_reply_title: {
    hi: (ticket) => `सपोर्ट डेस्क ने उत्तर दिया: टिकट ${ticket}`,
    mr: (ticket) => `सपोर्ट डेस्कने उत्तर दिले: तिकीट ${ticket}`,
    ta: (ticket) => `ஆதரவு மேசை பதிலளித்தது: டிக்கெட் ${ticket}`,
    te: (ticket) => `సపోర్ట్ డెస్క్ ప్రత్యుత్తరం ఇచ్చింది: టికెట్ ${ticket}`,
    bn: (ticket) => `সহায়তা ডেস্ক উত্তর দিয়েছে: টিকিট ${ticket}`
  },
  query_registered_title: {
    hi: (ticket) => `पूछताछ दर्ज की गई: टिकट ${ticket}`,
    mr: (ticket) => `चौकशी नोंदवली: तिकीट ${ticket}`,
    ta: (ticket) => `விசாரணை பதிவு செய்யப்பட்டது: டிக்கெட் ${ticket}`,
    te: (ticket) => `ప్రశ్న నమోదు చేయబడింది: టికెట్ ${ticket}`,
    bn: (ticket) => `অনুসন্ধান নিবন্ধিত হয়েছে: টিকিট ${ticket}`
  },
  admin_response_prefix: {
    hi: 'व्यवस्थापक प्रतिक्रिया:',
    mr: 'प्रशासक प्रतिसाद:',
    ta: 'நிர்வாக பதில்:',
    te: 'అడ్మిన్ ప్రత్యుత్తరం:',
    bn: 'অ্যাডমিন প্রতিক্রিয়া:'
  },

  // 5. Common Action Links
  action_links: {
    'Complete Profile →': {
      hi: 'प्रोफ़ाइल पूरा करें →',
      mr: 'प्रोफाइल पूर्ण करा →',
      ta: 'சுயவிவரத்தை முடிக்கவும் →',
      te: 'ప్రొఫైల్‌ను పూర్తి చేయండి →',
      bn: 'প্রোফাইল সম্পূর্ণ করুন →'
    },
    'View Scheme Details →': {
      hi: 'योजना विवरण देखें →',
      mr: 'योजनेचे तपशील पहा →',
      ta: 'திட்ட விவரங்களைப் பார்க்கவும் →',
      te: 'పథకం వివరాలను చూడండి →',
      bn: 'প্রকল্পের বিবরণ দেখুন →'
    },
    'Browse Welfare Catalog →': {
      hi: 'कल्याणकारी कैटलॉग ब्राउज़ करें →',
      mr: 'कल्याणकारी कॅटलॉग ब्राउझ करा →',
      ta: 'நலத்திட்ட பட்டியலை உலாவவும் →',
      te: 'సంక్షేమ కేటలాగ్‌ను చూడండి →',
      bn: 'কল্যাণমূলক ক্যাটালগ ব্রাউজ করুন →'
    },
    'View Resolution in Helpdesk →': {
      hi: 'हेल्पडेस्क में समाधान देखें →',
      mr: 'मदत कक्षात निराकरण पहा →',
      ta: 'உதவி மையத்தில் தீர்வைக் காண்க →',
      te: 'సహాయ డెస్క్‌లో పరిష్కారాన్ని చూడండి →',
      bn: 'হেল্পডেস্কে সমাধান দেখুন →'
    },
    'Go to Applications →': {
      hi: 'आवेदनों पर जाएं →',
      mr: 'अर्जांकडे जा →',
      ta: 'விண்ணப்பங்களுக்குச் செல்லவும் →',
      te: 'దరఖాస్తులకు వెళ్లండి →',
      bn: 'আবেদনে যান →'
    },
    'Track Status Timeline →': {
      hi: 'स्थिति समयरेखा ट्रैक करें →',
      mr: 'स्थिती टाइमलाइन ट्रॅक करा →',
      ta: 'நிலை காலவரிசையைக் கண்காணிக்கவும் →',
      te: 'స్థితి కాలక్రమాన్ని ట్రాక్ చేయండి →',
      bn: 'স্ট্যাটাস টাইমলাইন ট্র্যাক করুন →'
    },
    'Verify Bank Seeding →': {
      hi: 'बैंक सीडिंग सत्यापित करें →',
      mr: 'बँक सीडिंग पडताळा →',
      ta: 'வங்கி இணைப்பைச் சரிபார்க்கவும் →',
      te: 'బ్యాంక్ సీడింగ్‌ను ధృవీకరించండి →',
      bn: 'ব্যাঙ্ক সিডিং যাচাই করুন →'
    },
    'View Payment Voucher →': {
      hi: 'भुगतान वाउचर देखें →',
      mr: 'पेमेंट व्हाउचर पहा →',
      ta: 'பணம் செலுத்தும் வவுச்சரைப் பார்க்கவும் →',
      te: 'చెల్లింపు వోచర్‌ను చూడండి →',
      bn: 'পেমেন্ট ভাউচার দেখুন →'
    }
  }
};

/**
 * Translate a notification object into the target language
 */
export function translateNotificationItem(item, lang = 'en', dynamicTranslations = {}) {
  if (!item || lang === 'en') return item;

  let title = item.title || '';
  let description = item.description || '';
  let linkText = item.linkText || item.link_text || '';

  // 1. Match Welcome Title
  const welcomeMatch = title.match(/Welcome to SchemeSathi,\s*([^!]+)!\s*🎉?/i);
  if (welcomeMatch && NOTIF_TEMPLATES.welcome_title[lang]) {
    const citizenName = welcomeMatch[1].trim();
    title = NOTIF_TEMPLATES.welcome_title[lang](citizenName);
  }

  // 1b. Match Welcome Description
  if (description.includes('Welcome to SchemeSathi! Start exploring') && NOTIF_TEMPLATES.welcome_desc[lang]) {
    description = NOTIF_TEMPLATES.welcome_desc[lang];
  }

  // 2. Match Single Scheme Added Title
  const schemeAddedMatch = title.match(/New Scheme Added:\s*(.+)/i);
  if (schemeAddedMatch && NOTIF_TEMPLATES.single_scheme_title[lang]) {
    const rawSchemeName = schemeAddedMatch[1].trim();
    const transSchemeName = translateSchemeTitle(rawSchemeName, lang, dynamicTranslations) || rawSchemeName;
    title = NOTIF_TEMPLATES.single_scheme_title[lang](transSchemeName);
  }

  // 2b. Match Single Scheme Description
  const schemeDescMatch = description.match(/A new government scheme "([^"]+)" has been published by the administration\.\s*Check your eligibility and apply\./i);
  if (schemeDescMatch && NOTIF_TEMPLATES.single_scheme_desc[lang]) {
    const rawSchemeName = schemeDescMatch[1].trim();
    const transSchemeName = translateSchemeTitle(rawSchemeName, lang, dynamicTranslations) || rawSchemeName;
    description = NOTIF_TEMPLATES.single_scheme_desc[lang](transSchemeName);
  }

  // 3. Match Batch Schemes Added Title
  const batchAddedMatch = title.match(/(\d+)\s*New Government Scheme\(s\)\s*Added/i);
  if (batchAddedMatch && NOTIF_TEMPLATES.batch_schemes_title[lang]) {
    const count = batchAddedMatch[1];
    title = NOTIF_TEMPLATES.batch_schemes_title[lang](count);
  }

  // 3b. Match Batch Schemes Description
  const batchDescMatch = description.match(/The administration has imported and cataloged\s*(\d+)\s*new welfare scheme\(s\)\s*across India\./i);
  if (batchDescMatch && NOTIF_TEMPLATES.batch_schemes_desc[lang]) {
    const count = batchDescMatch[1];
    description = NOTIF_TEMPLATES.batch_schemes_desc[lang](count);
  }

  // 4. Match Query Reply Title
  const replyMatch = title.match(/Support Desk Replied:\s*Ticket\s*([A-Za-z0-9_-]+)/i);
  if (replyMatch && NOTIF_TEMPLATES.query_reply_title[lang]) {
    const ticketId = replyMatch[1];
    title = NOTIF_TEMPLATES.query_reply_title[lang](ticketId);
  }

  // 4b. Match Query Registered Title
  const regMatch = title.match(/Query Registered:\s*(?:Ticket\s*)?([A-Za-z0-9_-]+)/i);
  if (regMatch && NOTIF_TEMPLATES.query_registered_title[lang]) {
    const ticketId = regMatch[1];
    title = NOTIF_TEMPLATES.query_registered_title[lang](ticketId);
  }

  // 4c. Match Admin Response in description
  const adminRespMatch = description.match(/Admin Response:\s*"([^"]+)"/i);
  if (adminRespMatch && NOTIF_TEMPLATES.admin_response_prefix[lang]) {
    const rawResp = adminRespMatch[1];
    const transResp = dynamicTranslations[rawResp] || rawResp;
    description = `${NOTIF_TEMPLATES.admin_response_prefix[lang]} "${transResp}"`;
  }

  // 5. Match Action Link
  if (linkText && NOTIF_TEMPLATES.action_links[linkText] && NOTIF_TEMPLATES.action_links[linkText][lang]) {
    linkText = NOTIF_TEMPLATES.action_links[linkText][lang];
  }

  // 6. Check dynamic translations for custom announcements
  if (dynamicTranslations[item.title]) {
    title = dynamicTranslations[item.title];
  }
  if (dynamicTranslations[item.description]) {
    description = dynamicTranslations[item.description];
  }

  return {
    ...item,
    title,
    description,
    linkText,
    link_text: linkText
  };
}

// =========================================================================
// LOCALIZED TIME AGO FORMATTER
// =========================================================================

export function formatLocalizedTimeAgo(isoDate, lang = 'en') {
  if (!isoDate) {
    const justNowMap = {
      en: 'Just now',
      hi: 'अभी-अभी',
      mr: 'आत्ताच',
      ta: 'இப்போதுதான்',
      te: 'ఇప్పుడే',
      bn: 'এইমাত্র'
    };
    return justNowMap[lang] || 'Just now';
  }

  try {
    const normalized = typeof isoDate === 'string' && !isoDate.endsWith('Z') && !isoDate.includes('+')
      ? `${isoDate}Z`
      : isoDate;
    const diffMs = Math.max(0, Date.now() - new Date(normalized).getTime());
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      const justNowMap = {
        en: 'Just now',
        hi: 'अभी-अभी',
        mr: 'आत्ताच',
        ta: 'இப்போதுதான்',
        te: 'ఇప్పుడే',
        bn: 'এইমাত্র'
      };
      return justNowMap[lang] || 'Just now';
    }

    if (diffMins < 60) {
      if (lang === 'hi') return `${diffMins} मिनट पहले`;
      if (lang === 'mr') return `${diffMins} मिनिटांपूर्वी`;
      if (lang === 'ta') return `${diffMins} நிமிடங்களுக்கு முன்`;
      if (lang === 'te') return `${diffMins} నిమిషాల క్రితం`;
      if (lang === 'bn') return `${diffMins} মিনিট আগে`;
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      if (lang === 'hi') return `${diffHours} घंटे पहले`;
      if (lang === 'mr') return `${diffHours} तासांपूर्वी`;
      if (lang === 'ta') return `${diffHours} மணி நேரத்திற்கு முன்`;
      if (lang === 'te') return `${diffHours} గంటల క్రితం`;
      if (lang === 'bn') return `${diffHours} ঘন্টা আগে`;
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      if (lang === 'hi') return `${diffDays} दिन पहले`;
      if (lang === 'mr') return `${diffDays} दिवसांपूर्वी`;
      if (lang === 'ta') return `${diffDays} நாட்களுக்கு முன்`;
      if (lang === 'te') return `${diffDays} రోజుల క్రితం`;
      if (lang === 'bn') return `${diffDays} দিন আগে`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    return new Date(normalized).toLocaleDateString(lang === 'mr' || lang === 'hi' ? 'hi-IN' : 'en-IN');
  } catch {
    return 'Recently';
  }
}
