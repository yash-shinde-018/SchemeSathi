/**
 * SchemeSathi Intelligent Multilingual Scheme Translation Engine
 * Translates scheme names, states, ministries, step titles, timelines,
 * document names, notes, and detailed descriptions into all 6 supported languages:
 * English (en), Hindi (hi), Marathi (mr), Tamil (ta), Telugu (te), Bengali (bn).
 */

import schemesDataTranslations from '../locales/schemesTranslations.json';

// =========================================================================
// 1. STATES AND JURISDICTIONS
// =========================================================================
export const STATE_TRANSLATIONS = {
  'Andhra Pradesh': {
    hi: 'आंध्र प्रदेश',
    mr: 'आंध्र प्रदेश',
    ta: 'ஆந்திரப் பிரதேசம்',
    te: 'ఆంధ్రప్రదేశ్',
    bn: 'অন্ধ্রপ্রদেশ'
  },
  'Maharashtra': {
    hi: 'महाराष्ट्र',
    mr: 'महाराष्ट्र',
    ta: 'மகாராஷ்டிரா',
    te: 'మహారాష్ట్ర',
    bn: 'মহারাষ্ট্র'
  },
  'Karnataka': {
    hi: 'कर्नाटक',
    mr: 'कर्नाटक',
    ta: 'கர்நாடகா',
    te: 'కర్ణాటక',
    bn: 'কর্ণাটক'
  },
  'Gujarat': {
    hi: 'गुजरात',
    mr: 'गुजरात',
    ta: 'குஜராத்',
    te: 'గుజరాత్',
    bn: 'গুজরাট'
  },
  'Tamil Nadu': {
    hi: 'तमिलनाडु',
    mr: 'तमिळनाडू',
    ta: 'தமிழ்நாடு',
    te: 'తమిళనాడు',
    bn: 'তামিলনাড়ু'
  },
  'Telangana': {
    hi: 'तेलंगाना',
    mr: 'तेलंगणा',
    ta: 'தெலுங்கானா',
    te: 'తెలంగాణ',
    bn: 'তেলেঙ্গানা'
  },
  'Uttar Pradesh': {
    hi: 'उत्तर प्रदेश',
    mr: 'उत्तर प्रदेश',
    ta: 'உத்திரப் பிரதேசம்',
    te: 'ఉత్తర ప్రదేశ్',
    bn: 'উত্তর প্রদেশ'
  },
  'Madhya Pradesh': {
    hi: 'मध्य प्रदेश',
    mr: 'मध्य प्रदेश',
    ta: 'மத்தியப் பிரதேசம்',
    te: 'మధ్యప్రదేశ్',
    bn: 'মধ্য প্রদেশ'
  },
  'Rajasthan': {
    hi: 'राजस्थान',
    mr: 'राजस्थान',
    ta: 'ராஜஸ்தான்',
    te: 'రాజస్థాన్',
    bn: 'রাজস্থান'
  },
  'West Bengal': {
    hi: 'पश्चिम बंगाल',
    mr: 'पश्चिम बंगाल',
    ta: 'மேற்கு வங்கம்',
    te: 'పశ్చిమ బెంగాల్',
    bn: 'পশ্চিমবঙ্গ'
  },
  'Bihar': {
    hi: 'बिहार',
    mr: 'बिहार',
    ta: 'பீகார்',
    te: 'బీహార్',
    bn: 'বিহার'
  },
  'Odisha': {
    hi: 'ओडिशा',
    mr: 'ओडिशा',
    ta: 'ஒடிசா',
    te: 'ఒడిశా',
    bn: 'ওড়িশা'
  },
  'Kerala': {
    hi: 'केरल',
    mr: 'केरळ',
    ta: 'கேரளா',
    te: 'కేరళ',
    bn: 'কেরালা'
  },
  'Punjab': {
    hi: 'पंजाब',
    mr: 'पंजाब',
    ta: 'பஞ்சாப்',
    te: 'పంజాబ్',
    bn: 'পাঞ্জাব'
  },
  'Haryana': {
    hi: 'हरियाणा',
    mr: 'हरियाणा',
    ta: 'ஹரியானா',
    te: 'హర్యానా',
    bn: 'হরিয়ানা'
  },
  'Assam': {
    hi: 'असम',
    mr: 'आसाम',
    ta: 'அசாம்',
    te: 'అస్సాం',
    bn: 'আসাম'
  },
  'Delhi': {
    hi: 'दिल्ली',
    mr: 'दिल्ली',
    ta: 'டெல்லி',
    te: 'ఢిల్లీ',
    bn: 'দিল্লি'
  },
  'Puducherry': {
    hi: 'पुडुचेरी',
    mr: 'पुद्दुचेरी',
    ta: 'புதுச்சேரி',
    te: 'పుదుచ్చేరి',
    bn: 'পুদুচেরি'
  },
  'Pondicherry': {
    hi: 'पुडुचेरी',
    mr: 'पुद्दुचेरी',
    ta: 'புதுச்சேரி',
    te: 'పుదుచ్చేరి',
    bn: 'পুদুচেরি'
  },
  'Chandigarh': {
    hi: 'चंडीगढ़',
    mr: 'चंदीगड',
    ta: 'சண்டிகர்',
    te: 'చండీగఢ్',
    bn: 'চণ্ডীগড়'
  },
  'Goa': {
    hi: 'गोवा',
    mr: 'गोवा',
    ta: 'கோவா',
    te: 'గోవా',
    bn: 'গোয়া'
  },
  'Jammu and Kashmir': {
    hi: 'जम्मू और कश्मीर',
    mr: 'जम्मू आणि काश्मीर',
    ta: 'ஜம்மு மற்றும் காஷ்மீர்',
    te: 'జమ్మూ కాశ్మీర్',
    bn: 'জম্মু ও কাশ্মীর'
  },
  'Ladakh': {
    hi: 'लद्दाख',
    mr: 'लडाख',
    ta: 'லடாக்',
    te: 'లడఖ్',
    bn: 'লাদাখ'
  },
  'Himachal Pradesh': {
    hi: 'हिमाचल प्रदेश',
    mr: 'हिमाचल प्रदेश',
    ta: 'இமாச்சல பிரதேசம்',
    te: 'హిమాచల్ ప్రదేశ్',
    bn: 'হিমাচল প্রদেশ'
  },
  'Uttarakhand': {
    hi: 'उत्तराखंड',
    mr: 'उत्तराखंड',
    ta: 'உத்தரகாண்ட்',
    te: 'ఉత్తరాఖండ్',
    bn: 'উত্তরাখণ্ড'
  },
  'Jharkhand': {
    hi: 'झारखंड',
    mr: 'झारखंड',
    ta: 'ஜார்கண்ட்',
    te: 'జార్ఖండ్',
    bn: 'ঝাড়খণ্ড'
  },
  'Chhattisgarh': {
    hi: 'छत्तीसगढ़',
    mr: 'छत्तीसगड',
    ta: 'சத்தீஸ்கர்',
    te: 'ఛత్తీస్‌గఢ్',
    bn: 'ছত্তিশগড়'
  },
  'Tripura': {
    hi: 'त्रिपुरा',
    mr: 'त्रिपुरा',
    ta: 'திரிபுரா',
    te: 'త్రిపుర',
    bn: 'ত্রিপুরা'
  },
  'Meghalaya': {
    hi: 'मेघालय',
    mr: 'मेघालय',
    ta: 'மேகாலயா',
    te: 'మేఘాలయ',
    bn: 'মেঘালয়'
  },
  'Manipur': {
    hi: 'मणिपुर',
    mr: 'मणिपूर',
    ta: 'மணிப்பூர்',
    te: 'మణిపూర్',
    bn: 'মণিপুর'
  },
  'Nagaland': {
    hi: 'नागालैंड',
    mr: 'नागालँड',
    ta: 'நாகாலாந்து',
    te: 'నాగాలాండ్',
    bn: 'নাগাল্যান্ড'
  },
  'Mizoram': {
    hi: 'मिजोरम',
    mr: 'मिझोराम',
    ta: 'மிசோரம்',
    te: 'మిజోరం',
    bn: 'মিজোরাম'
  },
  'Sikkim': {
    hi: 'सिक्किम',
    mr: 'सिक्कीम',
    ta: 'சிக்கிம்',
    te: 'సిక్కిం',
    bn: 'সিকিম'
  },
  'Arunachal Pradesh': {
    hi: 'अरुणाचल प्रदेश',
    mr: 'अरुणाचल प्रदेश',
    ta: 'அருணாச்சல பிரதேசம்',
    te: 'அరుణాచల్ ప్రదేశ్',
    bn: 'অরুণাচল প্রদেশ'
  },
  'National (All India)': {
    hi: 'राष्ट्रीय (अखिल भारतीय)',
    mr: 'राष्ट्रीय (संपूर्ण भारत)',
    ta: 'தேசிய (அனைத்து இந்தியா)',
    te: 'జాతీయ (అఖిల భారతదేశం)',
    bn: 'জাতীয় (সমগ্র ভারত)'
  },
  'All India': {
    hi: 'संपूर्ण भारत',
    mr: 'संपूर्ण भारत',
    ta: 'அனைத்து இந்தியா',
    te: 'అఖిల భారతదేశం',
    bn: 'সমগ্র ভারত'
  },
  'Central': {
    hi: 'केंद्रीय स्तर',
    mr: 'केंद्र शासन स्तर',
    ta: 'மத்திய நிலை',
    te: 'కేంద్ర స్థాయి',
    bn: 'কেন্দ্রীয় স্তর'
  },
  'State Level': {
    hi: 'राज्य स्तर',
    mr: 'राज्य शासन स्तर',
    ta: 'மாநில நிலை',
    te: 'రాష్ట్ర స్థాయి',
    bn: 'রাজ্য স্তর'
  }
};

export const translateStateName = (state, lang = 'en') => {
  if (!state || lang === 'en') return state || '';
  const match = STATE_TRANSLATIONS[state];
  if (match && match[lang]) return match[lang];
  // Check case-insensitive
  const foundKey = Object.keys(STATE_TRANSLATIONS).find(k => k.toLowerCase() === String(state).toLowerCase().trim());
  if (foundKey && STATE_TRANSLATIONS[foundKey][lang]) {
    return STATE_TRANSLATIONS[foundKey][lang];
  }
  return state;
};

// =========================================================================
// 2. MINISTRIES AND AUTHORITIES
// =========================================================================
export const AUTHORITY_TRANSLATIONS = {
  'Government of India': {
    hi: 'भारत सरकार',
    mr: 'भारत सरकार',
    ta: 'இந்திய அரசு',
    te: 'భారత ప్రభుత్వం',
    bn: 'ভারত সরকার'
  },
  'Central Government': {
    hi: 'केंद्र सरकार',
    mr: 'केंद्र शासन',
    ta: 'மத்திய அரசு',
    te: 'కేంద్ర ప్రభుత్వం',
    bn: 'কেন্দ্রীয় সরকার'
  },
  'Government of Andhra Pradesh': {
    hi: 'आंध्र प्रदेश सरकार',
    mr: 'आंध्र प्रदेश शासन',
    ta: 'ஆந்திரப் பிரதேச அரசு',
    te: 'ఆంధ్రప్రదేశ్ ప్రభుత్వం',
    bn: 'অন্ধ্রপ্রদেশ সরকার'
  },
  'Government of Maharashtra': {
    hi: 'महाराष्ट्र सरकार',
    mr: 'महाराष्ट्र शासन',
    ta: 'மகாராஷ்டிரா அரசு',
    te: 'మహారాష్ట్ర ప్రభుత్వం',
    bn: 'মহারাষ্ট্র সরকার'
  },
  'Government of Karnataka': {
    hi: 'कर्नाटक सरकार',
    mr: 'कर्नाटक शासन',
    ta: 'கர்நாடக அரசு',
    te: 'కర్ణాటక ప్రభుత్వం',
    bn: 'কর্ণাটক সরকার'
  },
  'Government of Tamil Nadu': {
    hi: 'तमिलनाडु सरकार',
    mr: 'तमिळनाडू शासन',
    ta: 'தமிழ்நாடு அரசு',
    te: 'తమిళనాడు ప్రభుత్వం',
    bn: 'তামিলনাড়ু সরকার'
  },
  'Government of Gujarat': {
    hi: 'गुजरात सरकार',
    mr: 'गुजरात शासन',
    ta: 'குஜராத் அரசு',
    te: 'గుజరాత్ ప్రభుత్వం',
    bn: 'গুজরাট সরকার'
  },
  'Department of Handlooms & Textiles': {
    hi: 'हथकरघा एवं वस्त्र विभाग',
    mr: 'हातमाग आणि वस्त्रोद्योग विभाग',
    ta: 'கைத்தறி மற்றும் ஜவுளித் துறை',
    te: 'చేనేత మరియు జౌళి శాఖ',
    bn: 'তাঁত ও বস্ত্ৰ বিভাগ'
  },
  'Ministry of Agriculture and Farmers Welfare': {
    hi: 'कृषि एवं किसान कल्याण मंत्रालय',
    mr: 'कृषी आणि शेतकरी कल्याण मंत्रालय',
    ta: 'விவசாயம் மற்றும் விவசாயிகள் நல அமைச்சகம்',
    te: 'వ్యవసాయ మరియు రైతు సంక్షేమ మంత్రిత్వ శాఖ',
    bn: 'কৃষি ও কৃষক কল্যাণ মন্ত্রক'
  },
  'Ministry of Education': {
    hi: 'शिक्षा मंत्रालय',
    mr: 'शिक्षण मंत्रालय',
    ta: 'கல்வி அமைச்சகம்',
    te: 'విద్యా మంత్రిత్వ శాఖ',
    bn: 'শিক্ষা মন্ত্রক'
  },
  'Ministry of Social Justice and Empowerment': {
    hi: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय',
    mr: 'सामाजिक न्याय आणि सक्षमीकरण मंत्रालय',
    ta: 'சமூக நீதி மற்றும் அதிகாரமளித்தல் அமைச்சகம்',
    te: 'సామాజిక న్యాయం మరియు సాధికారత మంత్రిత్వ శాఖ',
    bn: 'সামাজিক ন্যায় ও ক্ষমতায়ন মন্ত্রক'
  },
  'Ministry of Health and Family Welfare': {
    hi: 'स्वास्थ्य एवं परिवार कल्याण मंत्रालय',
    mr: 'आरोग्य आणि कुटुंब कल्याण मंत्रालय',
    ta: 'சுகாதாரம் மற்றும் குடும்ப நல அமைச்சகம்',
    te: 'ఆరోగ్య మరియు కుటుంబ సంక్షేమ మంత్రిత్వ శాఖ',
    bn: 'স্বাস্থ্য ও পরিবার কল্যাণ মন্ত্রক'
  },
  'Ministry of Rural Development': {
    hi: 'ग्रामीण विकास मंत्रालय',
    mr: 'ग्रामीण विकास मंत्रालय',
    ta: 'ஊரக வளர்ச்சி அமைச்சகம்',
    te: 'గ్రామీణాభివృద్ధి మంత్రిత్వ శాఖ',
    bn: 'পল্লী উন্নয়ন মন্ত্রক'
  },
  'Ministry of Women and Child Development': {
    hi: 'महिला एवं बाल विकास मंत्रालय',
    mr: 'महिला आणि बालविकास मंत्रालय',
    ta: 'பெண்கள் மற்றும் குழந்தைகள் மேம்பாட்டு அமைச்சகம்',
    te: 'మహిళా మరియు శిశు అభివృద్ధి మంత్రిత్వ శాఖ',
    bn: 'মহিলা ও শিশু উন্নয়ন মন্ত্রক'
  }
};

