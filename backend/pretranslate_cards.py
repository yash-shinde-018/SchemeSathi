import json
import os
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

LANGUAGES = ['mr', 'hi', 'ta', 'te', 'bn']
CACHE_FILE = 'translations_cache.json'
OUT_FRONTEND = os.path.abspath('../schemesathi-landing/src/locales/schemesTranslations.json')

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {l: {} for l in LANGUAGES}

def save_cache(cache):
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def fetch_gtx(text, target_lang):
    if not text or not text.strip():
        return text
    clean = text.strip()
    try:
        encoded = urllib.parse.quote(clean[:1500])
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={encoded}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            if data and data[0]:
                parts = [p[0] for p in data[0] if p and p[0]]
                translated = ''.join(parts).strip()
                if translated:
                    return translated
    except Exception as e:
        print(f"GTX error for {clean[:20]} ({target_lang}): {e}")
    return clean

def main():
    print("Loading schemes from API...")
    req = urllib.request.Request("http://127.0.0.1:5000/api/schemes?limit=100")
    with urllib.request.urlopen(req, timeout=10) as res:
        data = json.loads(res.read().decode('utf-8'))
        schemes = data.get('schemes', [])
    print(f"Retrieved {len(schemes)} schemes.")

    titles = []
    descriptions = []
    ministries = []

    for s in schemes:
        if s.get('name') and s['name'] not in titles:
            titles.append(s['name'])
        if s.get('description') and s['description'] not in descriptions:
            descriptions.append(s['description'])
        if s.get('ministry') and s['ministry'] not in ministries:
            ministries.append(s['ministry'])

    print(f"Unique Titles: {len(titles)}, Descriptions: {len(descriptions)}, Ministries: {len(ministries)}")

    cache = load_cache()
    for l in LANGUAGES:
        if l not in cache:
            cache[l] = {}

    all_tasks = []
    for lang in LANGUAGES:
        for t in titles + descriptions + ministries:
            if t not in cache[lang]:
                all_tasks.append((t, lang))

    print(f"Total translation tasks needed: {len(all_tasks)}")

    if all_tasks:
        completed = 0
        with ThreadPoolExecutor(max_workers=10) as pool:
            futures = {pool.submit(fetch_gtx, text, lang): (text, lang) for text, lang in all_tasks}
            for fut in as_completed(futures):
                text, lang = futures[fut]
                try:
                    res = fut.result()
                    if res and res != text:
                        cache[lang][text] = res
                except Exception as e:
                    pass
                completed += 1
                if completed % 50 == 0 or completed == len(all_tasks):
                    print(f"Progress: {completed} / {len(all_tasks)}")

        save_cache(cache)
        print("Updated backend cache.")

    # Structure data for frontend
    frontend_bundle = {}
    for lang in LANGUAGES:
        frontend_bundle[lang] = {
            "titles": {},
            "descriptions": {},
            "ministries": {}
        }
        for t in titles:
            if t in cache[lang]:
                frontend_bundle[lang]["titles"][t] = cache[lang][t]
        for d in descriptions:
            if d in cache[lang]:
                frontend_bundle[lang]["descriptions"][d] = cache[lang][d]
        for m in ministries:
            if m in cache[lang]:
                frontend_bundle[lang]["ministries"][m] = cache[lang][m]

    os.makedirs(os.path.dirname(OUT_FRONTEND), exist_ok=True)
    with open(OUT_FRONTEND, 'w', encoding='utf-8') as f:
        json.dump(frontend_bundle, f, ensure_ascii=False, indent=2)
    print(f"Saved frontend bundle to {OUT_FRONTEND} with {len(frontend_bundle)} languages.")

if __name__ == '__main__':
    main()
