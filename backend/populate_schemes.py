import os
import re
import unicodedata
import pandas as pd
from dotenv import load_dotenv

# Ensure environment is loaded
load_dotenv()

from app import create_app, db
from app.models import Scheme, SchemeCategory, SchemeStatus

def slugify(text):
    text = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def populate():
    excel_path = r"e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx"
    if not os.path.exists(excel_path):
        print(f"Error: {excel_path} not found!")
        return

    df = pd.read_excel(excel_path)
    print(f"Loaded Excel with {len(df)} rows.")

    app = create_app('development')
    with app.app_context():
        # 1. Populate Scheme Categories
        category_meta = {
            "Education & Scholarships": {"icon": "graduation-cap", "color": "#2563EB", "desc": "Scholarships and education support programs"},
            "Agriculture & Farmers": {"icon": "tractor", "color": "#16A34A", "desc": "Support and subsidies for farmers and agriculture"},
            "Social Welfare & Financial Assistance": {"icon": "hand-holding-dollar", "color": "#9333EA", "desc": "Direct benefit and social security programs"},
            "Women & Child Welfare": {"icon": "person-dress", "color": "#DB2777", "desc": "Empowerment and welfare for women and children"},
            "Healthcare": {"icon": "heart-pulse", "color": "#DC2626", "desc": "Health insurance and medical aid schemes"},
            "Housing": {"icon": "house", "color": "#EA580C", "desc": "Affordable housing and shelter assistance"},
            "Employment & Skills": {"icon": "briefcase", "color": "#0284C7", "desc": "Skill development and employment initiatives"},
            "Entrepreneurship & Business": {"icon": "lightbulb", "color": "#D97706", "desc": "Startups, MSME loans and business incentives"},
            "Senior Citizen & Disability": {"icon": "wheelchair", "color": "#4F46E5", "desc": "Pensions and assistance for seniors and persons with disabilities"},
            "Other": {"icon": "layer-group", "color": "#64748B", "desc": "General and diverse government initiatives"}
        }

        cat_map = {}
        for cat_name, meta in category_meta.items():
            cat = SchemeCategory.query.filter_by(name=cat_name).first()
            if not cat:
                cat = SchemeCategory(
                    name=cat_name,
                    description=meta["desc"],
                    icon=meta["icon"],
                    color=meta["color"]
                )
                db.session.add(cat)
                db.session.flush()
            cat_map[cat_name] = cat.id

        db.session.commit()
        print(f"Scheme categories ready ({len(cat_map)} categories).")

        # 2. Populate Schemes
        used_slugs = set(s[0] for s in db.session.query(Scheme.slug).all())
        imported = 0
        updated = 0

        for idx, row in df.iterrows():
            name = str(row.get('Scheme Name', '')).strip()
            if not name or len(name) < 2:
                continue

            primary_cat = str(row.get('Primary Category', 'Other')).strip()
            cat_id = cat_map.get(primary_cat, cat_map["Other"])

            level = str(row.get('Level', 'Central')).strip().upper()
            if 'STATE' in level:
                govt_level = 'STATE'
            else:
                govt_level = 'CENTRAL'

            state_ministry = str(row.get('State / UT / Ministry', '')).strip()
            source_auth = str(row.get('Source Authority', '')).strip()
            ministry = source_auth if source_auth else state_ministry

            # Extract state if applicable
            state = None
            if govt_level == 'STATE':
                state = state_ministry

            app_mode = str(row.get('Application Mode', 'Online')).strip()
            if not app_mode or app_mode.lower() == 'nan':
                app_mode = 'Online'

            official_src = str(row.get('Official Government Source', '')).strip()
            if official_src.lower() == 'nan':
                official_src = str(row.get('Original Dataset Official Link', '')).strip()

            myscheme_url = str(row.get('MyScheme URL', '')).strip()
            if myscheme_url.lower() == 'nan':
                myscheme_url = ''

            # Benefits
            benefits_text = str(row.get('Benefits (Dataset)', '')).strip()
            if benefits_text.lower() == 'nan':
                benefits_text = ''
            benefits_val = {"details": benefits_text} if benefits_text else {}

            # Eligibility
            eligibility_text = str(row.get('Eligibility (Dataset)', '')).strip()
            if eligibility_text.lower() == 'nan':
                eligibility_text = ''
            eligibility_val = {"criteria": eligibility_text} if eligibility_text else {}

            # Documents
            docs_text = str(row.get('Documents (Dataset)', '')).strip()
            if docs_text.lower() == 'nan':
                docs_text = ''
            docs_val = [d.strip() for d in docs_text.split(',') if d.strip()] if docs_text else []

            # Application Process
            app_process = str(row.get('Application Process (Dataset)', '')).strip()
            if app_process.lower() == 'nan':
                app_process = ''

            # Description fallback
            description = benefits_text if benefits_text else f"{name} provided by {ministry}"
            if len(description) > 3000:
                description = description[:3000]

            # Generate unique slug
            base_slug = slugify(name)
            slug = base_slug
            counter = 1
            while slug in used_slugs:
                slug = f"{base_slug}-{counter}"
                counter += 1

            existing_scheme = Scheme.query.filter_by(name=name).first()
            if existing_scheme:
                existing_scheme.category_id = cat_id
                existing_scheme.govt_level = govt_level
                existing_scheme.state = state
                existing_scheme.ministry = ministry
                existing_scheme.benefits = benefits_val
                existing_scheme.eligibility = eligibility_val
                existing_scheme.documents = docs_val
                existing_scheme.application_process = app_process
                existing_scheme.application_mode = app_mode
                existing_scheme.official_url = official_src
                existing_scheme.myscheme_url = myscheme_url
                existing_scheme.status = SchemeStatus.ACTIVE.value
                updated += 1
            else:
                new_scheme = Scheme(
                    name=name,
                    slug=slug,
                    description=description,
                    govt_level=govt_level,
                    state=state,
                    ministry=ministry,
                    category_id=cat_id,
                    tags=[primary_cat, govt_level],
                    eligibility=eligibility_val,
                    exclusions=[],
                    benefits=benefits_val,
                    application_process=app_process,
                    documents=docs_val,
                    faqs=[],
                    application_mode=app_mode,
                    official_url=official_src if official_src else "https://www.myscheme.gov.in",
                    myscheme_url=myscheme_url,
                    status=SchemeStatus.ACTIVE.value
                )
                db.session.add(new_scheme)
                used_slugs.add(slug)
                imported += 1

        db.session.commit()
        total_schemes = Scheme.query.count()
        print(f"Populate complete: {imported} imported, {updated} updated.")
        print(f"Total schemes in database 'schemes' table: {total_schemes}")

if __name__ == '__main__':
    populate()