export const translateAuthorityName = (auth, lang = 'en', dynamicMap = null) => {
  if (!auth) return 'Government of India';
  // Normalize punctuation/comma spacing (e.g. "Fisheries,Animal" -> "Fisheries, Animal")
  const normalized = String(auth).replace(/,([^\s])/g, ', $1').trim();
  if (lang === 'en') return normalized;

  // Check dynamicMap
  if (dynamicMap && (dynamicMap[normalized] || dynamicMap[auth])) {
    return dynamicMap[normalized] || dynamicMap[auth];
  }

  // Check localStorage caches
  try {
    const raw1 = typeof window !== 'undefined' ? localStorage.getItem(`schemesathi_dyn_trans_${lang}`) : null;
    if (raw1) {
      const p1 = JSON.parse(raw1);
      if (p1[normalized]) return p1[normalized];
      if (p1[auth]) return p1[auth];
    }
    const raw2 = typeof window !== 'undefined' ? localStorage.getItem(`schemesathi_translations_${lang}`) : null;
    if (raw2) {
      const p2 = JSON.parse(raw2);
      if (p2[normalized]) return p2[normalized];
      if (p2[auth]) return p2[auth];
    }
  } catch (e) {}
  
  // 1. Direct match in bundled 100-schemes ministries
  const bundledMinistries = schemesDataTranslations[lang]?.ministries;
  if (bundledMinistries) {
    if (bundledMinistries[normalized]) return bundledMinistries[normalized];
    if (bundledMinistries[auth]) return bundledMinistries[auth];
    const cleanAuth = normalized;
    if (bundledMinistries[cleanAuth]) return bundledMinistries[cleanAuth];
    const foundKey = Object.keys(bundledMinistries).find(k => k.toLowerCase() === cleanAuth.toLowerCase());
    if (foundKey) return bundledMinistries[foundKey];
  }

  // Case-insensitive fallback for AUTHORITY_TRANSLATIONS
  const foundAuthKey = Object.keys(AUTHORITY_TRANSLATIONS).find(k => k.toLowerCase() === normalized.toLowerCase() || k.toLowerCase() === auth.toLowerCase());
  if (foundAuthKey && AUTHORITY_TRANSLATIONS[foundAuthKey][lang]) {
    return AUTHORITY_TRANSLATIONS[foundAuthKey][lang];
  }

  if (AUTHORITY_TRANSLATIONS[normalized] && AUTHORITY_TRANSLATIONS[normalized][lang]) {
    return AUTHORITY_TRANSLATIONS[normalized][lang];
  }
  if (AUTHORITY_TRANSLATIONS[auth] && AUTHORITY_TRANSLATIONS[auth][lang]) {
    return AUTHORITY_TRANSLATIONS[auth][lang];
  }

  // Handle patterns like "Government of <State>" or "<State> Government"
  const govtMatch = String(auth).match(/Government of (.+)/i);
  if (govtMatch) {
    const st = govtMatch[1].trim();
    const stTrans = translateStateName(st, lang);
    if (lang === 'mr') return `${stTrans} शासन`;
    if (lang === 'hi') return `${stTrans} सरकार`;
    if (lang === 'ta') return `${stTrans} அரசு`;
    if (lang === 'te') return `${stTrans} ప్రభుత్వం`;
    if (lang === 'bn') return `${stTrans} सरकार`;
  }

  const govtMatch2 = String(auth).match(/(.+) Government/i);
  if (govtMatch2) {
    const st = govtMatch2[1].trim();
    const stTrans = translateStateName(st, lang);
    if (lang === 'mr') return `${stTrans} शासन`;
    if (lang === 'hi') return `${stTrans} सरकार`;
    if (lang === 'ta') return `${stTrans} அரசு`;
    if (lang === 'te') return `${stTrans} ప్రభుత్వం`;
    if (lang === 'bn') return `${stTrans} सरकार`;
  }

  // Standalone state name like "Puducherry" or "Maharashtra"
  const cleanAuth = String(auth).trim();
  const directStateTrans = translateStateName(cleanAuth, lang);
  if (directStateTrans && directStateTrans !== cleanAuth) {
    if (lang === 'mr') return `${directStateTrans} शासन`;
    if (lang === 'hi') return `${directStateTrans} सरकार`;
    if (lang === 'ta') return `${directStateTrans} அரசு`;
    if (lang === 'te') return `${directStateTrans} ప్రభుత్వం`;
    if (lang === 'bn') return `${directStateTrans} सरकार`;
  }

  return auth;
};

// =========================================================================
// 3. SCHEME NAMES / TITLES
// =========================================================================
export const KNOWN_SCHEME_TITLES = {
  'Pradhan Mantri Dakshta Aur Kushalta Sampann Hitgrahi (PM-DAKSH)': {
    hi: 'प्रधानमंत्री दक्षता और कुशलता सम्पन्न हितग्राही (पीएम-दक्ष)',
    mr: 'पंतप्रधान दक्षता आणि कुशलता संपन्न हितग्राही (पीएम-दक्ष)',
    ta: 'பிரதான் மந்திரி தக்ஷதா அவுர் குஷல்தா சம்பன்ன ஹித்கிராஹி (பிஎம்-தக்ஷ்)',
    te: 'ప్రధాన మంత్రి దక్షత ఔర్ కుశలత సంపన్న హితగ్రాహి (పీఎం-దక్ష్)',
    bn: 'প্রধানমন্ত্রী দক্ষতা ও কৌশল সম্পন্ন হিতগ্রাহী (পিএম-দক্ষ)'
  },
  '40% Subsidy On Hank Yarn, Dyes & Chemicals Scheme': {
    hi: 'हैंक यार्न, रंग और रसायन पर 40% सब्सिडी योजना',
    mr: 'हँक यार्न, रंग आणि रसायनांवर ४०% सबसिडी योजना',
    ta: 'ஹேங்க் நூல், சாயங்கள் மற்றும் இரசாயனங்கள் மீதான 40% மானியத் திட்டம்',
    te: 'హాంక్ నూలు, రంగులు మరియు రసాయనాలపై 40% సబ్సిడీ పథకం',
    bn: 'হ্যাং সুতো, রং এবং রাসায়নিকের উপর ৪০% ভর্তুকি প্রকল্প'
  },
  'PM-KISAN Samman Nidhi': {
    hi: 'प्रधानमंत्री किसान सम्मान निधि',
    mr: 'प्रधानमंत्री किसान सन्मान निधी',
    ta: 'பிரதான் மந்திரி கிசான் சம்மான் நிதி',
    te: 'ప్రధాన మంత్రి కిసాన్ సమ్మాన్ నిధి',
    bn: 'প্রধানমন্ত্রী কিষাণ সম্মান নিধি'
  },
  'Pradhan Mantri Awas Yojana - Gramin': {
    hi: 'प्रधानमंत्री आवास योजना - ग्रामीण',
    mr: 'प्रधानमंत्री आवास योजना - ग्रामीण',
    ta: 'பிரதான் மந்திரி ஆவாஸ் யோஜனா - கிராமப்புறம்',
    te: 'ప్రధాన మంత్రి ఆవాస్ యోజన - గ్రామీణ',
    bn: 'প্রধানমন্ত্রী আবাস যোজনা - গ্রামীণ'
  },
  'Post Matric Scholarship Scheme': {
    hi: 'पोस्ट मैट्रिक छात्रवृत्ति योजना',
    mr: 'मॅट्रिकोत्तर शिष्यवृत्ती योजना',
    ta: 'பள்ளிப் படிப்புக்கு பிந்தைய கல்வி உதவித்தொகை திட்டம்',
    te: 'పోస్ట్ మెట్రిక్ స్కాలర్‌షిప్ పథకం',
    bn: 'পোস্ট ম্যাট্রিক স্কলারশিপ প্রকল্প'
  },
  'Ayushman Bharat - PMJAY': {
    hi: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना',
    mr: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना',
    ta: 'ஆயுஷ்மான் பாரத் - பிரதம மந்திரி ஜன் ஆரோக்கிய திட்டம்',
    te: 'ఆయుష్మాన్ భారత్ - ప్రధాన మంత్రి జన్ ఆరోగ్య యోజన',
    bn: 'আয়ুষ্মান ভারত - প্রধানমন্ত্রী জন আরোগ্য যোজনা'
  },
  'Assistance to General Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories': {
    hi: 'सहायक उपकरण के साथ सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट की स्थापना के लिए सामान्य किसानों को सहायता',
    mr: 'अॅक्सेसरीजसह सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट स्थापित करण्यासाठी सामान्य शेतकऱ्यांना सहाय्य',
    ta: 'உபகரணங்களுடன் கூடிய சப்மர்சிபிள் / சென்ட்ரிஃபியூகல் மோட்டார் பம்ப்செட்டுகளை நிறுவுவதற்கு பொது விவசாயிகளுக்கு உதவி',
    te: 'ఉపకరణాలతో కూడిన సబ్‌మెర్సిబుల్ / సెంట్రిఫ్యూగల్ మోటార్ పంప్‌సెట్ల ఏర్పాటుకు సాధారణ రైతులకు సహాయం',
    bn: 'আনুষঙ্গিক সরঞ্জামসহ সাবমার্সিবল / সেন্ট্রিফিউগাল মোটর পাম্পসেট স্থাপনের জন্য সাধারণ কৃষকদের সহায়তা'
  },
  'Assistance to Scheduled Caste Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories': {
    hi: 'सहायक उपकरण के साथ सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट की स्थापना के लिए अनुसूचित जाति के किसानों को सहायता',
    mr: 'अॅक्सेसरीजसह सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट स्थापित करण्यासाठी अनुसूचित जातीच्या शेतकऱ्यांना सहाय्य',
    ta: 'உபகரணங்களுடன் கூடிய சப்மர்சிபிள் / சென்ட்ரிஃபியூகல் மோட்டார் பம்ப்செட்டுகளை நிறுவுவதற்கு பட்டியல் சாதி விவசாயிகளுக்கு உதவி',
    te: 'ఉపకరణాలతో కూడిన సబ్‌మెర్సిబుల్ / సెంట్రిఫ్యూగల్ మోటార్ పంప్‌సెట్ల ఏర్పాటుకు ఎస్సీ రైతులకు సహాయం',
    bn: 'আনুষঙ্গিক সরঞ্জামসহ সাবমার্সিবল / সেন্ট্রিফিউগাল মোটর পাম্পসেট স্থাপনের জন্য তপশিলি জাতি কৃষকদের সহায়তা'
  }
};

