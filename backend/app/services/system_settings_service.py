"""
System Settings Service for SchemeSathi.
Centralized persistence and enforcement for administrative system settings.
Automatically pre-translates any admin announcement into all platform languages.
"""
import os
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from flask import current_app

DEFAULT_SYSTEM_SETTINGS = {
    'allow_citizen_registration': True,
    'allow_citizen_queries': True,
    'auto_broadcast_new_schemes': True,
    'maintenance_mode': False,
    'system_announcement': '',
    'system_announcement_translations': {},
    'default_language': 'en',
    'max_upload_size_mb': 5,
    'session_timeout_hours': 24
}

class SystemSettingsService:
    @staticmethod
    def get_settings_file_path():
        return os.path.join(current_app.instance_path, 'system_settings.json')

    @classmethod
    def generate_announcement_translations(cls, text):
        """Pre-translate any announcement into all 5 vernacular platform languages."""
        if not text or not isinstance(text, str) or not text.strip():
            return {}
        clean = text.strip()
        langs = ['hi', 'mr', 'ta', 'te', 'bn']
        translations = {}

        # 1. Check shared translations_cache.json
        cache_file = os.path.join(current_app.root_path, '..', 'translations_cache.json')
        cache_data = {}
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
            except Exception:
                pass

        missing_langs = []
        for l in langs:
            cached_val = cache_data.get(l, {}).get(clean)
            if cached_val:
                translations[l] = cached_val
            else:
                missing_langs.append(l)

        if not missing_langs:
            return translations

        # 2. Fetch missing languages via Google Translate GTX & MyMemory
        def fetch_lang(lang_code):
            # Try Google Translate GTX single API
            try:
                encoded = urllib.parse.quote(clean[:1500])
                gtx_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={lang_code}&dt=t&q={encoded}"
                req = urllib.request.Request(gtx_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(req, timeout=3) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    if data and data[0]:
                        parts = [p[0] for p in data[0] if p and p[0]]
                        t = ''.join(parts).strip()
                        if t:
                            return lang_code, t
            except Exception:
                pass

            # Fallback to MyMemory API
            try:
                encoded = urllib.parse.quote(clean[:500])
                url = f"https://api.mymemory.translated.net/get?q={encoded}&langpair=en|{lang_code}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(req, timeout=3) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    if data and data.get('responseData') and data['responseData'].get('translatedText'):
                        t = data['responseData']['translatedText'].strip()
                        if not t.startswith('MYMEMORY WARNING'):
                            return lang_code, t
            except Exception:
                pass

            return lang_code, clean

        try:
            with ThreadPoolExecutor(max_workers=5) as executor:
                fetched = dict(executor.map(fetch_lang, missing_langs))
                translations.update(fetched)
        except Exception as e:
            current_app.logger.warning(f"Error fetching translations for announcement: {e}")

        # Update cache_data and save back to translations_cache.json
        try:
            for l, t in translations.items():
                if l not in cache_data:
                    cache_data[l] = {}
                cache_data[l][clean] = t
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

        return translations

    @classmethod
    def get_settings(cls):
        """Load currently persisted system settings or defaults."""
        path = cls.get_settings_file_path()
        settings = dict(DEFAULT_SYSTEM_SETTINGS)
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    saved = json.load(f)
                    if isinstance(saved, dict):
                        settings.update(saved)
            except Exception as e:
                current_app.logger.warning(f"Could not load system_settings.json: {e}")

        # Ensure announcement translations are populated if an announcement exists
        announcement = settings.get('system_announcement', '').strip()
        trans = settings.get('system_announcement_translations') or {}
        target_langs = ['hi', 'mr', 'ta', 'te', 'bn']
        if announcement and (not trans or set(target_langs) - set(trans.keys())):
            new_trans = cls.generate_announcement_translations(announcement)
            settings['system_announcement_translations'] = new_trans
            # Persist back
            try:
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(settings, f, indent=2)
            except Exception:
                pass

        return settings

    @classmethod
    def save_settings(cls, updates):
        """Update and persist system settings with automatic translation generation."""
        current = cls.get_settings()
        allowed_keys = list(DEFAULT_SYSTEM_SETTINGS.keys())
        updated_keys = []
        for k in allowed_keys:
            if k in updates:
                current[k] = updates[k]
                updated_keys.append(k)

        # Automatically translate new or modified announcement
        announcement = current.get('system_announcement', '').strip()
        if announcement:
            trans = cls.generate_announcement_translations(announcement)
            current['system_announcement_translations'] = trans
            if 'system_announcement_translations' not in updated_keys:
                updated_keys.append('system_announcement_translations')
        else:
            current['system_announcement_translations'] = {}

        os.makedirs(current_app.instance_path, exist_ok=True)
        path = cls.get_settings_file_path()
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(current, f, indent=2)

        return current, updated_keys

    @classmethod
    def get_public_settings(cls):
        """Return public-safe settings visible to all unauthenticated & citizen clients."""
        settings = cls.get_settings()
        return {
            'allow_citizen_registration': settings.get('allow_citizen_registration', True),
            'allow_citizen_queries': settings.get('allow_citizen_queries', True),
            'maintenance_mode': settings.get('maintenance_mode', False),
            'system_announcement': settings.get('system_announcement', ''),
            'system_announcement_translations': settings.get('system_announcement_translations', {}),
            'default_language': settings.get('default_language', 'en'),
            'max_upload_size_mb': settings.get('max_upload_size_mb', 5)
        }
