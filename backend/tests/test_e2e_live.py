import requests
import json
import uuid
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://localhost:5000/api"

def print_result(step_name, success, detail=""):
    mark = "[PASS]" if success else "[FAIL]"
    print(f"{mark} | {step_name}: {detail}")
    if not success:
        sys.exit(1)

def run_tests():
    print("=" * 60)
    print("SchemeSathi End-to-End System Verification")
    print("=" * 60)

    session = requests.Session()

    # 1. Healthcheck
    try:
        r = session.get(f"{BASE_URL}/health", timeout=5)
        data = r.json()
        print_result("1. Health Endpoint", r.status_code == 200 and data.get("status") == "healthy", f"Status: {data.get('status')}")
    except Exception as e:
        print_result("1. Health Endpoint", False, str(e))

    # 2. Categories
    try:
        r = session.get(f"{BASE_URL}/schemes/categories", timeout=5)
        data = r.json()
        cats = data.get("data", []) or data.get("categories", [])
        print_result("2. Scheme Categories", r.status_code == 200 and len(cats) > 0, f"Found {len(cats)} categories")
    except Exception as e:
        print_result("2. Scheme Categories", False, str(e))

    # 3. Schemes listing
    scheme_id = None
    try:
        r = session.get(f"{BASE_URL}/schemes?page=1&per_page=5", timeout=5)
        data = r.json()
        schemes = data.get("data", {}).get("schemes", []) if isinstance(data.get("data"), dict) else data.get("data", [])
        if not schemes and "items" in data:
            schemes = data["items"]
        print_result("3. Scheme Listing", r.status_code == 200 and len(schemes) > 0, f"Retrieved {len(schemes)} schemes")
        if schemes:
            scheme_id = schemes[0].get("id") or schemes[0].get("scheme_id")
    except Exception as e:
        print_result("3. Scheme Listing", False, str(e))

    # 4. Scheme Details
    if scheme_id:
        try:
            r = session.get(f"{BASE_URL}/schemes/{scheme_id}", timeout=5)
            data = r.json()
            title = data.get("data", {}).get("title") or data.get("data", {}).get("scheme_name") or "Found"
            print_result("4. Scheme Details", r.status_code == 200, f"ID {scheme_id}: {title[:40]}")
        except Exception as e:
            print_result("4. Scheme Details", False, str(e))

    # 5. User Registration (Citizen)
    test_id = uuid.uuid4().hex[:6]
    test_email = f"e2e_citizen_{test_id}@example.com"
    test_password = "SecurePassword@123"
    first_name = "Vikram"
    last_name = f"Patel{test_id}"
    phone = f"98765{test_id[:5]}"
    user_id = None

    reg_payload = {
        "email": test_email,
        "password": test_password,
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone
    }

    try:
        r = session.post(f"{BASE_URL}/auth/register", json=reg_payload, timeout=5)
        data = r.json()
        success = r.status_code in [200, 201] and data.get("success", False)
        user_id = data.get("user_id")
        print_result("5. User Registration", success, f"Created {test_email} (ID: {user_id})")
    except Exception as e:
        print_result("5. User Registration", False, str(e))

    # 6. User Login
    try:
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        r = session.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=5)
        data = r.json()
        success = r.status_code == 200 and data.get("success", False)
        print_result("6. User Login", success, f"Successfully logged in {test_email}")
    except Exception as e:
        print_result("6. User Login", False, str(e))

    # 7. Fetch Profile
    try:
        # Also pass X-User-Id header for robust multi-auth support
        session.headers.update({"X-User-Id": str(user_id)})
        r = session.get(f"{BASE_URL}/users/profile", timeout=5)
        data = r.json()
        success = r.status_code == 200 and data.get("success", False)
        user_profile = data.get("data", {})
        print_result("7. Fetch Profile", success, f"Citizen: {user_profile.get('first_name')} {user_profile.get('last_name')}")
    except Exception as e:
        print_result("7. Fetch Profile", False, str(e))

    # 8. Update Profile Fields
    try:
        update_payload = {
            "first_name": f"{first_name} Updated",
            "last_name": last_name,
            "phone": phone,
            "state": "Maharashtra",
            "district": "Pune",
            "city": "Pune",
            "gender": "male",
            "occupation": "Farmer",
            "social_category": "General",
            "income": 250000
        }
        r = session.put(f"{BASE_URL}/users/profile", json=update_payload, timeout=5)
        data = r.json()
        success = r.status_code == 200 and data.get("success", False)
        updated_state = data.get("data", {}).get("profile", {}).get("state")
        print_result("8. Update Profile", success, f"State updated to: {updated_state}")
    except Exception as e:
        print_result("8. Update Profile", False, str(e))

    # 9. Update Profile Picture (Custom / Preset)
    try:
        avatar_payload = {
            "profile_picture": "https://api.dicebear.com/7.x/bottts/svg?seed=E2ECitizen"
        }
        r = session.put(f"{BASE_URL}/users/profile", json=avatar_payload, timeout=5)
        data = r.json()
        pic_saved = data.get("data", {}).get("profile", {}).get("profile_picture")
        success = r.status_code == 200 and pic_saved == avatar_payload["profile_picture"]
        print_result("9. Update Profile Picture", success, f"Saved avatar: {pic_saved[:35]}...")
    except Exception as e:
        print_result("9. Update Profile Picture", False, str(e))

    # 10. Change Password
    new_password = "NewStrongPassword@999"
    try:
        pw_payload = {
            "current_password": test_password,
            "new_password": new_password,
            "confirm_password": new_password
        }
        r = session.post(f"{BASE_URL}/users/change-password", json=pw_payload, timeout=5)
        data = r.json()
        success = r.status_code == 200 and data.get("success", False)
        print_result("10. Change Password", success, "Password changed to new password")
    except Exception as e:
        print_result("10. Change Password", False, str(e))

    # 11. Verify Login with New Password
    try:
        login_new = {
            "email": test_email,
            "password": new_password
        }
        r = requests.post(f"{BASE_URL}/auth/login", json=login_new, timeout=5)
        data = r.json()
        success = r.status_code == 200 and data.get("success", False)
        print_result("11. Login with New Password", success, "Authenticated with newly changed password")
    except Exception as e:
        print_result("11. Login with New Password", False, str(e))

    # 12. Delete Account (Danger Zone)
    try:
        del_payload = {
            "password": new_password
        }
        r = session.post(f"{BASE_URL}/users/delete-account", json=del_payload, timeout=5)
        data = r.json()
        success = r.status_code == 200 and data.get("success", False)
        print_result("12. Delete Account", success, "Account and associated citizen records permanently removed")
    except Exception as e:
        print_result("12. Delete Account", False, str(e))

    # 13. Confirm Deleted Account Cannot Login
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json=login_new, timeout=5)
        data = r.json()
        # Deleted account should not be found or login should fail
        success = r.status_code in [400, 401, 403, 404] and not data.get("success", False)
        print_result("13. Confirm Account Deleted", success, f"Login rejected with HTTP {r.status_code} ({data.get('message')})")
    except Exception as e:
        print_result("13. Confirm Account Deleted", False, str(e))

    print("=" * 60)
    print("ALL 13 END-TO-END TESTS PASSED CLEANLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