export const translateSchemeTitle = (title, lang = 'en', dynamicMap = null) => {
  if (!title || lang === 'en') return title || '';

  // 1. Direct match from dynamic translation map if provided
  if (dynamicMap && dynamicMap[title]) {
    return dynamicMap[title];
  }

  // 1b. Check localStorage dynamic translation caches
  try {
    const raw1 = typeof window !== 'undefined' ? localStorage.getItem(`schemesathi_dyn_trans_${lang}`) : null;
    if (raw1) {
      const p1 = JSON.parse(raw1);
      if (p1[title]) return p1[title];
      const trimmed = String(title).trim();
      if (p1[trimmed]) return p1[trimmed];
    }
    const raw2 = typeof window !== 'undefined' ? localStorage.getItem(`schemesathi_translations_${lang}`) : null;
    if (raw2) {
      const p2 = JSON.parse(raw2);
      if (p2[title]) return p2[title];
      const trimmed = String(title).trim();
      if (p2[trimmed]) return p2[trimmed];
    }
  } catch (e) {}

  // 2. Direct match in bundled 100-schemes titles
  const bundledTitles = schemesDataTranslations[lang]?.titles;
  if (bundledTitles) {
    if (bundledTitles[title]) return bundledTitles[title];
    const cleanTitle = String(title).trim();
    if (bundledTitles[cleanTitle]) return bundledTitles[cleanTitle];
    const foundKey = Object.keys(bundledTitles).find(k => k.toLowerCase() === cleanTitle.toLowerCase());
    if (foundKey) return bundledTitles[foundKey];
  }

  // 3. Direct match in KNOWN_SCHEME_TITLES
  if (KNOWN_SCHEME_TITLES[title] && KNOWN_SCHEME_TITLES[title][lang]) {
    return KNOWN_SCHEME_TITLES[title][lang];
  }

  // Case-insensitive match in KNOWN_SCHEME_TITLES
  const foundKey = Object.keys(KNOWN_SCHEME_TITLES).find(k => k.toLowerCase() === title.toLowerCase().trim());
  if (foundKey && KNOWN_SCHEME_TITLES[foundKey][lang]) {
    return KNOWN_SCHEME_TITLES[foundKey][lang];
  }

  // Handle Hank Yarn pattern
  if (/hank yarn|dyes & chemicals|40% subsidy/i.test(title)) {
    return KNOWN_SCHEME_TITLES['40% Subsidy On Hank Yarn, Dyes & Chemicals Scheme'][lang] || title;
  }

  // Handle Pumpset / Tubewell pattern (Scheme 34 & 35)
  if (/pumpset|submersible|centrifugal/i.test(title)) {
    if (/scheduled caste|sc/i.test(title)) {
      return KNOWN_SCHEME_TITLES['Assistance to Scheduled Caste Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories']?.[lang] || title;
    }
    return KNOWN_SCHEME_TITLES['Assistance to General Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories']?.[lang] || title;
  }

  return title;
};

// =========================================================================
// 4. STEP TITLES AND WORKFLOW HEADERS
// =========================================================================
export const STEP_TITLE_TRANSLATIONS = {
  'Application Scrutiny & Verification': {
    hi: 'आवेदन की जांच एवं सत्यापन',
    mr: 'अर्जाची छाननी आणि पडताळणी',
    ta: 'விண்ணப்ப ஆய்வு மற்றும் சரிபார்ப்பு',
    te: 'దరఖాస్తు పరిశీలన మరియు ధృవీకరణ',
    bn: 'আবেদন যাচাই ও পরীক্ষা'
  },
  'All Claims in Complete Shape': {
    hi: 'सभी दावे पूर्ण रूप में प्रस्तुत करना',
    mr: 'सर्व दावे परिपूर्ण स्वरूपात सादर करणे',
    ta: 'அனைத்து கோரிக்கைகளும் முழு வடிவில் சமர்ப்பித்தல்',
    te: 'అన్ని క్లెయిమ్‌లు పూర్తి రూపంలో సమర్పించడం',
    bn: 'সকল দাবি সম্পূর্ণ আকারে জমা দেওয়া'
  },
  'Submit Claims to Assistant Director': {
    hi: 'सहायक निदेशक को दावे प्रस्तुत करें',
    mr: 'सहाय्यक संचालकांकडे दावे सादर करा',
    ta: 'உதவி இயக்குநரிடம் கோரிக்கைகளை சமர்ப்பிக்கவும்',
    te: 'సహాయ డైరెక్టర్‌కు క్లెయిమ్‌లను సమర్పించండి',
    bn: 'সহকারী পরিচালকের কাছে দাবি জমা দিন'
  },
  'Portal Login & Authentication': {
    hi: 'पोर्टल लॉगिन एवं प्रमाणीकरण',
    mr: 'पोर्टल लॉगिन आणि प्रमाणीकरण',
    ta: 'போர்டல் உள்நுழைவு மற்றும் அங்கீகாரம்',
    te: 'పోర్టల్ లాగిన్ మరియు ప్రామాణీకరణ',
    bn: 'পোর্টাল লগইন এবং প্রমাণীকরণ'
  },
  'New Applicant Registration': {
    hi: 'नए आवेदक का पंजीकरण',
    mr: 'नवीन अर्जदार नोंदणी',
    ta: 'புதிய விண்ணப்பதாரர் பதிவு',
    te: 'కొత్త దరఖాస్తుదారు నమోదు',
    bn: 'নতুন আবেদনকারীর নিবন্ধন'
  },
  'Fill Personal & Applicant Details': {
    hi: 'व्यक्तिगत एवं आवेदक का विवरण भरें',
    mr: 'वैयक्तिक आणि अर्जदाराचा तपशील भरा',
    ta: 'தனிப்பட்ட மற்றும் விண்ணப்பதாரர் விவரங்களை நிரப்பவும்',
    te: 'వ్యక్తిగత మరియు దరఖాస్తుదారు వివరాలను పూరించండి',
    bn: 'ব্যক্তিগত ও আবেদনকারীর বিবরণ পূরণ করুন'
  },
  'Upload Supporting Documents': {
    hi: 'सहायक दस्तावेज अपलोड करें',
    mr: 'आवश्यक कागदपत्रे अपलोड करा',
    ta: 'துணை ஆவணங்களை பதிவேற்றவும்',
    te: 'సహాయక పత్రాలను అప్‌లోడ్ చేయండి',
    bn: 'প্রয়োজনীয় নথি আপলোড করুন'
  },
  'Upload Photograph & Documents': {
    hi: 'फोटो और दस्तावेज अपलोड करें',
    mr: 'छायाचित्र आणि कागदपत्रे अपलोड करा',
    ta: 'புகைப்படம் மற்றும் ஆவணங்களை பதிவேற்றவும்',
    te: 'ఫోటో మరియు పత్రాలను అప్‌లోడ్ చేయండి',
    bn: 'ছবি এবং নথি আপলোড করুন'
  },
  'Financial Assistance & Disbursal': {
    hi: 'वित्तीय सहायता एवं संवितरण',
    mr: 'आर्थिक सहाय्य आणि निधी वितरण',
    ta: 'நிதி உதவி மற்றும் வழங்கல்',
    te: 'ఆర్థిక సహాయం మరియు పంపిణీ',
    bn: 'আর্থিক সহায়তা ও বিতরণ'
  },
  'Departmental Register Entry': {
    hi: 'विभागीय रजिस्टर में प्रविष्टि',
    mr: 'विभागीय नोंदवहीत नोंद',
    ta: 'துறை பதிவேடு பதிவு',
    te: 'విభాగ రిజిస్టర్‌లో నమోదు',
    bn: 'বিভাগীয় রেজিস্ট্রারে অন্তর্ভুক্তি'
  },
  'Visit Official Portal & Section': {
    hi: 'आधिकारिक पोर्टल एवं अनुभाग पर जाएं',
    mr: 'अधिकृत पोर्टल आणि विभागाला भेट द्या',
    ta: 'அதிகாரப்பூர்வ போர்டல் மற்றும் பிரிவுக்குச் செல்லவும்',
    te: 'అధికారిక పోర్టల్ మరియు విభాగాన్ని సందర్శించండి',
    bn: 'অফিসিয়াল পোর্টাল ও বিভাগে যান'
  },
  'Fill Application Form Details': {
    hi: 'आवेदन पत्र का विवरण भरें',
    mr: 'अर्ज फॉर्मचा तपशील भरा',
    ta: 'விண்ணப்பப் படிவ விவரங்களை நிரப்பவும்',
    te: 'దరఖాస్తు ఫారమ్ వివరాలను పూరించండి',
    bn: 'আবেদনপত্রের বিবরণ পূরণ করুন'
  },
  'Submit Online Application': {
    hi: 'ऑनलाइन आवेदन जमा करें',
    mr: 'ऑनलाइन अर्ज सादर करा',
    ta: 'ஆன்லைன் விண்ணப்பத்தை சமர்ப்பிக்கவும்',
    te: 'ఆన్‌లైన్ దరఖాస్తును సమర్పించండి',
    bn: 'অনলাইন আবেদন জমা দিন'
  },
  'Submit Application': {
    hi: 'आवेदन जमा करें',
    mr: 'अर्ज सादर करा',
    ta: 'விண்ணப்பத்தை சமர்ப்பிக்கவும்',
    te: 'దరఖాస్తును సమర్పించండి',
    bn: 'আবেদন জমা দিন'
  },
  'Applicant Signature & Declaration': {
    hi: 'आवेदक के हस्ताक्षर और घोषणा',
    mr: 'अर्जदाराची स्वाक्षरी आणि घोषणापत्र',
    ta: 'விண்ணப்பதாரர் கையொப்பம் மற்றும் பிரகடனம்',
    te: 'దరఖాస్తుదారు సంతకం మరియు ప్రకటన',
    bn: 'আবেদনকারীর স্বাক্ষর ও ঘোষণা'
  },
  'Bank & Loan Account Details': {
    hi: 'बैंक और ऋण खाता विवरण',
    mr: 'बँक आणि कर्ज खात्याचा तपशील',
    ta: 'வங்கி மற்றும் கடன் கணக்கு விவரங்கள்',
    te: 'బ్యాంక్ మరియు రుణ ఖాతా వివరాలు',
    bn: 'ব্যাঙ্ক ও ঋণ অ্যাকাউন্টের বিবরণ'
  },
  'Land & Cultivation Details': {
    hi: 'भूमि एवं जोत का विवरण',
    mr: 'जमीन आणि लागवडीचा तपशील',
    ta: 'நிலம் மற்றும் சாகுபடி விவரங்கள்',
    te: 'భూమి మరియు సాగు వివరాలు',
    bn: 'জমি ও চাষের বিবরণ'
  },
  'Beneficiary Eligibility Verification': {
    hi: 'लाभार्थी पात्रता सत्यापन',
    mr: 'लाभार्थी पात्रता पडताळणी',
    ta: 'பயனாளி தகுதி சரிபார்ப்பு',
    te: 'లబ్ధిదారుల అర్హత ధృవీకరణ',
    bn: 'সুবিধাভোগী যোগ্যতা যাচাই'
  },
  'Final Review & Submission': {
    hi: 'अंतिम समीक्षा एवं प्रस्तुतीकरण',
    mr: 'अंतिम पुनरावलोकन आणि अर्ज सादर करणे',
    ta: 'இறுதி மதிப்பாய்வு மற்றும் சமர்ப்பித்தல்',
    te: 'తుది సమీక్ష మరియు సమర్పణ',
    bn: 'চূড়ান্ত পর্যালোচনা ও জমা'
  },
  'Download Application Form': {
    hi: 'आवेदन पत्र डाउनलोड करें',
    mr: 'अर्ज फॉर्म डाउनलोड करा',
    ta: 'விண்ணப்பப் படிவத்தைப் பதிவிறக்கவும்',
    te: 'దరఖాస్తు ఫారమ్‌ను డౌన్‌లోడ్ చేయండి',
    bn: 'আবেদনপত্র ডাউনলোড করুন'
  },
  'Print Application Form / Acknowledgement': {
    hi: 'आवेदन पत्र / पावती प्रिंट करें',
    mr: 'अर्ज फॉर्म / पोचपावती प्रिंट करा',
    ta: 'விண்ணப்பப் படிவம் / ஒப்புகையை அச்சிடவும்',
    te: 'దరఖాస్తు ఫారమ్ / రసీదును ముద్రించండి',
    bn: 'আবেদনপত্র / প্রাপ্তি স্বীকার প্রিন্ট করুন'
  },
  'Obtain Mandatory Permit from Ground Water Authority': {
    hi: 'भूजल प्राधिकरण से अनिवार्य परमिट प्राप्त करें',
    mr: 'भूजल प्राधिकरणाकडून अनिवार्य परवानगी मिळवा',
    ta: 'நிலத்தடி நீர் ஆணையத்திடமிருந்து கட்டாய அனுமதி பெறவும்',
    te: 'భూగర్భ జలాల అథారిటీ నుండి తప్పనిసరి అనుమతి పొందండి',
    bn: 'ভূগর্ভস্থ জল কর্তৃপক্ষের কাছ থেকে বাধ্যতামূলক অনুমতি গ্রহণ করুন'
  },
  'Approach Department or Obtain NOC for Private Machinery': {
    hi: 'विभाग से संपर्क करें या निजी मशीनरी के लिए एनओसी प्राप्त करें',
    mr: 'विभागाशी संपर्क साधा किंवा खाजगी यंत्रसामग्रीसाठी एनओसी मिळवा',
    ta: 'துறையை அணுகவும் அல்லது தனியார் இயந்திரங்களுக்கு என்ஓசி பெறவும்',
    te: 'విభాగాన్ని సంప్రదించండి లేదా ప్రైవేట్ యంత్రాల కోసం ఎన్‌ఓసీ పొందండి',
    bn: 'বিভাগের সাথে যোগাযোগ করুন বা ব্যক্তিগত যন্ত্রপাতির জন্য এনওসি নিন'
  },
  'Tubewell Construction and Field Inspection': {
    hi: 'नलकूप निर्माण एवं स्थलीय निरीक्षण',
    mr: 'कूपनलिका बांधकाम आणि क्षेत्रीय पाहणी',
    ta: 'குழாய் கிணறு அமைத்தல் மற்றும் கள ஆய்வு',
    te: 'బోరుబావి నిర్మాణం మరియు క్షేత్రస్థాయి పరిశీలన',
    bn: 'নলকূপ নির্মাণ এবং মাঠ পরিদর্শন'
  },
  'Submit Application Form with Original Vouchers & Affidavits': {
    hi: 'मूल बिल और हलफनामे के साथ आवेदन पत्र जमा करें',
    mr: 'मूळ पावत्या आणि शपथपत्रासह अर्ज सादर करा',
    ta: 'அசல் ரசீதுகள் மற்றும் உறுதிமொழியுடன் விண்ணப்பத்தை சமர்ப்பிக்கவும்',
    te: 'ఒరిజినల్ వోచర్లు మరియు అఫిడవిట్లతో దరఖాస్తును సమర్పించండి',
    bn: 'মূল রসিদ এবং হলফনামাসহ আবেদনপত্র জমা দিন'
  }
};

