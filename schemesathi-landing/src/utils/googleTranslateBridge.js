/**
 * Google In-Browser Dynamic Translation Bridge
 * Automatically translates dynamic scheme descriptions and paragraphs
 * while allowing React to handle curated UI tokens seamlessly.
 */

let isScriptLoaded = false;

export const initGoogleTranslate = () => {
  if (typeof window === 'undefined') return;

  // Ensure hidden container exists
  if (!document.getElementById('google_translate_element')) {
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    el.style.display = 'none';
    document.body.appendChild(el);
  }

  // Inject CSS to suppress Google Translate banner and tooltip popups
  if (!document.getElementById('google-translate-custom-styles')) {
    const style = document.createElement('style');
    style.id = 'google-translate-custom-styles';
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate,
      .goog-te-banner-frame,
      #goog-gt-tt,
      .goog-te-balloon-frame {
        display: none !important;
        visibility: hidden !important;
      }
      body {
        top: 0px !important;
        position: static !important;
      }
      .skiptranslate:not(.allowed-skiptranslate) {
        display: none !important;
      }
      .goog-text-highlight {
        background: transparent !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Define global callback if not yet defined
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi,mr,ta,te,bn',
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE
            },
            'google_translate_element'
          );
        }
      } catch (e) {
        console.warn('Google Translate initialization:', e);
      }
    };
  }

  // Inject script once
  if (!isScriptLoaded && !document.getElementById('google-translate-script')) {
    isScriptLoaded = true;
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }
};

/**
 * Trigger in-browser translation to a specific language code ('en', 'hi', 'mr', 'ta', 'te', 'bn')
 */
export const triggerGoogleTranslate = (langCode) => {
  if (typeof window === 'undefined') return;

  const code = langCode || 'en';

  // Set Google Translate cookies
  const domain = window.location.hostname;
  if (code === 'en') {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`;
    document.cookie = `googtrans=/en/en; path=/;`;
    document.cookie = `googtrans=/en/en; domain=${domain}; path=/;`;
  } else {
    document.cookie = `googtrans=/en/${code}; path=/;`;
    document.cookie = `googtrans=/en/${code}; domain=${domain}; path=/;`;
  }

  // Attempt to update the native Google select dropdown if present
  try {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
    }
  } catch (err) {
    console.debug('Google translate combo trigger:', err);
  }
};
