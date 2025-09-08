<h1 align="center">
  <a><img src="https://github.com/EEAndE/UBE/blob/main/img/ube-logo.png" width="300"></a>
  <br>
  uBlock Enhanced
  <br>
</h1>

<p align="center">Real-time, client-side phishing detection via machine-learning for browsers!</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#overview">Overview</a> •
  <a href="#architecture--detection-pipeline">Architecture & Detection Pipeline</a> •
  <a href="#installation--usage">Installation & Usage</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#to-do">TO-DO</a> •
  <a href="#license">License</a>
</p>

## Key Features

* Built on uBlock Origin's open-source code
  - Provides the same trusted, lightweight, and efficient ad-content blocker foundation
* Enhanced with real-time phishing detection
  - Detects and blocks phishing and malicious sites to keep your browsing safe
* Up-to-date protection
  - New malicious sites are added to a global blocklist, helping protect all users
* Privacy-first
  - Performs local analysis, sending only minimal data for validation

## Overview

This project is an AI-powered phishing detection system integrated directly into the uBlock Origin browser extension.
It enhances UBO by enabling real-time detection of phishing threats using machine learning.
The extension analyzes various website elements including URLs, domain metadata, HTML structure, and JavaScript behavior to identify suspicious activity.

Unlike static blacklists, UBE adds a dynamic intelligence layer. The extension runs a local ML model for instant decisions and then reports suspected URLs in batches to a backend server.
The server continuously validates new threats, writing only verified results to a shared blocklist. This turns traditional static blocklists into an evolving, real-time protection layer, helping block future threats before they reach users' browsers.

## Architecture & Detection Pipeline

### Client (Browser Extension)
Hooks into navigation events and page activity. Checks extended static lists first (`uBO` + optional dynamic list). If a URL isn’t covered by those static lists, a local model (`Web Worker` using LightGBM) scores it using staged features. Visual indicators (icon/badge/banner/notification) warn users in real time. URLs that look malicious are added to a small local batch queue and periodically flushed to the server with a unique user `API KEY`.

### Server (Validation & Daily Routine)
Receives batched candidates from many clients. Re-extracts features (URL, domain/WHOIS/reputation, optional DOM/JS) and scores with a Python model. Only high-confidence results (by probability threshold) are inserted into the DB.

### Data Flow (End-to-End)
1. The local model evaluates pages as you browse. Suspicious URLs are added to a client-side buffer.
2. The buffer is sent in small batches or after a short delay to the server.
3. The server receives the URLs via per-user API keys and deduplicates them into a daily buffer.
4. Each day, the server extracts new URLs, scores them using the ML model, and adds those that pass the threshold into phish_db.
5. The server generates a plain-text phishing list and publishes it to GitHub, so all users and uBlock Origin can stay up to date automatically.

## Installation & Usage

### Running the Server (Local)

#### Prerequisites
* Python 3.10+
* Virtualenv + dependencies installed (`requirements.txt`)

#### Setup
```bash
python -m venv .venv
source .venv/bin/activate           # PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### Recommended Local Flags
```powershell
$env:DEBUG="1"
$env:UBE_SKIP_PUBLISH="1"
python -m backend.app.server
```

---

### Running the Extension (Local)

1. Open Firefox.
2. Navigate to `about:debugging#/runtime/this-firefox` → click **Load Temporary Add-on…** → select `manifest.json` from `UBE` folder.
3. Click the uBlock icon in the top-right corner of Firefox.
4. Click the **AI** button in the bottom-left of the pop-up window to activate the analysis module.
5. Browse normally. The extension will flag phishing sites in **RED** and safe sites in **GREEN**.

---

### Endpoints (Quick Test by Hand)

1. **Issue an API key (no auth required)**
```bash
curl -s http://localhost:8000/get_api_key
# → {"api_key":"<hex>"}
```

2. **Status without a key → 401**
```bash
curl -i http://localhost:8000/
```

3. **Status with a key → 200**
```bash
API_KEY="<paste-from-step-1>"
curl -s -H "X-API-KEY: $API_KEY" http://localhost:8000/
```

4. **Returns today's submissions**
```bash
API_KEY="<paste-from-step-1>"
curl -s -H "X-API-KEY: $API_KEY" http://localhost:8000/debug/daily_submissions
# gets the daily submissions
```

5. **Returns recent URLs in the database**
```bash
API_KEY="<paste-from-step-1>"
curl -s -H "X-API-KEY: $API_KEY" http://localhost:8000/debug/db_recent
# gets the URLs currently in the database
```

6. **Run full update pipeline**
```bash
API_KEY="<paste-from-step-1>"
curl -s -X POST -H "X-API-KEY: $API_KEY" http://localhost:8000/debug/run_daily
# Runs the full pipeline including data validation and updating the shared blocklist.
# Future users will automatically benefit from updated phishing site protections.
```

## Screenshots
<h3 align="center">
Module activation
<br>
</h3>
<div align="center">
  <img src="https://github.com/EEAndE/UBE/blob/main/img/newbutton.png" width="200" alt="Button to activate module"/>
</div>

---

<h3 align="center">
Safe Verdict
<br>
</h3>

<table align="center" role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <colgroup>
    <col width="50%">
    <col width="50%">
  </colgroup>
  <tr>
    <th align="center">uBlock Badge</th>
    <th align="center">uBlock Dashboard</th>
  </tr>
  <tr>
    <td align="center" valign="top">
      <a href="https://github.com/EEAndE/UBE/blob/main/img/safe_indicator.png">
        <img
          src="https://github.com/EEAndE/UBE/blob/main/img/safe_indicator.png"
          alt="Unsafe badge while browsing (red indicator)"
          height="800">
      </a>
    </td>
    <td align="center" valign="top">
      <a href="https://github.com/EEAndE/UBE/blob/main/img/safe.png">
        <img
          src="https://github.com/EEAndE/UBE/blob/main/img/safe.png"
          alt="uBlock Origin popup with 'Unsafe' banner"
          height="420">
      </a>
    </td>
  </tr>
</table>

<h3 align="center">
Unsafe Verdict
<br>
</h3>

<table align="center" role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <colgroup>
    <col width="50%">
    <col width="50%">
  </colgroup>
  <tr>
    <th align="center">uBlock Badge</th>
    <th align="center">uBlock Dashboard</th>
  </tr>
  <tr>
    <td align="center" valign="top">
      <a href="https://github.com/EEAndE/UBE/blob/main/img/unsafe_indicator.png">
        <img
          src="https://github.com/EEAndE/UBE/blob/main/img/unsafe_indicator.png"
          alt="Unsafe badge while browsing (red indicator)"
          height="800">
      </a>
    </td>
    <td align="center" valign="top">
      <a href="https://github.com/EEAndE/UBE/blob/main/img/unsafe.png">
        <img
          src="https://github.com/EEAndE/UBE/blob/main/img/unsafe.png"
          alt="uBlock Origin popup with 'Unsafe' banner"
          height="420">
      </a>
    </td>
  </tr>
</table>

---

<h3 align="center">
Blocklist
<br>
</h3>

<div align="center">
  <img src="https://github.com/EEAndE/UBE/blob/main/img/blocking.png" width="850" alt="URL blocked via blocklist"/>
</div>

## TO-DO
 - User feedback mechanism for training data
 - Dashboard for managing blocked threats
 
## License

<a href="LICENSE.md">GPLv3 License</a>