export const translateStepTitle = (title, lang = 'en') => {
  if (!title || lang === 'en') return title || '';
  if (STEP_TITLE_TRANSLATIONS[title] && STEP_TITLE_TRANSLATIONS[title][lang]) {
    return STEP_TITLE_TRANSLATIONS[title][lang];
  }
  // Try case-insensitive matching
  const found = Object.keys(STEP_TITLE_TRANSLATIONS).find(k => k.toLowerCase() === title.toLowerCase().trim());
  if (found && STEP_TITLE_TRANSLATIONS[found][lang]) {
    return STEP_TITLE_TRANSLATIONS[found][lang];
  }
  return title;
};

// =========================================================================
// 5. TIMELINES & TIME BADGES
// =========================================================================
export const translateTimelineChip = (timeline, lang = 'en') => {
  if (!timeline || lang === 'en') return timeline || '';

  const norm = timeline.trim();

  // "In next 15 days"
  if (/in next (\d+) days/i.test(norm)) {
    const num = norm.match(/in next (\d+) days/i)[1];
    if (lang === 'mr') return `पुढील ${num} दिवसांत`;
    if (lang === 'hi') return `अगले ${num} दिनों में`;
    if (lang === 'ta') return `அடுத்த ${num} நாட்களில்`;
    if (lang === 'te') return `తదుపరి ${num} రోజుల్లో`;
    if (lang === 'bn') return `পরবর্তী ${num} দিনের মধ্যে`;
  }

  // "In 30 days from the end of the Quarter"
  if (/in (\d+) days from the end of the quarter/i.test(norm) || /quarter/i.test(norm)) {
    const num = (norm.match(/(\d+)/) || [null, '30'])[1];
    if (lang === 'mr') return `तिमाही संपल्यापासून ${num} दिवसांत`;
    if (lang === 'hi') return `तिमाही समाप्त होने के ${num} दिनों में`;
    if (lang === 'ta') return `காலாண்டு முடிவடைந்த ${num} நாட்களுக்குள்`;
    if (lang === 'te') return `త్రైమాసికం ముగిసిన ${num} రోజులలోపు`;
    if (lang === 'bn') return `ত্রৈমাসিক শেষ হওয়ার ${num} দিনের মধ্যে`;
  }

  // "Within 15 days" / "Within 30 days"
  if (/within (\d+) days/i.test(norm)) {
    const num = norm.match(/within (\d+) days/i)[1];
    if (lang === 'mr') return `${num} दिवसांच्या आत`;
    if (lang === 'hi') return `${num} दिनों के भीतर`;
    if (lang === 'ta') return `${num} நாட்களுக்குள்`;
    if (lang === 'te') return `${num} రోజులలోపు`;
    if (lang === 'bn') return `${num} দিনের মধ্যে`;
  }

  return timeline;
};

// =========================================================================
// 6. DOCUMENT NAMES
// =========================================================================
export const DOCUMENT_TRANSLATIONS = {
  'Aadhaar Card': {
    hi: 'आधार कार्ड',
    mr: 'आधार कार्ड',
    ta: 'ஆதார் அட்டை',
    te: 'ఆధార్ కార్డు',
    bn: 'আধার কার্ড'
  },
  'Income Certificate': {
    hi: 'आय प्रमाण पत्र (सक्षम प्राधिकारी द्वारा जारी)',
    mr: 'उत्पन्नाचा दाखला (तहसीलदार / सक्षम महसूल अधिकारी)',
    ta: 'வருமானச் சான்றிதழ்',
    te: 'ఆదాయ ధృవీకరణ పత్రం',
    bn: 'আয়ের প্রশংসাপত্র'
  },
  'Caste Certificate': {
    hi: 'जाति प्रमाण पत्र (यदि लागू हो)',
    mr: 'जातीचा दाखला (लागू असल्यास)',
    ta: 'சாதிச் சான்றிதழ்',
    te: 'కుల ధృవీకరణ పత్రం',
    bn: 'জাতি প্রশংসাপত্র'
  },
  'Bank Passbook': {
    hi: 'बैंक पासबुक (IFSC कोड और आधार लिंक सहित)',
    mr: 'बँक पासबुक (IFSC कोड आणि आधार जोडणीसह)',
    ta: 'வங்கி பாஸ்புக் (IFSC குறியீட்டுடன்)',
    te: 'బ్యాంక్ పాస్‌బుక్ (IFSC కోడ్‌తో)',
    bn: 'ব্যাঙ্ক পাসবুক (IFSC কোড সহ)'
  },
  'Domicile Certificate': {
    hi: 'मूल निवास / अधिवास प्रमाण पत्र',
    mr: 'अधिवास / रहिवासी दाखला (डोमिसाईल)',
    ta: 'இருப்பிடச் சான்றிதழ்',
    te: 'నివాస ధృవీకరణ పత్రం',
    bn: 'বাসস্থান প্রশংসাপত্র'
  },
  'Passport Size Photograph': {
    hi: 'पासपोर्ट आकार का फोटो',
    mr: 'पासपोर्ट आकाराचे छायाचित्र',
    ta: 'பாஸ்போர்ட் அளவு புகைப்படம்',
    te: 'పాస్‌పోర్ట్ సైజు ఫోటో',
    bn: 'পাসপোর্ট সাইজের ছবি'
  },
  'Ration Card': {
    hi: 'राशन कार्ड',
    mr: 'रेशन कार्ड',
    ta: 'ரேஷன் அட்டை',
    te: 'రేషన్ కార్డు',
    bn: 'রেশন কার্ড'
  },
  'Land Ownership Record (7/12 extract)': {
    hi: 'भूमि स्वामित्व अभिलेख (खतौनी / 7/12)',
    mr: 'जमीन मालकी नोंद (७/१२ आणि ८-अ उतारा)',
    ta: 'நில உரிமை ஆவணம் (பட்டா / சிட்டா)',
    te: 'భూమి యాజమాన్య రికార్డు (పట్టాదారు పాస్‌బుక్)',
    bn: 'জমির খতিয়ান ও রেকর্ড'
  },
  'Cooperative Society Registration Certificate': {
    hi: 'सहकारी समिति पंजीकरण प्रमाण पत्र',
    mr: 'सहकारी संस्था नोंदणी प्रमाणपत्र',
    ta: 'கூட்டுறவு சங்கப் பதிவுச் சான்றிதழ்',
    te: 'సహకార సంఘం రిజిస్ట్రేషన్ సర్టిఫికేట్',
    bn: 'সমবায় সমিতি নিবন্ধন শংসাপত্র'
  },
  'Artisan / Weaver Identity Card': {
    hi: 'कारीगर / बुनकर पहचान पत्र (पहचान कार्ड)',
    mr: 'कारागीर / विणकर ओळखपत्र (पहचान कार्ड)',
    ta: 'கைவினைஞர் / நெசவாளர் அடையாள அட்டை',
    te: 'చేనేత కార్మికుల గుర్తింపు కార్డు',
    bn: 'তাঁতি / কারিগর পরিচয়পত্র'
  },
  'Land Ownership Record (Deputy Tahsildar / Title Deed)': {
    hi: 'भूमि स्वामित्व प्रमाण पत्र (नायब तहसीलदार द्वारा जारी) और पंजीकरण प्रमाण पत्र',
    mr: 'जमीन मालकी हक्क दाखला (नायब तहसीलदार किंवा सक्षम महसूल अधिकारी) व नोंदणी प्रमाणपत्र',
    ta: 'நில உரிமைச் சான்றிதழ் மற்றும் பதிவுச் சான்றிதழ்',
    te: 'భూ యాజమాన్య ధృవీకరణ పత్రం మరియు రిజిస్ట్రేషన్ సర్టిఫికేట్',
    bn: 'জমির মালিকানা শংসাপত্র ও নিবন্ধন শংসাপত্র'
  },
  'Ground Water Authority Permit & Energisation Certificate': {
    hi: 'भूजल प्राधिकरण से प्राप्त अनिवार्य परमिट और ऊर्जाकरण प्रमाण पत्र',
    mr: 'भूजल प्राधिकरणाचे अधिकृत परवानगी पत्र (Permit) आणि ऊर्जा जोडणी प्रमाणपत्र (Energisation Certificate)',
    ta: 'நிலத்தடி நீர் ஆணைய அனுமதி மற்றும் மின் இணைப்புச் சான்றிதழ்',
    te: 'భూగర్భ జలాల అథారిటీ పర్మిట్ మరియు ఎనర్జైజేషన్ సర్టిఫికేట్',
    bn: 'ভূগর্ভস্থ জল কর্তৃপক্ষের পারমিট এবং বিদ্যুতায়ন শংসাপত্র'
  },
  'Tubewell Construction Expense Vouchers & Bank Certificate': {
    hi: 'नलकूप निर्माण खर्च के मूल बिल अथवा बैंक ऋण की प्रमाणित प्रति एवं बैंक प्रमाण पत्र',
    mr: 'कूपनलिका / उपकरण खर्चाची मूळ बिले किंवा बँक कर्जाची साक्षांकित प्रत आणि बँक प्रमाणपत्र',
    ta: 'கட்டுமானச் செலவுகளுக்கான அசல் பில்கள் அல்லது வங்கிக் கடன் சான்றிதழ்',
    te: 'నిర్మాణ ఖర్చుల ఒరిజినల్ బిల్లులు లేదా బ్యాంక్ రుణ ధృవీకరణ పత్రం',
    bn: 'নির্মাণ ব্যয়ের মূল বিল বা ব্যাঙ্ক ঋণের সত্যায়িত অনুলিপি'
  },
  'Farmer Identity Card & Notary Affidavit': {
    hi: 'किसान पहचान पत्र और नोटरी पब्लिक के समक्ष हस्ताक्षरित शपथ पत्र (हलफनामा)',
    mr: 'शेतकरी ओळखपत्र (Farmer ID) आणि नोटरी पब्लिकसमोर केलेले शपथपत्र (Affidavit)',
    ta: 'விவசாயி அடையாள அட்டை மற்றும் நோட்டரி உறுதிமொழிப் பத்திரம்',
    te: 'రైతు గుర్తింపు కార్డు మరియు నోటరీ అఫిడవిట్',
    bn: 'কৃষক পরিচয়পত্র এবং নোটারি পাবলিক হলফনামা'
  }
};

export const translateDocumentName = (doc, lang = 'en') => {
  if (!doc || lang === 'en') return doc || '';
  
  if (DOCUMENT_TRANSLATIONS[doc] && DOCUMENT_TRANSLATIONS[doc][lang]) {
    return DOCUMENT_TRANSLATIONS[doc][lang];
  }

  const lower = doc.toLowerCase();

  // Specific checks FIRST before generic single-word checks
  if (lower.includes('tahsildar') || lower.includes('ownership of the land')) {
    return DOCUMENT_TRANSLATIONS['Land Ownership Record (Deputy Tahsildar / Title Deed)']?.[lang] || doc;
  }
  if (lower.includes('permit') || lower.includes('energisation') || lower.includes('ground water')) {
    return DOCUMENT_TRANSLATIONS['Ground Water Authority Permit & Energisation Certificate']?.[lang] || doc;
  }
  if ((lower.includes('bill') || lower.includes('voucher') || lower.includes('expenses')) && (lower.includes('tubewell') || lower.includes('loan') || lower.includes('bank'))) {
    return DOCUMENT_TRANSLATIONS['Tubewell Construction Expense Vouchers & Bank Certificate']?.[lang] || doc;
  }
  if (lower.includes('farmers identity') || (lower.includes('affidavit') && lower.includes('notary')) || lower.includes('possession')) {
    return DOCUMENT_TRANSLATIONS['Farmer Identity Card & Notary Affidavit']?.[lang] || doc;
  }

  // Generic checks with word boundaries (ensure 'registration' doesn't trigger 'ration')
  if (/\baadhaar\b/i.test(doc)) return DOCUMENT_TRANSLATIONS['Aadhaar Card'][lang] || doc;
  if (/\bincome\b/i.test(doc)) return DOCUMENT_TRANSLATIONS['Income Certificate'][lang] || doc;
  if (/\bcaste\b/i.test(doc)) return DOCUMENT_TRANSLATIONS['Caste Certificate'][lang] || doc;
  if (/\bpassbook\b/i.test(doc) || (lower.includes('bank') && lower.includes('account'))) {
    return DOCUMENT_TRANSLATIONS['Bank Passbook'][lang] || doc;
  }
  if (/\bdomicile\b/i.test(doc) || /\bresidence\b/i.test(doc)) return DOCUMENT_TRANSLATIONS['Domicile Certificate'][lang] || doc;
  if (/\bphoto\b/i.test(doc) || /\bphotograph\b/i.test(doc)) return DOCUMENT_TRANSLATIONS['Passport Size Photograph'][lang] || doc;
  if (/\bration\s+card\b|\bration\b/i.test(doc) && !/\bregistration\b/i.test(doc)) {
    return DOCUMENT_TRANSLATIONS['Ration Card'][lang] || doc;
  }
  if (lower.includes('7/12') || /\bland\b/i.test(doc)) return DOCUMENT_TRANSLATIONS['Land Ownership Record (7/12 extract)'][lang] || doc;
  if (lower.includes('cooperative') || lower.includes('society')) return DOCUMENT_TRANSLATIONS['Cooperative Society Registration Certificate'][lang] || doc;
  if (lower.includes('weaver') || lower.includes('artisan') || lower.includes('identity card')) {
    return DOCUMENT_TRANSLATIONS['Artisan / Weaver Identity Card'][lang] || doc;
  }

  return doc;
};

