import sys
import os
import json
import urllib.request
import urllib.parse
import time

sys.stdout.reconfigure(encoding='utf-8')

CACHE_FILE = os.path.join(os.path.dirname(__file__), 'translations_cache.json')
cache = {}
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)
    except Exception:
        cache = {}

# Fetch all schemes
url = 'http://127.0.0.1:5000/api/schemes?limit=100'
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode('utf-8'))
    schemes = data.get('data') or data.get('schemes') or []

print(f"Loaded {len(schemes)} schemes.")

languages = ['mr', 'hi', 'ta', 'te', 'bn']

def translate_one(text, lang):
    clean = text.strip()
    if lang not in cache:
        cache[lang] = {}
    if clean in cache[lang]:
        return cache[lang][clean]
    try:
        encoded = urllib.parse.quote(clean[:500])
        api_url = f"https://api.mymemory.translated.net/get?q={encoded}&langpair=en|{lang}"
        r = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(r, timeout=4) as response:
            d = json.loads(response.read().decode('utf-8'))
            if d and d.get('responseData') and d['responseData'].get('translatedText'):
                tr = d['responseData']['translatedText'].strip()
                if not tr.startswith('MYMEMORY WARNING') and not tr.startswith('PLEASE SELECT'):
                    cache[lang][clean] = tr
                    return tr
    except Exception as e:
        pass
    return clean

# Add scheme 34 and 83 titles explicitly with verified high-quality translations
for lang in languages:
    if lang not in cache:
        cache[lang] = {}

cache['mr']['Assistance to General Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories'] = 'अॅक्सेसरीजसह सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट स्थापित करण्यासाठी सामान्य शेतकऱ्यांना सहाय्य'
cache['hi']['Assistance to General Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories'] = 'सहायक उपकरण के साथ सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट की स्थापना के लिए सामान्य किसानों को सहायता'
cache['ta']['Assistance to General Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories'] = 'உபகரணங்களுடன் கூடிய சப்மர்சிபிள் / சென்ட்ரிஃபியூகல் மோட்டார் பம்ப்செட்டுகளை நிறுவுவதற்கு பொது விவசாயிகளுக்கு உதவி'
cache['te']['Assistance to General Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories'] = 'ఉపకరణాలతో కూడిన సబ్‌మెర్సిబుల్ / సెంట్రిఫ్యూగల్ మోటార్ పంప్‌సెట్ల ఏర్పాటుకు సాధారణ రైతులకు సహాయం'
cache['bn']['Assistance to General Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories'] = 'আনুষঙ্গিক সরঞ্জামসহ সাবমার্সিবল / সেন্ট্রিফিউগাল মোটর পাম্পসেট স্থাপনের জন্য সাধারণ কৃষকদের সহায়তা'

cache['mr']['Assistance to Scheduled Caste Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories'] = 'अॅक्सेसरीजसह सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट स्थापित करण्यासाठी अनुसूचित जातीच्या शेतकऱ्यांना सहाय्य'
cache['hi']['Assistance to Scheduled Caste Farmers for Installation of Submersible / Centrifugal Motor Pumpsets With Accessories'] = 'सहायक उपकरण के साथ सबमर्सिबल / सेंट्रीफ्यूगल मोटर पंपसेट की स्थापना के लिए अनुसूचित जाति के किसानों को सहायता'

# Save cache
with open(CACHE_FILE, 'w', encoding='utf-8') as f:
    json.dump(cache, f, ensure_ascii=False, indent=2)

print("Saved base translations to cache.")
