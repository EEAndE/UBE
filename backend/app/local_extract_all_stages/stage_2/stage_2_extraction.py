import requests
import pandas as pd
from typing import Any, Dict, Iterable, Union

TIMEOUT = 10

HEADERS = [
    "URL",
    "SSL Exists",
    "SSL Valid",
    "Domain Age",
    "Domain Expiry",
]

KEY_MAP = {
    "SSL Exists":        ["SSL Exists", "ssl_exists", "sslExists"],
    "SSL Valid":         ["SSL Valid", "ssl_valid", "sslValid"],
    "Domain Age":        ["Domain Age", "domain_age", "domain_age_days"],
    "Domain Expiry":     ["Domain Expiry", "domain_expiry", "days_to_expiry"],
}
def _pick(d: Dict[str, Any], candidates: Iterable[Union[str, tuple]], default=-999):
    for key in candidates:
        if isinstance(key, tuple):
            cur = d
            ok = True
            for k in key:
                if isinstance(cur, dict) and k in cur:
                    cur = cur[k]
                else:
                    ok = False; break
            if ok:
                return cur
        elif key in d:
            return d[key]
    return default

def query_api(clean_full_url: str):
    url=""
    response = requests.post(
        url,
        json={"url": clean_full_url},
        headers={"Content-Type": "application/json"},
        timeout=TIMEOUT,
    )

    if response.ok:
        return response.json()
    else:
        try:
            error_text = response.json().get("error", "unknown error")
        except Exception:
            error_text = response.text
        raise Exception(f"API error {response.status_code}: {error_text}")

def extract_desire_features(json_dict: dict) -> list:
    features = []
    for h in HEADERS[1:]:
        cands = KEY_MAP.get(h, [h])
        val = _pick(json_dict, cands, default=-1)
        if isinstance(val, bool):
            val = int(val)
        features.append(val)
    return features
def stage_2_extraction(phish_list):
    results = []
    for url in phish_list:
        try:
            features = [url]
            json_dict = query_api(url)
            features += extract_desire_features(json_dict)
        except Exception as e:
            features = [url] + ([-1] * (len(HEADERS) - 1))
            print(f"[stage_2] warn: {url} -> {e}")
        results.append(features)
    return pd.DataFrame(results, columns=HEADERS)


def proc_ext_2(d:dict,phish_list):
    d["stage_2"]=stage_2_extraction(phish_list)