// =========================================================================
// 7. KNOWN DETAILED PARAGRAPHS & STEP DESCRIPTIONS (Hank Yarn, Pumpsets and Common DB Schemes)
// =========================================================================
export const KNOWN_PARAGRAPHS = {
  // Scheme 34 / 35 - Benefits
  '65% subsidy towards the installation of suitable Submersible / Centrifugal motor pump sets with accessories, subject to a maximum of ₹50,000/" per tubewell per individual.': {
    hi: 'उपयुक्त सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंप सेट और सहायक उपकरण की स्थापना के लिए 65% सब्सिडी, प्रति व्यक्ति प्रति नलकूप अधिकतम ₹50,000/- तक।',
    mr: 'योग्य सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट आणि सुटे भाग बसवण्यासाठी ६५% सबसिडी, प्रति शेतकरी प्रति कूपनलिका कमाल ₹५०,०००/- मर्यादेपर्यंत.',
    ta: 'உபகரணங்களுடன் கூடிய பொருத்தமான சப்மர்சிபிள் / சென்ட்ரிஃபியூகல் மோட்டார் பம்ப்செட்டுகளை நிறுவுவதற்கு 65% மானியம், ஒரு நபருக்கு ஒரு ஆழ்துளை கிணற்றுக்கு அதிகபட்சமாக ₹50,000/- வரை.',
    te: 'ఉపకరణాలతో తగిన సబ్‌మెర్సిబుల్ / సెంట్రిఫ్యూగల్ మోటార్ పంప్‌సెట్ల ఏర్పాటుకు 65% సబ్సిడీ, ఒక వ్యక్తికి ఒక బోరుబావికి గరిష్టంగా ₹50,000/- వరకు.',
    bn: 'আনুষঙ্গিক সরঞ্জামসহ উপযুক্ত সাবমার্সিবল / সেন্ট্রিফিউগাল মোটর পাম্পসেট স্থাপনের জন্য ৬৫% ভর্তুকি, প্রতি ব্যক্তি প্রতি নলকূপে সর্বোচ্চ ৫০,০০০ টাকা পর্যন্ত।'
  },
  'The subsidy amount shall be released through the Electronic Clearing System (ECS) if the applicant has undertaken the construction with his/her funds.': {
    hi: 'यदि आवेदक ने अपने स्वयं के धन से निर्माण किया है, तो सब्सिडी राशि इलेक्ट्रॉनिक क्लियरिंग सिस्टम (ईसीएस) के माध्यम से जारी की जाएगी।',
    mr: 'अर्जदाराने स्वतःच्या पैशांतून बांधकाम केले असल्यास सबसिडीची रक्कम इलेक्ट्रॉनिक क्लिअरिंग सिस्टीम (ECS) द्वारे जमा केली जाईल.',
    ta: 'விண்ணப்பதாரர் தனது சொந்த நிதியில் கட்டுமானப் பணிகளை மேற்கொண்டிருந்தால், மானியத் தொகை மின்னணு தீர்வு முறை (ECS) மூலம் விடுவிக்கப்படும்.',
    te: 'దరఖాస్తుదారు తన స్వంత నిధులతో నిర్మాణం చేపట్టినట్లయితే, సబ్సిడీ మొత్తం ఎలక్ట్రానిక్ క్లియరింగ్ సిస్టమ్ (ECS) ద్వారా విడుదల చేయబడుతుంది.',
    bn: 'আবেদনকারী নিজস্ব অর্থায়নে নির্মাণ কাজ সম্পাদন করলে ভর্তুকির অর্থ ইলেকট্রনিক ক্লিয়ারিং সিস্টেম (ইসিএস) এর মাধ্যমে প্রদান করা হবে।'
  },
  'In case, he/she has availed himself/herself loan from the Nationalized Bank / Co"operative Bank towards the construction of the tubewell, the subsidy amount shall be remitted to the Bank against the loan account of the beneficiary.': {
    hi: 'नलकूप निर्माण के लिए राष्ट्रीयकृत बैंक / सहकारी बैंक से ऋण लेने की स्थिति में, सब्सिडी राशि लाभार्थी के ऋण खाते में सीधे बैंक को भेजी जाएगी।',
    mr: 'कूपनलिकेच्या बांधकामासाठी राष्ट्रीयीकृत बँक / सहकारी बँकेकडून कर्ज घेतले असल्यास, सबसिडीची रक्कम थेट लाभार्थ्याच्या बँक कर्ज खात्यात जमा केली जाईल.',
    ta: 'ஆழ்துளை கிணறு அமைப்பதற்காக தேசியமயமாக்கப்பட்ட வங்கி / கூட்டுறவு வங்கியில் கடன் பெற்றிருந்தால், மானியத் தொகை பயனாளியின் கடன் கணக்கிற்கு வங்கியில் வரவு வைக்கப்படும்.',
    te: 'బోరుబావి నిర్మాణం కోసం జాతీయం చేయబడిన బ్యాంక్ / సహకార బ్యాంక్ నుండి రుణం పొందినట్లయితే, సబ్సిడీ మొత్తం లబ్ధిదారుని రుణ ఖాతాకు బ్యాంకుకు జమ చేయబడుతుంది.',
    bn: 'নলকূপ নির্মাণের জন্য জাতীয়করণকৃত ব্যাঙ্ক / সমবায় ব্যাঙ্ক থেকে ঋণ নিলে, ভর্তুকির অর্থ সরাসরি সুবিধাভোগীর ঋণ অ্যাকাউন্টে জমা হবে।'
  },
  // Scheme 34 / 35 - Eligibility
  'The applicant should be from the General Category.': {
    hi: 'आवेदक सामान्य वर्ग (General Category) से होना चाहिए।',
    mr: 'अर्जदार हा सर्वसाधारण प्रवर्गातील (General Category) असणे आवश्यक आहे.',
    ta: 'விண்ணப்பதாரர் பொதுப் பிரிவைச் சேர்ந்தவராக இருக்க வேண்டும்.',
    te: 'దరఖాస్తుదారు జనరల్ కేటగిరీకి చెందినవారై ఉండాలి.',
    bn: 'আবেদনকারীকে সাধারণ ক্যাটাগরির (General Category) হতে হবে।'
  },
  'The applicant should be from the Scheduled Caste.': {
    hi: 'आवेदक अनुसूचित जाति (Scheduled Caste) से होना चाहिए।',
    mr: 'अर्जदार हा अनुसूचित जाती (Scheduled Caste) प्रवर्गातील असणे आवश्यक आहे.',
    ta: 'விண்ணப்பதாரர் பட்டியல் சாதிப் பிரிவைச் சேர்ந்தவராக இருக்க வேண்டும்.',
    te: 'దరఖాస్తుదారు ఎస్సీ వర్గానికి చెందినవారై ఉండాలి.',
    bn: 'আবেদনকারীকে তপশিলি জাতি ক্যাটাগরির হতে হবে।'
  },
  'The applicant should be a farmer in the Union Territory of Puducherry.': {
    hi: 'आवेदक केंद्र शासित प्रदेश पुडुचेरी का किसान होना चाहिए।',
    mr: 'अर्जदार हा पुद्दुचेरी केंद्रशासित प्रदेशातील शेतकरी असणे आवश्यक आहे.',
    ta: 'விண்ணப்பதாரர் புதுச்சேரி யூனியன் பிரதேசத்தின் விவசாயியாக இருக்க வேண்டும்.',
    te: 'దరఖాస్తుదారు పుదుచ్చేరి కేంద్రపాలిత ప్రాంతంలో రైతు అయి ఉండాలి.',
    bn: 'আবেদনকারীকে পুদুচেরি কেন্দ্রশাসিত অঞ্চলের কৃষক হতে হবে।'
  },
  'The tubewell in which the submersible/centrifugal motor pump sets is going to be erect and should have been registered in Pondicherry Ground Water Authority, Puducherry.': {
    hi: 'जिस नलकूप में सबमर्सिबल/सेंट्रीफ्यूगल मोटर पंप सेट लगाया जाना है, वह पुडुचेरी भूजल प्राधिकरण में पंजीकृत होना चाहिए।',
    mr: 'ज्या कूपनलिकेवर सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंप बसवायचा आहे, ती पॉंडिचेरी भूजल प्राधिकरण (Puducherry) कडे नोंदणीकृत असणे आवश्यक आहे.',
    ta: 'மோட்டார் பம்ப்செட் பொருத்தப்பட உள்ள ஆழ்துளை கிணறு பாண்டிச்சேரி நிலத்தடி நீர் ஆணையத்தில் பதிவு செய்யப்பட்டிருக்க வேண்டும்.',
    te: 'మోటార్ పంప్‌సెట్ ఏర్పాటు చేయబోయే బోరుబావి పాండిచ్చేరి భూగర్భ జలాల అథారిటీలో నమోదై ఉండాలి.',
    bn: 'যে নলকূপে মোটর পাম্পসেট বসানো হবে তা পুদুচেরি ভূগর্ভস্থ জল কর্তৃপক্ষে নিবন্ধিত হতে হবে।'
  },
  'The applicant should hold a minimum of 1.5 acres of land under the command area of the tubewell to be constructed and the applicant should have ownership of the land at least for 2 years and should have a clear ownership title deed in his/her name.': {
    hi: 'प्रस्तावित नलकूप के कमान क्षेत्र में आवेदक के पास कम से कम 1.5 एकड़ भूमि होनी चाहिए और कम से कम 2 वर्षों से स्वामित्व और अपने नाम पर स्पष्ट स्वामित्व विलेख होना चाहिए।',
    mr: 'बांधण्यात येणाऱ्या कूपनलिकेच्या लाभक्षेत्रात अर्जदाराकडे किमान १.५ एकर शेतजमीन असावी आणि अर्जदाराकडे किमान २ वर्षांपासून जमिनीची मालकी व स्वतःच्या नावावर स्पष्ट मालकी हक्क असावा.',
    ta: 'அமைக்கப்படும் ஆழ்துளை கிணற்றின் கீழ் விண்ணப்பதாரருக்கு குறைந்தபட்சம் 1.5 ஏக்கர் நிலம் இருக்க வேண்டும் மற்றும் குறைந்தது 2 ஆண்டுகள் நில உரிமை பெற்றிருக்க வேண்டும்.',
    te: 'బోరుబావి కింద దరఖాస్తుదారునికి కనీసం 1.5 ఎకరాల భూమి ఉండాలి మరియు కనీసం 2 సంవత్సరాల యాజమాన్య హక్కు కలిగి ఉండాలి.',
    bn: 'নলকূপের আওতাভুক্ত এলাকায় আবেদনকারীর কমপক্ষে ১.৫ একর জমি থাকতে হবে এবং কমপক্ষে ২ বছর ধরে নিজস্ব মালিকানা থাকতে হবে।'
  },
  'The eligible land holding of 1.5 acres should be in favour of the applicant farmer or in favour of the spouse or favour of the member of a joint/undivided family.': {
    hi: '1.5 एकड़ की पात्र भूमि जोत आवेदक किसान या जीवनसाथी या संयुक्त/अविभाजित परिवार के सदस्य के पक्ष में होनी चाहिए।',
    mr: '१.५ एकराचे पात्र जमीन धारणा अर्जदार शेतकरी किंवा पती/पत्नी किंवा संयुक्त/अविभक्त कुटुंबातील सदस्याच्या नावावर असणे ग्राह्य धरले जाईल.',
    ta: '1.5 ஏக்கர் நிலம் விண்ணப்பதாரர் அல்லது மனைவி அல்லது கூட்டுக் குடும்ப உறுப்பினரின் பெயரில் இருக்கலாம்.',
    te: '1.5 ఎకరాల అర్హత గల భూమి దరఖాస్తుదారు లేదా జీవిత భాగస్వామి లేదా ఉమ్మడి కుటుంబ సభ్యుని పేరిట ఉండాలి.',
    bn: '১.৫ একর জমি আবেদনকারী কৃষক বা স্বামী/স্ত্রী বা যৌথ পরিবারের সদস্যের নামে হতে পারে।'
  },
  'The farmers who have already availed themselves of the subsidy for the said purpose within 5 years are not entitled to any benefit under this scheme.': {
    hi: 'जिन किसानों ने 5 वर्षों के भीतर इस उद्देश्य के लिए पहले से सब्सिडी का लाभ उठाया है, वे इस योजना के तहत पात्र नहीं हैं।',
    mr: 'ज्या शेतकऱ्यांनी यापूर्वी गेल्या ५ वर्षांत या कारणासाठी सबसिडीचा लाभ घेतला आहे, ते या योजनेखाली पात्र ठरणार नाहीत.',
    ta: 'கடந்த 5 ஆண்டுகளில் இத்திட்டத்தின் கீழ் மானியம் பெற்ற விவசாயிகள் மீண்டும் பயனடைய தகுதியற்றவர்கள்.',
    te: 'గత 5 సంవత్సరాలలో ఈ ప్రయోజనం కోసం ఇప్పటికే సబ్సిడీ పొందిన రైతులు ఈ పథకం క్రింద అర్హులు కారు.',
    bn: 'যেসব কৃষক বিগত ৫ বছরের মধ্যে এই উদ্দেশ্যে ভর্তুকি গ্রহণ করেছেন তারা এই প্রকল্পের আওতায় যোগ্য হবেন না।'
  },
  'The applicant should not convert the lands for a maximum period of 10 years from the date of construction of the tubewell/filter point to any purpose other than agriculture and should execute a bond accordingly.': {
    hi: 'नलकूप निर्माण की तिथि से अधिकतम 10 वर्षों तक भूमि को कृषि के अलावा किसी अन्य उद्देश्य के लिए परिवर्तित नहीं किया जाएगा और इस संबंध में एक बांड निष्पादित करना होगा।',
    mr: 'कूपनलिका बांधल्याच्या तारखेपासून पुढील १० वर्षे शेतीव्यतिरिक्त इतर कोणत्याही कारणासाठी जमिनीचा वापर केला जाणार नाही, असे हमीपत्र (Bond) अर्जदाराने लिहून दिले पाहिजे.',
    ta: 'ஆழ்துளை கிணறு அமைக்கப்பட்ட நாளிலிருந்து 10 ஆண்டுகளுக்கு நிலத்தை விவசாயத்தைத் தவிர வேறு எந்த நோக்கத்திற்கும் மாற்றக்கூடாது என பத்திரம் சமர்ப்பிக்க வேண்டும்.',
    te: 'బోరుబావి నిర్మించిన తేదీ నుండి గరిష్టంగా 10 సంవత్సరాల పాటు భూమిని వ్యవసాయం కాకుండా ఇతర ప్రయోజనాల కోసం మార్చకూడదు మరియు బాండ్ సమర్పించాలి.',
    bn: 'নলকূপ নির্মাণের তারিখ থেকে সর্বোচ্চ ১০ বছর পর্যন্ত কৃষিকাজ ব্যতীত অন্য কোনো উদ্দেশ্যে জমি পরিবর্তন করা যাবে না এবং মুচলেকা দিতে হবে।'
  },
  // Scheme 34 - Application Process Steps
  'The applicant must obtain the mandatory PERMIT for the construction of a new / replacement tubewell from the Pondicherry Ground Water Authority, Puducherry.': {
    hi: 'नए या प्रतिस्थापन नलकूप के निर्माण के लिए आवेदक को पुडुचेरी भूजल प्राधिकरण से अनिवार्य परमिट प्राप्त करना होगा।',
    mr: 'नवीन किंवा बदली कूपनलिकेच्या बांधकामासाठी अर्जदाराने पॉंडिचेरी भूजल प्राधिकरणाकडून अनिवार्य परवानगी (PERMIT) मिळवणे आवश्यक आहे.',
    ta: 'புதிய அல்லது மாற்று ஆழ்துளை கிணறு அமைப்பதற்கு விண்ணப்பதாரர் புதுச்சேரி நிலத்தடி நீர் ஆணையத்திடமிருந்து கட்டாய அனுமதி பெற வேண்டும்.',
    te: 'కొత్త లేదా ప్రత్యామ్నాయ బోరుబావి నిర్మాణం కోసం దరఖాస్తుదారు పుదుచ్చేరి భూగర్భ జలాల అథారిటీ నుండి తప్పనిసరి అనుమతి పొందాలి.',
    bn: 'নতুন বা প্রতিস্থাপন নলকূপ নির্মাণের জন্য আবেদনকারীকে অবশ্যই পুদুচেরি ভূগর্ভস্থ জল কর্তৃপক্ষের কাছ থেকে বাধ্যতামূলক অনুমতি গ্রহণ করতে হবে।'
  },
  'The applicant of the Puducherry region should approach the concerned office towards the construction of the tubewell by deploying departmental machinery. The applicants who want to construct the tubewell through private machinery should approach the concerned office to get NOC.': {
    hi: 'पुडुचेरी क्षेत्र के आवेदकों को विभागीय मशीनरी के माध्यम से नलकूप निर्माण के लिए संबंधित कार्यालय से संपर्क करना चाहिए। निजी मशीनरी से निर्माण कराने वालों को एनओसी प्राप्त करनी होगी।',
    mr: 'पुद्दुचेरी भागातील अर्जदारांनी विभागीय यंत्रसामग्रीद्वारे कूपनलिका बांधण्यासाठी संबंधित कार्यालयाशी संपर्क साधावा. खाजगी यंत्रसामग्रीद्वारे कूपनलिका बांधू इच्छिणाऱ्यांनी ना-हरकत प्रमाणपत्र (NOC) मिळवणे आवश्यक आहे.',
    ta: 'புதுச்சேரி பிராந்திய விண்ணப்பதாரர்கள் துறை ரீதியான இயந்திரங்கள் மூலம் ஆழ்துளை கிணறு அமைக்க அலுவலகத்தை அணுக வேண்டும். தனியார் இயந்திரங்கள் மூலம் அமைக்க விரும்புவோர் தடையில்லாச் சான்றிதழ் (NOC) பெற வேண்டும்.',
    te: 'పుదుచ్చేరి ప్రాంత దరఖాస్తుదారులు శాఖాపరమైన యంత్రాల ద్వారా బోరుబావి నిర్మాణం కోసం సంబంధిత కార్యాలయాన్ని సంప్రదించాలి. ప్రైవేట్ యంత్రాల ద్వారా నిర్మించాలనుకునే వారు ఎన్‌ఓసీ పొందాలి.',
    bn: 'পুদুচেরি অঞ্চলের আবেদনকারীদের বিভাগীয় যন্ত্রপাতির মাধ্যমে নলকূপ নির্মাণের জন্য সংশ্লিষ্ট অফিসের সাথে যোগাযোগ করা উচিত। ব্যক্তিগত যন্ত্রপাতির মাধ্যমে নলকূপ নির্মাণ করতে আগ্রহীদের এনওসি নিতে হবে।'
  },
  'After obtaining NOC, the farmer has to construct a tubewell by deploying private machinery which is registered with Pondicherry Ground Water Authority, Puducherry. Inspection will be conducted by the Agricultural Officer (Engg.) concerned at the time of the construction of the tubewell to ascertain the details of pipes and other materials used.': {
    hi: 'एनओसी प्राप्त करने के बाद, किसान को पुडुचेरी भूजल प्राधिकरण के साथ पंजीकृत निजी मशीनरी के माध्यम से नलकूप का निर्माण करना होगा। पाइप और उपयोग की गई अन्य सामग्रियों के विवरण का पता लगाने के लिए संबंधित कृषि अधिकारी द्वारा निरीक्षण किया जाएगा।',
    mr: 'एनओसी मिळाल्यावर, शेतकऱ्याने पॉंडिचेरी भूजल प्राधिकरणाकडे नोंदणीकृत असलेल्या खाजगी यंत्रसामग्रीद्वारे कूपनलिका बांधावी. वापरलेले पाईप व साहित्याची पडताळणी करण्यासाठी कृषी अधिकारी (अभियांत्रिकी) प्रत्यक्ष पाहणी करतील.',
    ta: 'தடையில்லாச் சான்றிதழ் பெற்ற பிறகு, பதிவு செய்யப்பட்ட தனியார் இயந்திரங்கள் மூலம் ஆழ்துளை கிணறு அமைக்க வேண்டும். பயன்படுத்தப்படும் பொருட்கள் குறித்து வேளாண் பொறியியல் அதிகாரி ஆய்வு செய்வார்.',
    te: 'ఎన్‌ఓసీ పొందిన తర్వాత, రైతు నమోదిత ప్రైవేట్ యంత్రాల ద్వారా బోరుబావిని నిర్మించాలి. ఉపయోగించిన పైపులు మరియు సామగ్రి వివరాలను నిర్ధారించడానికి వ్యవసాయ అధికారి తనిఖీ చేస్తారు.',
    bn: 'এনওসি পাওয়ার পর কৃষককে নিবন্ধিত ব্যক্তিগত যন্ত্রপাতির মাধ্যমে নলকূপ নির্মাণ করতে হবে। ব্যবহৃত পাইপ ও অন্যান্য সামগ্রী যাচাই করতে সংশ্লিষ্ট কৃষি কর্মকর্তা পরিদর্শন করবেন।'
  },
  'In the application form, fill in all the mandatory fields, paste the passport-sized photograph (signed across, if required), and attach copies of all the mandatory documents (self-attest, if required).': {
    hi: 'आवेदन पत्र में सभी अनिवार्य विवरण भरें, पासपोर्ट आकार का फोटो लगाएं और सभी अनिवार्य दस्तावेजों की प्रतियां संलग्न करें।',
    mr: 'अर्ज फॉर्ममधील सर्व आवश्यक रकाने भरा, पासपोर्ट आकाराचे छायाचित्र चिकटवा आणि सर्व आवश्यक कागदपत्रांच्या साक्षांकित प्रती जोडा.',
    ta: 'விண்ணப்பப் படிவத்தில் அனைத்து விவரங்களையும் பூர்த்தி செய்து, புகைப்படத்தை ஒட்டி, தேவையான அனைத்து ஆவண நகல்களையும் இணைக்கவும்.',
    te: 'దరఖాస్తు ఫారమ్‌లోని అన్ని తప్పనిసరి వివరాలను పూరించండి, పాస్‌పోర్ట్ సైజు ఫోటోను అతికించండి మరియు అన్ని పత్రాల కాపీలను జత చేయండి.',
    bn: 'আবেদনপত্রে সমস্ত বাধ্যতামূলক ক্ষেত্র পূরণ করুন, পাসপোর্ট সাইজের ছবি লাগান এবং সমস্ত প্রয়োজনীয় নথির অনুলিপি সংযুক্ত করুন।'
  },
  'Submit the duly filled and signed application form and the documents to the aforementioned authority.': {
    hi: 'विधिवत भरा और हस्ताक्षरित आवेदन पत्र और दस्तावेज पूर्वोक्त प्राधिकारी को जमा करें।',
    mr: 'पूर्ण भरलेला आणि स्वाक्षरी केलेला अर्ज फॉर्म आवश्यक कागदपत्रांसह संबंधित प्राधिकरणाकडे सादर करा.',
    ta: 'முறையாக பூர்த்தி செய்யப்பட்டு கையொப்பமிடப்பட்ட விண்ணப்பப் படிவம் மற்றும் ஆவணங்களை மேற்குறிப்பிட்ட அதிகாரியிடம் சமர்ப்பிக்கவும்.',
    te: 'సక్రమంగా నింపిన మరియు సంతకం చేసిన దరఖాస్తు ఫారమ్ మరియు పత్రాలను పై అధికారికి సమర్పించండి.',
    bn: 'যথাযথভাবে পূরণ করা এবং স্বাক্ষরিত আবেদনপত্র এবং নথিপত্র পূর্বোক্ত কর্তৃপক্ষের কাছে জমা দিন।'
  },
  // Step 1 description
  'The AD(H&T) after scrutiny shall recommend the claims with in next 15 days.': {
    hi: 'सहायक निदेशक (H&T) जांच के बाद अगले 15 दिनों के भीतर दावों की सिफारिश करेंगे।',
    mr: 'सहाय्यक संचालक (H&T) छाननीनंतर पुढील १५ दिवसांच्या आत दाव्यांची शिफारस करतील.',
    ta: 'உதவி இயக்குநர் (H&T) ஆய்வுக்குப் பிறகு அடுத்த 15 நாட்களுக்குள் கோரிக்கைகளைப் பரிந்துரைப்பார்.',
    te: 'సహాయ డైరెక్టర్ (H&T) పరిశీలన తర్వాత తదుపరి 15 రోజుల్లో క్లెయిమ్‌లను సిఫార్సు చేస్తారు.',
    bn: 'সহকারী পরিচালক (H&T) পরীক্ষার পর পরবর্তী ১৫ দিনের মধ্যে দাবিগুলির সুপারিশ করবেন।'
  },
  // Step 2 description
  'All claims in complete shape should reach Head Office with in 30 days from the end of the Quarter.': {
    hi: 'सभी दावे पूर्ण रूप में तिमाही समाप्त होने के 30 दिनों के भीतर प्रधान कार्यालय पहुंचने चाहिए।',
    mr: 'सर्व दावे परिपूर्ण स्वरूपात तिमाही संपल्यापासून ३० दिवसांच्या आत मुख्य कार्यालयात पोहोचले पाहिजेत.',
    ta: 'அனைத்து கோரிக்கைகளும் காலாண்டு முடிவடைந்த 30 நாட்களுக்குள் தலைமை அலுவலகத்தை சென்றடைய வேண்டும்.',
    te: 'అన్ని క్లెయిమ్‌లు త్రైమాసికం ముగిసిన 30 రోజులలోపు ప్రధాన కార్యాలయానికి చేరుకోవాలి.',
    bn: 'সকল দাবি সম্পূর্ণ আকারে ত্রৈমাসিক শেষ হওয়ার ৩০ দিনের মধ্যে প্রধান কার্যালয়ে পৌঁছাতে হবে।'
  },
  // Note
  'Appropriate cut will be imposed on bleated claims.': {
    hi: 'विलंबित दावों पर उचित कटौती लागू की जाएगी।',
    mr: 'विलंबाने सादर केलेल्या दाव्यांवर योग्य कपात लागू केली जाईल.',
    ta: 'தாமதமான கோரிக்கைகளுக்கு உரிய பிடித்தம் விதிக்கப்படும்.',
    te: 'ఆలస్యంగా వచ్చిన క్లెయిమ్‌లపై తగిన కోత విధించబడుతుంది.',
    bn: 'বিলম্বিত দাবির ক্ষেত্রে উপযুক্ত কর্তন ধার্য করা হবে।'
  },
  // Disbursal
  'The amount sanctioned as 40% Yarn subsidy, 75% amount will be credited directly to the members bank account of the concerned primary Weavers Cooperative Societies as production bonus basing on the wages earned by them. The societies may utilize the remaining 25% amount for giving rebate on sales or any other production related purpose with effect from 1st Dec 2016.': {
    hi: '40% यार्न सब्सिडी के रूप में स्वीकृत राशि में से 75% भाग सीधे संबंधित प्राथमिक बुनकर सहकारी समितियों के सदस्यों के बैंक खाते में मजदूरी के आधार पर उत्पादन बोनस के रूप में जमा किया जाएगा। समितियां शेष 25% राशि का उपयोग 1 दिसंबर 2016 से बिक्री पर छूट देने या उत्पादन कार्यों के लिए कर सकती हैं।',
    mr: '४०% यार्न सबसिडी म्हणून मंजूर केलेली रक्कम, ७५% रक्कम थेट संबंधित प्राथमिक विणकर सहकारी संस्थांच्या सदस्यांच्या बँक खात्यात त्यांच्या मजुरीवर आधारित उत्पादन बोनस म्हणून जमा केली जाईल. संस्था उर्वरित २५% रक्कम १ डिसेंबर २०१६ पासून विक्रीवर सूट देण्यासाठी किंवा इतर उत्पादन संबंधित कारणांसाठी वापरू शकतात.',
    ta: '40% நூல் மானியமாக அனுமதிக்கப்பட்ட தொகையில், 75% தொகை தகுதியான முதன்மை நெசவாளர் கூட்டுறவு சங்க உறுப்பினர்களின் வங்கிக் கணக்கில் உற்பத்தி போனஸாக நேரடியாக வரவு வைக்கப்படும். மீதமுள்ள 25% தொகையை சங்கங்கள் தள்ளுபடி அல்லது உற்பத்தி நோக்கங்களுக்காகப் பயன்படுத்தலாம்.',
    te: '40% నూలు సబ్సిడీగా మంజూరు చేసిన మొత్తంలో, 75% మొత్తం ప్రాథమిక చేనేత సహకార సంఘాల సభ్యుల బ్యాంకు ఖాతాలో నేరుగా ఉత్పత్తి బోనస్‌గా జమ చేయబడుతుంది. మిగిలిన 25% మొత్తాన్ని సంఘాలు డిసెంబర్ 1, 2016 నుండి రాయితీ లేదా ఉత్పత్తి ప్రయోజనాల కోసం ఉపయోగించవచ్చు.',
    bn: '৪০% সুতো ভর্তুকি হিসেবে অনুমোদিত অর্থের ৭৫% সরাসরি সংশ্লিষ্ট প্রাথমিক তাঁতি সমবায় সমিতির সদস্যদের ব্যাঙ্ক অ্যাকাউন্টে মজুরির ভিত্তিতে উৎপাদন বোনাস হিসেবে জমা হবে। সমিতিগুলি অবশিষ্ট ২৫% অর্থ ১ ডিসেম্বর ২০১৬ থেকে বিক্রয়ের উপর ছাড় বা উৎপাদন সংশ্লিষ্ট কাজে ব্যবহার করতে পারে।'
  },
  // Application Intro
  'Application:Step 1: The claims for subsidy shall be submitted by the Weavers Cooperative Societies to the Assistant Director (H&T) in the prescribed proforma on quarterly basis during the financial year within 15 days from the end of the respective quarter': {
    hi: 'आवेदन प्रक्रिया: चरण 1: सब्सिडी के दावे बुनकर सहकारी समितियों द्वारा संबंधित तिमाही समाप्त होने के 15 दिनों के भीतर वित्तीय वर्ष के दौरान त्रैमासिक आधार पर निर्धारित प्रारूप में सहायक निदेशक (H&T) को प्रस्तुत किए जाएंगे।',
    mr: 'अर्ज प्रक्रिया: टप्पा १: सबसिडीचे दावे विणकर सहकारी संस्थांनी सहाय्यक संचालक (H&T) यांच्याकडे विहित नमुन्यात आर्थिक वर्षात तिमाही संपल्यापासून १५ दिवसांच्या आत सादर करावेत.',
    ta: 'விண்ணப்ப செயல்முறை: படி 1: மானியத்திற்கான கோரிக்கைகளை நெசவாளர் கூட்டுறவு சங்கங்கள் உதவி இயக்குநரிடம் (H&T) காலாண்டு முடிவடைந்த 15 நாட்களுக்குள் பரிந்துரைக்கப்பட்ட படிவத்தில் சமர்ப்பிக்க வேண்டும்.',
    te: 'దరఖాస్తు ప్రక్రియ: దశ 1: సబ్సిడీ క్లెయిమ్‌లను చేనేత సహకార సంఘాలు సహాయ డైరెక్టర్‌కు (H&T) త్రైమాసికం ముగిసిన 15 రోజుల్లోగా నిర్దేశిత నమూనాలో సమర్పించాలి.',
    bn: 'আবেদন প্রক্রিয়া: ধাপ ১: ভর্তুকির জন্য দাবিগুলি তাঁতি সমবায় সমিতিগুলি কর্তৃক সহকারী পরিচালকের (H&T) কাছে সংশ্লিষ্ট ত্রৈমাসিক শেষ হওয়ার ১৫ দিনের মধ্যে জমা দিতে হবে।'
  }
};

