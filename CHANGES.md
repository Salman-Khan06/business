# Changes Made by Copilot (PR #1)

This document lists **every change** that was made to your ShopStatus app by the previous Copilot session (PR #1: "Harden ShopStatus app"). Below is a file-by-file breakdown so you can clearly see what was modified and why.

---

## 1. `.gitignore` — Fixed (was blocking your own files)

**Problem:** Your old `.gitignore` was accidentally ignoring your own source files, which meant `background.js`, icons, and `manifest.json` were hidden from git.

| Before (old) | After (new) |
|---|---|
| `/background.js` | `node_modules/` |
| `/icon-192.png` | `.DS_Store` |
| `/icon-512.png` | `Thumbs.db` |
| `/manifest.json` | `*.log` |
| `/shopstatusadmin.html` | `.env` |
| `/user.html` | `.env.local` |

**Why:** The old file was ignoring your actual source code. The new version only ignores build artifacts and secrets.

---

## 2. `background.js` (Service Worker) — Rewritten

**Problem:** The old service worker had a critical bug — it called `window.__fbSet(window.__fbRef(...))` at the bottom, but service workers **don't have a `window` object**, so it would crash every time.

### Changes made:
1. **Cache name** changed from `'salman-pwa-v3'` → `'shopstatus-pwa-v4'`
2. **Fetch handler improved** — Now caches successful network responses dynamically (not just the pre-cached files)
3. **Offline fallback improved** — When user is offline and navigating, it serves the cached `index.html` instead of a plain text error
4. **Removed broken Firebase code** — Deleted the `window.__fbSet(window.__fbRef(...))` lines that caused the crash
5. **Added `activate` event** — Cleans up old caches when a new version is deployed

---

## 3. `index.html` — Security & PWA improvements

### A. New `<head>` meta tags added (lines 6–16)
These were added right after the existing `<meta name="viewport">` tag:
```html
<meta name="description" content="ShopStatus — Real-time shop status checker...">
<meta name="theme-color" content="#f07a2f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ShopStatus">
<meta property="og:title" content="ShopStatus — Find Open Shops Near You">
<meta property="og:description" content="Real-time shop status checker...">
<meta property="og:type" content="website">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icon-192.png">
```
**Why:** These make the app work properly as a PWA on iPhones, show nice previews when shared on social media, and link the manifest file.

### B. New JavaScript helper functions added (after the `appStarted` variable)

Three new utility functions were added:

1. **`esc(str)`** — Escapes HTML special characters to prevent XSS attacks
2. **`rateLimit(action, cooldownMs)`** — Prevents button-spam (e.g., registering multiple times by accident)
3. **`sanitizeInput(str, maxLen)`** — Strips dangerous characters (`< > " ' \``) and limits string length before saving to Firebase

Plus **Service Worker registration code**:
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./background.js')...
  });
}
```

### C. Shop card rendering — XSS protection (`cardHTML` function)

In the `cardHTML()` function that renders each shop card:
- `s.name` → `esc(s.name)` — shop name is now escaped
- `s.owner` → `esc(s.owner)` — owner name is now escaped
- `s.img1` → `esc(s.img1)` — image URL is now escaped
- `s.discount` → `esc(s.discount)` — discount text is now escaped
- `s.area` → `esc(s.area)` and `s.city` → `esc(s.city)` — location is now escaped
- `s.openTime` → `esc(s.openTime)` and `s.closeTime` → `esc(s.closeTime)`
- `key` → `safeKey` (sanitized with `key.replace(/[^a-zA-Z0-9_-]/g,'')`)

**Why:** Without escaping, if someone put `<script>alert('hacked')</script>` as their shop name, it would execute as code. Now it's displayed as plain text.

### D. Detail view — XSS protection (`openDetail` function)

- `s.img1` → `esc(s.img1)` and `s.img2` → `esc(s.img2)` in image tags

### E. Register button — Rate limiting & input sanitization

- Added `rateLimit('register', 5000)` — 5-second cooldown between registrations
- Shop name: `sanitizeInput(..., 50)` — max 50 chars, dangerous characters stripped
- Owner name: `sanitizeInput(..., 40)` — max 40 chars
- Area: `sanitizeInput(..., 60)` — max 60 chars
- City: `sanitizeInput(..., 30)` — max 30 chars
- Description: `sanitizeInput(..., 200)` — max 200 chars
- Discount: `sanitizeInput(..., 150)` — max 150 chars

### F. Status toggle — Rate limiting

- Added `rateLimit('setStatus', 2000)` — 2-second cooldown between Open/Closed toggles

### G. Edit/Save — Rate limiting & input sanitization

- Added `rateLimit('editSave', 3000)` — 3-second cooldown
- Same `sanitizeInput()` applied to name, owner, area, city, desc, discount fields

---

## 4. `manifest.json` — PWA branding updated

| Field | Before | After |
|---|---|---|
| `name` | `"Salman PWA"` | `"ShopStatus — Find Open Shops Near You"` |
| `short_name` | `"SalmanApp"` | `"ShopStatus"` |
| `description` | *(missing)* | `"Real-time shop status checker..."` |
| `background_color` | `"#ffffff"` | `"#060a12"` (matches dark theme) |
| `theme_color` | `"#000000"` | `"#f07a2f"` (orange accent) |
| `orientation` | *(missing)* | `"portrait"` |
| `categories` | *(missing)* | `["shopping", "business", "lifestyle"]` |
| `lang` | *(missing)* | `"en"` |
| Icon `purpose` | *(missing)* | `"any maskable"` |
| `shortcuts` | *(missing)* | Added "Find Open Shops" shortcut |

---

## 5. `1111.html` (Admin Controller) — XSS protection added

**Note:** This file was later deleted by you in a separate commit, so these changes no longer exist in the codebase. The changes that *were* made included the same `esc()` and `sanitizeInput()` functions as `index.html`.

---

## Summary

| Category | What Changed |
|---|---|
| **Bug fix** | Removed crashing `window.__fbRef` code from service worker |
| **Security (XSS)** | All user data escaped with `esc()` before rendering as HTML |
| **Security (Input)** | All form inputs sanitized before saving to Firebase |
| **Rate limiting** | Register (5s), Status toggle (2s), Edit save (3s) cooldowns |
| **PWA** | Proper manifest, meta tags, service worker registration, offline fallback |
| **.gitignore** | Stopped ignoring source files, now ignores only build artifacts |

**No visual/design changes were made.** The app looks exactly the same. All changes are under-the-hood security and reliability improvements.
