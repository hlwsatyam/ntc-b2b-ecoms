"""GSTIN verification: format regex + Mod-36 checksum + optional third-party API call.
The checksum implementation matches the official GSTN algorithm — it is real
mathematical verification of the number's validity, not just a regex check."""
import re
import httpx

GSTIN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")

STATE_CODES = {
    "01":"Jammu and Kashmir","02":"Himachal Pradesh","03":"Punjab","04":"Chandigarh",
    "05":"Uttarakhand","06":"Haryana","07":"Delhi","08":"Rajasthan","09":"Uttar Pradesh",
    "10":"Bihar","11":"Sikkim","12":"Arunachal Pradesh","13":"Nagaland","14":"Manipur",
    "15":"Mizoram","16":"Tripura","17":"Meghalaya","18":"Assam","19":"West Bengal",
    "20":"Jharkhand","21":"Odisha","22":"Chhattisgarh","23":"Madhya Pradesh","24":"Gujarat",
    "25":"Daman and Diu","26":"Dadra and Nagar Haveli","27":"Maharashtra","28":"Andhra Pradesh (Old)",
    "29":"Karnataka","30":"Goa","31":"Lakshadweep","32":"Kerala","33":"Tamil Nadu",
    "34":"Puducherry","35":"Andaman and Nicobar Islands","36":"Telangana","37":"Andhra Pradesh",
    "38":"Ladakh","97":"Other Territory",
}


def gstin_checksum_ok(gstin: str) -> bool:
    if not gstin or not GSTIN_REGEX.match(gstin):
        return False
    total = 0
    for i, ch in enumerate(gstin[:-1]):
        pos = GSTIN_ALPHABET.index(ch)
        prod = pos * (1 if i % 2 == 0 else 2)
        total += (prod // 36) + (prod % 36)
    expected = GSTIN_ALPHABET[(36 - (total % 36)) % 36]
    return expected == gstin[-1]


async def verify_gstin(gstin: str) -> dict:
    """Real mathematical verification via GSTN checksum + best-effort public lookup."""
    gstin = (gstin or "").strip().upper()
    if not GSTIN_REGEX.match(gstin):
        return {"valid": False, "error": "Invalid GSTIN format. Expected 15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric.", "gstin": gstin}
    if not gstin_checksum_ok(gstin):
        return {"valid": False, "error": "GSTIN checksum failed — number is not mathematically valid.", "gstin": gstin}
    state_code = gstin[:2]
    pan = gstin[2:12]
    entity_type = gstin[12]  # entity number for the PAN holder in the state
    state = STATE_CODES.get(state_code, "Unknown state")
    # Best-effort third-party public lookup (non-blocking; we do not fail if it's unreachable)
    third_party = None
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=True) as c:
            r = await c.get(f"https://sheet.gstincheck.co.in/check/{gstin}")
            if r.status_code == 200 and "gstin" in r.text.lower():
                third_party = {"provider": "gstincheck.co.in", "status": "reachable"}
    except Exception:
        third_party = None
    return {
        "valid": True,
        "gstin": gstin,
        "stateCode": state_code,
        "state": state,
        "pan": pan,
        "entityType": entity_type,
        "thirdParty": third_party,
    }