/**
 * Universal Paragraph and Sentence Translator
 */
export const translateSchemeText = (text, lang = 'en', dynamicMap = null) => {
  if (!text || typeof text !== 'string' || lang === 'en') return text;

  const trimmed = text.trim();

  // 0a. Check dynamicMap
  if (dynamicMap && (dynamicMap[text] || dynamicMap[trimmed])) {
    return dynamicMap[text] || dynamicMap[trimmed];
  }

  // 0b. Check localStorage dynamic translation caches
  try {
    const raw1 = typeof window !== 'undefined' ? localStorage.getItem(`schemesathi_dyn_trans_${lang}`) : null;
    if (raw1) {
      const p1 = JSON.parse(raw1);
      if (p1[text]) return p1[text];
      if (p1[trimmed]) return p1[trimmed];
    }
    const raw2 = typeof window !== 'undefined' ? localStorage.getItem(`schemesathi_translations_${lang}`) : null;
    if (raw2) {
      const p2 = JSON.parse(raw2);
      if (p2[text]) return p2[text];
      if (p2[trimmed]) return p2[trimmed];
    }
  } catch (e) {}

  // 1. Direct match in bundled 100-schemes descriptions
  const bundledDescs = schemesDataTranslations[lang]?.descriptions;
  if (bundledDescs) {
    if (bundledDescs[text]) return bundledDescs[text];
    if (bundledDescs[trimmed]) return bundledDescs[trimmed];

    // Handle card text that might have trailing "..." or truncation
    const cleanText = trimmed.replace(/\.{3,}$/, '').trim();
    if (bundledDescs[cleanText]) return bundledDescs[cleanText];

    // Check if cleanText is a prefix of any full description in bundle
    if (cleanText.length >= 25) {
      const foundFullKey = Object.keys(bundledDescs).find(k => k.startsWith(cleanText) || k.toLowerCase().startsWith(cleanText.toLowerCase()));
      if (foundFullKey && bundledDescs[foundFullKey]) {
        return bundledDescs[foundFullKey];
      }
    }
  }

  // 2. Direct match in known paragraphs
  if (KNOWN_PARAGRAPHS[trimmed] && KNOWN_PARAGRAPHS[trimmed][lang]) {
    return KNOWN_PARAGRAPHS[trimmed][lang];
  }

  // 2. Partial / Normalized match in known paragraphs
  for (const [key, transObj] of Object.entries(KNOWN_PARAGRAPHS)) {
    if (transObj[lang]) {
      const cleanKey = key.replace(/[\s\W]+/g, '').toLowerCase();
      const cleanText = trimmed.replace(/[\s\W]+/g, '').toLowerCase();
      if (cleanText === cleanKey || (cleanText.length > 30 && cleanKey.includes(cleanText.slice(0, 40)))) {
        return transObj[lang];
      }
    }
  }

  // 3. Rule-based sentence patterns
  // Pattern: "Important Note: <rest>"
  if (/^important note\s*:\s*/i.test(trimmed)) {
    const rest = trimmed.replace(/^important note\s*:\s*/i, '');
    const translatedRest = translateSchemeText(rest, lang);
    if (lang === 'mr') return `महत्त्वाची नोंद: ${translatedRest}`;
    if (lang === 'hi') return `महत्वपूर्ण नोट: ${translatedRest}`;
    if (lang === 'ta') return `முக்கிய குறிப்பு: ${translatedRest}`;
    if (lang === 'te') return `ముఖ్య గమనిక: ${translatedRest}`;
    if (lang === 'bn') return `গুরুত্বপূর্ণ নোট: ${translatedRest}`;
  }

  // Pattern: "Disbursal Details: <rest>"
  if (/^disbursal details\s*:\s*/i.test(trimmed)) {
    const rest = trimmed.replace(/^disbursal details\s*:\s*/i, '');
    const translatedRest = translateSchemeText(rest, lang);
    if (lang === 'mr') return `वितरण तपशील: ${translatedRest}`;
    if (lang === 'hi') return `वितरण विवरण: ${translatedRest}`;
    if (lang === 'ta') return `வழங்கல் விவரங்கள்: ${translatedRest}`;
    if (lang === 'te') return `పంపిణీ వివరాలు: ${translatedRest}`;
    if (lang === 'bn') return `বিতরণ বিবরণ: ${translatedRest}`;
  }

  // Pattern: "Target Beneficiaries: <rest>"
  if (/^target beneficiaries\s*:\s*/i.test(trimmed)) {
    const rest = trimmed.replace(/^target beneficiaries\s*:\s*/i, '');
    if (/weavers?|handloom|societies|cooperative|artisan/i.test(rest)) {
      if (lang === 'mr') return 'लक्षित लाभार्थी: प्राथमिक हातमाग विणकर सहकारी संस्था आणि सक्रिय वस्त्रोद्योगात गुंतलेले नोंदणीकृत कारागीर सदस्य.';
      if (lang === 'hi') return 'लक्षित लाभार्थी: प्राथमिक हथकरघा बुनकर सहकारी समितियां और सक्रिय वस्त्र उत्पादन में लगे पंजीकृत कारीगर सदस्य।';
      if (lang === 'ta') return 'பயனாளிகள்: முதன்மை கைத்தறி நெசவாளர் கூட்டுறவு சங்கங்கள் மற்றும் பதிவுசெய்யப்பட்ட கைவினைஞர்கள்.';
      if (lang === 'te') return 'లబ్ధిదారులు: ప్రాథమిక చేనేత సహకార సంఘాలు మరియు నమోదిత చేతివృత్తుల సభ్యులు.';
      if (lang === 'bn') return 'সুবিধাভোগী: প্রাথমিক তাঁতি সমবায় সমিতি এবং নিবন্ধিত কারিগর সদস্য।';
    }
    if (/farmer|agricultural|kisan/i.test(rest)) {
      if (lang === 'mr') return 'लक्षित लाभार्थी: शेतकरी, प्राथमिक कृषी पतसंस्था (PACS), कृषी-उद्योजक आणि शेतकरी उत्पादक संस्था (FPOs).';
      if (lang === 'hi') return 'लक्षित लाभार्थी: किसान, प्राथमिक कृषि ऋण समितियां (PACS), कृषि-उद्यमी और किसान उत्पादक संगठन (FPO)।';
      if (lang === 'ta') return 'பயனாளிகள்: விவசாயிகள், தொடக்க வேளாண்மைக் கடன் சங்கங்கள் மற்றும் விவசாய உற்பத்தியாளர் அமைப்புகள்.';
      if (lang === 'te') return 'లబ్ధిదారులు: రైతులు, ప్రాథమిక వ్యవసాయ పరపతి సంఘాలు (PACS) మరియు రైతు ఉత్పత్తిదారుల సంస్థలు (FPO).';
      if (lang === 'bn') return 'সুবিধাভোগী: কৃষক, প্রাথমিক কৃষি ঋণ সমিতি (PACS) এবং কৃষক উৎপাদক সংস্থা (FPO)।';
    }
    if (/student|scholarship|education/i.test(rest)) {
      if (lang === 'mr') return 'लक्षित लाभार्थी: मान्यताप्राप्त शैक्षणिक किंवा तांत्रिक शिक्षण घेणारे विद्यार्थी आणि तरुण.';
      if (lang === 'hi') return 'लक्षित लाभार्थी: मान्यता प्राप्त शैक्षणिक या तकनीकी शिक्षा प्राप्त कर रहे नामांकित छात्र और युवा।';
      if (lang === 'ta') return 'பயனாளிகள்: அங்கீகரிக்கப்பட்ட கல்வி பயிலும் மாணவர்கள் மற்றும் இளைஞர்கள்.';
      if (lang === 'te') return 'లబ్ధిదారులు: గుర్తింపు పొందిన విద్యను అభ్యసిస్తున్న విద్యార్థులు మరియు యువత.';
      if (lang === 'bn') return 'সুবিধাভোগী: স্বীকৃত শিক্ষাপ্রতিষ্ঠানে অধ্যয়নরত ছাত্রছাত্রী ও যুবক।';
    }
    if (lang === 'mr') return `लक्षित लाभार्थी: ${rest}`;
    if (lang === 'hi') return `लक्षित लाभार्थी: ${rest}`;
  }

  // Pattern: "Application & Governance: <rest>"
  if (/^application & governance\s*:\s*/i.test(trimmed)) {
    if (lang === 'mr') return 'अर्ज व प्रशासन: पारदर्शक पडताळणीसह व्यवस्थापित, पात्र अर्जदारांना थेट आणि जबाबदार लाभ वितरण सुनिश्चित करते.';
    if (lang === 'hi') return 'आवेदन और प्रशासन: पारदर्शी सत्यापन के साथ प्रबंधित, पात्र आवेदकों को सीधा और जवाबदेह लाभ वितरण सुनिश्चित करता है।';
    if (lang === 'ta') return 'விண்ணப்பம் மற்றும் நிர்வாகம்: வெளிப்படையான சரிபார்ப்புடன் நிர்வகிக்கப்பட்டு, நேரடி பயன் வழங்கல் உறுதி செய்யப்படுகிறது.';
    if (lang === 'te') return 'దరఖాస్తు మరియు పరిపాలన: పారదర్శక ధృవీకరణతో నిర్వహించబడుతుంది, అర్హులైన వారికి ప్రత్యక్ష ప్రయోజనం అందుతుంది.';
    if (lang === 'bn') return 'আবেদন ও প্রশাসন: স্বচ্ছ যাচাইকরণের মাধ্যমে পরিচালিত, যোগ্য আবেদনকারীদের সরাসরি সুবিধা প্রদান নিশ্চিত করে।';
  }

  // Default return text
  return text;
};

// =========================================================================
// 8. DYNAMIC "ABOUT THE SCHEME" BULLET GENERATOR
// =========================================================================
export const generateLocalizedAboutBullets = (schemeObj, benefitsDataObj, lang = 'en') => {
  if (!schemeObj) return [];

  const rawDesc = typeof schemeObj.description === 'string' ? schemeObj.description.trim() : '';
  const rawBenefits = benefitsDataObj?.raw ? benefitsDataObj.raw.trim() : '';
  const catName = schemeObj.category?.name || schemeObj.category || 'Social Welfare';
  const ministry = schemeObj.ministry || schemeObj.ministry_department || 'Government of India';
  const isCentral = (schemeObj.govt_level || '').toUpperCase() === 'CENTRAL';
  const govtLevel = isCentral ? 'Central Government' : `${schemeObj.state || 'State'} Government`;
  const appMode = schemeObj.application_mode || 'Online';

  // Translate entities
  const localizedSchemeName = translateSchemeTitle(schemeObj.name, lang);
  const localizedMinistry = translateAuthorityName(ministry, lang);
  const localizedState = translateStateName(schemeObj.state, lang);

  // Check if description is missing or duplicate
  const isDuplicate = !rawDesc || (
    rawBenefits && (
      rawDesc.toLowerCase().replace(/[\s\W]+/g, '') === rawBenefits.toLowerCase().replace(/[\s\W]+/g, '') ||
      (rawDesc.length > 25 && rawBenefits.includes(rawDesc.slice(0, 35)))
    )
  );

  if (!isDuplicate && rawDesc.length > 20 && lang === 'en') {
    return [rawDesc];
  }

  const catLower = String(catName).toLowerCase();
  const nameLower = (schemeObj.name || '').toLowerCase();

  let purpose = '';
  let target = '';
  let governance = '';

  if (lang === 'mr') {
    if (catLower.includes('weav') || nameLower.includes('yarn') || nameLower.includes('textile') || nameLower.includes('subsidy')) {
      purpose = `${localizedSchemeName} ही ${localizedMinistry} अंतर्गत विणकर आणि सहकारी संस्थांना कच्च्या मालाच्या खर्चात सबसिडी देऊन देशांतर्गत हातमाग उत्पादनाला चालना देणारी एक महत्त्वाची औद्योगिक कल्याणकारी योजना आहे.`;
      target = 'लक्षित लाभार्थी: प्राथमिक हातमाग विणकर सहकारी संस्था आणि सक्रिय वस्त्रोद्योगात गुंतलेले नोंदणीकृत कारागीर सदस्य.';
    } else if (catLower.includes('agri') || catLower.includes('farm') || nameLower.includes('kisan')) {
      purpose = `${localizedSchemeName} हा ${localizedMinistry} अंतर्गत शेतकऱ्यांना थेट आर्थिक सुरक्षा, आधुनिक पायाभूत सुविधा आणि सबसिडी देण्यासाठी सुरू केलेला कृषी सहाय्य कार्यक्रम आहे.`;
      target = 'लक्षित लाभार्थी: शेतकरी, प्राथमिक कृषी पतसंस्था (PACS), कृषी-उद्योजक आणि शेतकरी उत्पादक संस्था (FPOs).';
    } else if (catLower.includes('educat') || catLower.includes('scholar') || nameLower.includes('scholarship')) {
      purpose = `${localizedSchemeName} हा ${localizedMinistry} द्वारे पात्र विद्यार्थ्यांना उच्च, तांत्रिक आणि व्यावसायिक शिक्षण पूर्ण करण्यासाठी थेट आर्थिक सहाय्य देणारा शैक्षणिक उपक्रम आहे.`;
      target = 'लक्षित लाभार्थी: मान्यताप्राप्त शाळा, महाविद्यालये किंवा विद्यापीठांमध्ये शिक्षण घेणारे पात्र विद्यार्थी.';
    } else if (catLower.includes('women') || catLower.includes('child') || nameLower.includes('women')) {
      purpose = `${localizedSchemeName} हा ${localizedMinistry} अंतर्गत महिलांचे सामाजिक व आर्थिक सक्षमीकरण आणि स्वावलंबन वाढवण्यासाठी राबवला जाणारा विशेष कल्याणकारी कार्यक्रम आहे.`;
      target = 'लक्षित लाभार्थी: कष्टकरी महिला, स्वयंरोजगार महिला आणि महिलांच्या नेतृत्वाखालील कुटुंबे.';
    } else if (catLower.includes('health') || catLower.includes('arogya') || nameLower.includes('health') || nameLower.includes('bima')) {
      purpose = `${localizedSchemeName} हा ${localizedMinistry} अंतर्गत नागरिकांना मोफत व दर्जेदार आरोग्य उपचार आणि वैद्यकीय सहाय्य देणारा आरोग्य उपक्रम आहे.`;
      target = 'लक्षित लाभार्थी: पात्र नागरिक, दुर्बल घटक आणि आर्थिकदृष्ट्या दुर्बल कुटुंबे.';
    } else {
      purpose = `${localizedSchemeName} हा ${localizedMinistry} अंतर्गत पात्र नागरिकांना थेट आर्थिक आणि सामाजिक सहाय्य देण्यासाठी राबवला जाणारा कल्याणकारी उपक्रम आहे.`;
      target = 'लक्षित लाभार्थी: संबंधित क्षेत्रातील पात्र नागरिक आणि कुटुंब प्रमुख.';
    }
    governance = `अर्ज व प्रशासन: ${appMode === 'Online' ? 'ऑनलाइन' : 'ऑफलाइन'} पद्धतीने पारदर्शक पडताळणीसह व्यवस्थापित, पात्र अर्जदारांना थेट आणि जबाबदार लाभ वितरण सुनिश्चित करते.`;
  } else if (lang === 'hi') {
    if (catLower.includes('weav') || nameLower.includes('yarn') || nameLower.includes('textile') || nameLower.includes('subsidy')) {
      purpose = `${localizedSchemeName} ${localizedMinistry} के तहत बुनकरों और सहकारी समितियों को कच्चे माल की लागत पर सब्सिडी देकर घरेलू हथकरघा उत्पादन को बढ़ावा देने के लिए एक औद्योगिक कल्याणकारी योजना है।`;
      target = 'लक्षित लाभार्थी: प्राथमिक हथकरघा बुनकर सहकारी समितियां और सक्रिय वस्त्र उत्पादन में लगे पंजीकृत कारीगर सदस्य।';
    } else if (catLower.includes('agri') || catLower.includes('farm') || nameLower.includes('kisan')) {
      purpose = `${localizedSchemeName} ${localizedMinistry} के तहत किसानों को प्रत्यक्ष वित्तीय सुरक्षा, आधुनिक बुनियादी ढांचा और सब्सिडी प्रदान करने के लिए एक कृषि सहायता कार्यक्रम है।`;
      target = 'लक्षित लाभार्थी: किसान, प्राथमिक कृषि साख समितियां (PACS) और किसान उत्पादक संगठन (FPO)।';
    } else if (catLower.includes('educat') || catLower.includes('scholar') || nameLower.includes('scholarship')) {
      purpose = `${localizedSchemeName} ${localizedMinistry} द्वारा पात्र छात्रों को उच्च, तकनीकी और व्यावसायिक शिक्षा पूरी करने के लिए एक शैक्षणिक वित्तीय सहायता पहल है।`;
      target = 'लक्षित लाभार्थी: मान्यता प्राप्त संस्थानों में नामांकित पात्र छात्र और युवा।';
    } else if (catLower.includes('women') || catLower.includes('child') || nameLower.includes('women')) {
      purpose = `${localizedSchemeName} ${localizedMinistry} के तहत महिलाओं के सामाजिक-आर्थिक कल्याण और आत्मनिर्भरता को आगे बढ़ाने के लिए एक समर्पित सशक्तिकरण कार्यक्रम है।`;
      target = 'लक्षित लाभार्थी: कामकाजी महिलाएं, स्वरोजगार महिला कामगार और महिला नेतृत्व वाले परिवार।';
    } else if (catLower.includes('health') || catLower.includes('arogya') || nameLower.includes('health') || nameLower.includes('bima')) {
      purpose = `${localizedSchemeName} ${localizedMinistry} द्वारा महत्वपूर्ण स्वास्थ्य सेवा कवरेज और चिकित्सा सहायता प्रदान करने वाली एक सार्वजनिक स्वास्थ्य पहल है।`;
      target = 'लक्षित लाभार्थी: पात्र नागरिक और आर्थिक रूप से कमजोर परिवार।';
    } else {
      purpose = `${localizedSchemeName} ${localizedMinistry} द्वारा महत्वपूर्ण वित्तीय और सामाजिक सहायता प्रदान करने के लिए एक कल्याणकारी योजना है।`;
      target = 'लक्षित लाभार्थी: योजना के मानदंडों के अनुसार पात्र नागरिक।';
    }
    governance = `आवेदन और प्रशासन: ${appMode === 'Online' ? 'ऑनलाइन' : 'ऑफ़लाइन'} माध्यम से पारदर्शी सत्यापन के साथ प्रबंधित, पात्र आवेदकों को सीधा और जवाबदेह लाभ वितरण सुनिश्चित करता है।`;
  } else if (lang === 'ta') {
    purpose = `${localizedSchemeName} என்பது ${localizedMinistry} மூலம் நிர்வகிக்கப்படும் ஒரு முக்கியமான மக்கள் நலத் திட்டமாகும்.`;
    target = 'பயனாளிகள்: தகுதியுடைய அனைத்து குடிமக்கள் மற்றும் குடும்பங்கள்.';
    governance = `விண்ணப்பம் & நிர்வாகம்: வெளிப்படையான சரிபார்ப்புடன் நேரடி பயன் வழங்கல் உறுதி செய்யப்படுகிறது.`;
  } else if (lang === 'te') {
    purpose = `${localizedSchemeName} అనేది ${localizedMinistry} ద్వారా అర్హులైన పౌరులకు అందించే సంక్షేమ పథకం.`;
    target = 'లబ్ధిదారులు: అర్హులైన పౌరులు మరియు కుటుంబాలు.';
    governance = `దరఖాస్తు & పరిపాలన: పారదర్శక ధృవీకరణ ద్వారా నేరుగా ప్రయోజనాలు చేకూరడం జరుగుతుంది.`;
  } else if (lang === 'bn') {
    purpose = `${localizedSchemeName} হলো ${localizedMinistry} দ্বারা পরিচালিত একটি গুরুত্বপূর্ণ সরকারি কল্যাণমূলক প্রকল্প।`;
    target = 'সুবিধাভোগী: যোগ্যতা অর্জনকারী নাগরিক ও তাদের পরিবার।';
    governance = `আবেদন ও প্রশাসন: স্বচ্ছ যাচাইকরণের মাধ্যমে যোগ্য আবেদনকারীদের সরাসরি সুবিধা নিশ্চিত করা হয়।`;
  } else {
    // English fallback
    purpose = `${schemeObj.name} is a dedicated ${govtLevel} welfare initiative administered by the ${ministry} to deliver critical financial and social assistance under the ${catName} sector.`;
    if (/weav|yarn|textile|subsidy/i.test(nameLower) || /weav|yarn/i.test(catLower)) {
      purpose = `${schemeObj.name} is an industrial welfare scheme under the ${ministry} to support weavers and cooperative societies by subsidizing raw material costs and boosting domestic handloom production.`;
      target = 'Target Beneficiaries: Primary Handloom Weavers Cooperative Societies and registered artisan members engaged in active textile production.';
    } else {
      target = 'Target Beneficiaries: Eligible citizens and household heads according to government guidelines.';
    }
    governance = `Application & Governance: Managed with end-to-end transparent verification via ${appMode} mode, ensuring direct and accountable delivery of benefits to verified applicants.`;
  }

  return [purpose, target, governance].filter(Boolean);
};
