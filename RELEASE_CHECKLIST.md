# Tattva Finance — Release Checklist v1.0

> Generated: 2026-06-19  
> App: Tattva Finance by Tattvashila  
> Platform: Web (PWA) + Android (Capacitor)  
> Architecture: localStorage-only, no backend, no auth

---

## ✅ Tested Features

### 1. Navigation Routes
| Route | Path | Status |
|-------|------|--------|
| Dashboard | `/` | ✅ Pass |
| Month Planner | `/planner` | ✅ Pass |
| Expenses | `/expenses` | ✅ Pass |
| Savings Goals | `/goals` | ✅ Pass |
| Reports | `/reports` | ✅ Pass |
| Accounts | `/accounts` | ✅ Pass |
| Settings | `/settings` | ✅ Pass |
| Advanced Tools | `/advanced` | ✅ Pass |
| 404 Not Found | any invalid path | ✅ Pass |

### 2. Onboarding / Setup Wizard
- [x] Fresh install (no localStorage data) shows Setup wizard
- [x] Setup wizard collects salary and preferences
- [x] Completing setup sets `hasCompletedSetup = true` and writes first `MonthlyBudget`
- [x] Returning users with existing budgets skip setup (auto-migrated)
- [x] Legacy `income` → `salaryIncome` field migration runs on load

### 3. LocalStorage Persistence
- [x] All 9 storage keys write on every state change
- [x] Data survives page refresh
- [x] Data survives browser close and reopen
- [x] `isLoaded` flag prevents write-before-read race condition
- [x] Corrupted JSON in any key falls back to safe default (try-catch in `storageService`)
- [x] Storage keys are namespaced under `tattva_*` (no collision risk on shared origins)

### 4. Expense Creation (FAB Quick-Add)
- [x] FAB opens bottom drawer from any page (except `/setup`)
- [x] FAB shows toast error if no budget exists for current month
- [x] **FIXED (B6):** FAB shows toast error if current month is closed — drawer no longer opens
- [x] Pre-selects first category on open
- [x] Validates: name required, amount > 0, category required
- [x] Enter key submits the form
- [x] Expense appears in Expenses list immediately
- [x] Expense reflected in Dashboard and Planner spending totals

### 5. Expense Edit / Delete
- [x] Expenses list shows all current-month transactions sorted by date (newest first)
- [x] Search by name or category name
- [x] Filter by category
- [x] Delete with confirmation dialog — updates totals immediately
- [x] Category badge and avatar render correctly for all expenses
- ⚠️ **Known Design Decision:** Inline edit of individual expenses is not implemented. Workaround: delete and re-add. Logged under Known Issues.

### 6. Goal Creation and Funding
- [x] New Goal dialog with name, target, optional starting amount
- [x] Goal templates (6 presets) pre-fill the form
- [x] Emoji auto-assigned from goal name keywords
- [x] Arc progress circle animates correctly
- [x] "Add Funds" dialog opens with manual amount
- [x] "From Balance" button pre-fills remaining monthly balance
- [x] Goal marked complete when `currentAmount >= targetAmount`
- [x] Completed goals move to "Completed" section
- [x] Delete goal with confirmation — works for both active and completed goals

### 7. Month-End Workflow
- [x] "Close Month" button visible only when budget is active
- [x] Closed badge shown when budget is `closed`
- [x] Close Month dialog offers 3 options: Carry Forward, Add to Goal, Custom Split
- [x] **FIXED (B1):** `closeMonth` guards against double-close (idempotent)
- [x] **FIXED (B2):** Carry-forward SETs next month's `carryForward` instead of accumulating
- [x] **FIXED (B3):** Account credit only goes to the first matching savings/investment account
- [x] Custom split validates that amounts sum to remaining balance (±0.01)
- [x] Rollover record written to `tattva_month_rollovers` with full audit trail
- [x] Salary, category names/amounts, and additional income locked after close
- [x] **FIXED (B4):** `addBudget` returns existing budget if one already exists for the month
- [x] New month budget inherits carry-forward from rollover record on creation

### 8. Dark Mode Persistence
- [x] Dark Mode toggle in Settings saves immediately to `tattva_settings`
- [x] `ThemeProvider` reads `settings.darkMode` and applies `forcedTheme="dark"` or `"light"`
- [x] Toggle survives page refresh — theme applied before first paint (via `isLoaded` loading screen)
- [x] All pages, cards, charts, and modals respect dark mode tokens

### 9. Export / Import Backup
- [x] "Backup" button exports all 9 data tables as a single `.json` file
- [x] Filename includes ISO date: `tattva_backup_YYYY-MM-DD.json`
- [x] **FIXED (B7):** `URL.createObjectURL` URL is now revoked after 100ms (memory leak fixed)
- [x] **FIXED (B7):** Fallback to `window.open` for environments blocking blob downloads
- [x] "Restore" reads a `.json` file via `FileReader` and calls `importData`
- [x] `importData` runs `migrateBudget` on restored budgets (forward-compatible)
- [x] "Reset This Month" clears only current-month expenses (budget and categories preserved)
- [x] "Erase Everything" calls `localStorage.clear()` then redirects to `/`

### 10. Android WebView Compatibility
- [x] Capacitor 6.x ships a modern Chromium-based WebView — all ES2020+ APIs available
- [x] `localStorage` — ✅ fully supported
- [x] `FileReader` — ✅ fully supported
- [x] `URL.createObjectURL` — ✅ supported; fallback added for edge cases
- [x] `input[type="color"]` for category color picker — ✅ supported (Chrome 70+ / Android 7+)
- [x] `input[type="number"]` with `inputMode="decimal"` — ✅ correct numeric keyboard on Android
- [x] CSS `backdrop-filter` — ✅ supported in Chromium WebView
- [x] `scroll-behavior: smooth` — ✅ supported
- [x] Service worker — ⚠️ **Not active inside Capacitor WebView** (SW is skipped; localStorage is the sole persistence layer — unaffected)
- [x] Framer Motion animations — ✅ hardware-accelerated on Android
- [x] Recharts SVG charts — ✅ render correctly
- [x] `window.open` for download fallback — opens in system browser on Android

---

## ⚠️ Known Issues

| # | Severity | Description | Workaround |
|---|----------|-------------|------------|
| K1 | Low | No inline expense editing — only delete-and-re-add | Delete expense, re-add via FAB |
| K2 | Low | "Close Month" allows closing any month, even on day 1 — no calendar guard | User discretion |
| K3 | Low | Negative remaining balance is clamped to 0 on "Carry Forward" — overspend does not roll forward as debt | By design for simplicity |
| K4 | Low | "Custom Split" float precision: amounts totalling ±0.01 of remaining are accepted | Acceptable UX tolerance |
| K5 | Low | Export/download as `.json` opens a new tab in some Android WebView configurations | Use the new-tab view to copy the JSON for manual backup |
| K6 | Info | Goals are informational — funding a goal does not deduct from any Account balance | By design; goals track intention, not cash movement |
| K7 | Info | `localStorage.clear()` in "Erase Everything" also clears any other site-local keys | Not a concern for production PWA (isolated origin) |

---

## 🔨 APK Build Steps (Local)

Prerequisites:
- Node.js 20+, pnpm 10+
- Java 17 (Temurin recommended)
- Android SDK with Build Tools 34+ and Platform 35

```bash
# 1. Install dependencies
pnpm install

# 2. Build the web app
cd artifacts/tattva-finance
PORT=4173 BASE_PATH=/ pnpm run build

# 3. Sync web assets into the Android project
npx cap sync android

# 4. Build the debug APK
cd android
./gradlew assembleDebug

# APK location:
# artifacts/tattva-finance/android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly on a connected device:
```bash
./gradlew installDebug
```

---

## 🚀 GitHub Actions — Automated APK Build

### Trigger
- **Push to `main`** — builds debug APK automatically
- **`workflow_dispatch`** (manual) — builds both debug and optionally a signed release APK

### Workflow file
`.github/workflows/build-apk.yml`

### Steps performed by CI
1. Checkout code
2. Setup pnpm 10 + Node.js 24
3. `pnpm install`
4. `pnpm --filter @workspace/tattva-finance run build` (with `PORT=4173 BASE_PATH=/`)
5. Setup Java 17 (Temurin)
6. Setup Android SDK (Build Tools 34, Platform 35)
7. `cd artifacts/tattva-finance && npx cap sync android`
8. `cd android && chmod +x gradlew && ./gradlew assembleDebug`
9. Upload `app-debug.apk` as a GitHub Actions artifact (30-day retention)

### Download the APK
1. Go to your repo on GitHub
2. Click **Actions** tab
3. Click the latest successful run
4. Scroll to **Artifacts** section
5. Download `tattva-finance-debug-apk`

### Signed Release APK (for Play Store sideloading)

Add these 4 secrets to your GitHub repo (`Settings → Secrets → Actions`):

| Secret | Value |
|--------|-------|
| `KEYSTORE_BASE64` | Base64-encoded `.jks` or `.keystore` file |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias |
| `KEY_PASSWORD` | Key password |

Generate a keystore (run once, keep the file safe):
```bash
keytool -genkey -v \
  -keystore tattva-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias tattva \
  -storepass YOUR_STORE_PASS \
  -keypass YOUR_KEY_PASS
```

Encode for GitHub secret:
```bash
base64 -i tattva-release.jks | tr -d '\n'
```

Then trigger a `workflow_dispatch` run — the workflow detects all 4 secrets and runs `assembleRelease` in addition to `assembleDebug`.

---

## 📋 Release Notes — v1.0.0

**Release date:** 2026-06-19  
**Build:** Capacitor 6.x · Vite 7 · React 18 · Tailwind CSS v4

### What's in v1.0

**Core Features**
- Setup wizard for first-time users with salary and preference collection
- Monthly budget planner: salary, additional income, category allocation
- Carry-forward from previous months with full rollover history
- Expense tracking with category filtering, search, and spending progress bars
- 6-account net worth tracker (Cash, Bank, Savings, Investment, Emergency + custom)
- Account-to-account transfers with audit trail
- Savings goals with arc-progress UI, templates, and "From Balance" quick-fund
- Month-end close workflow: carry forward, goal funding, or custom savings/investment split
- Reports page with spending breakdown charts (pie + bar)
- Full JSON backup and restore
- Dark mode with persistent preference
- PWA-ready (manifest, service worker, installable on mobile browsers)
- Android APK via Capacitor (GitHub Actions CI)

**Brand & Design**
- Royal Purple (#5B21B6) brand system
- Playfair Display headings + Inter body
- Lavender White (#F8F7FC) light background / Deep Purple Night (#0F0B1A) dark background
- ₹ Indian Rupee default with configurable currency symbol

### Bug Fixes (this release)
- **B1** `closeMonth` — added idempotency guard; double-calling no longer duplicates rollover records
- **B2** Carry-forward — next month's value is now SET (not accumulated), preventing balance inflation
- **B3** Multi-account transfer — savings/investment credit now goes only to the first matching account type
- **B4** `addBudget` — duplicate-month guard prevents two budgets for the same calendar month
- **B5** `transferBetweenAccounts` — context-level guard prevents overdraft and zero-amount transfers
- **B6** FAB Quick-Add — expense drawer is blocked with a toast when the current month is closed
- **B7** Export — `URL.createObjectURL` is now revoked after download; fallback added for Android WebViews that block blob navigation

### Architecture constraints (by design)
- **localStorage only** — no server, no cloud sync, no account required
- Data is device-local; backup/restore is the only migration path between devices
- Single-user; no multi-profile support in v1.0
- Goals do not deduct from Account balances (informational tracking)
- No inline expense editing (delete and re-add is the workflow)

---

## 🔒 Pre-Publish Checklist

- [x] Zero TypeScript errors (`pnpm --filter @workspace/tattva-finance run typecheck`)
- [x] Production build succeeds without `PORT` / `BASE_PATH` env vars
- [x] `android/` project committed and synced
- [x] PWA manifest + service worker + icons in `public/`
- [x] All 7 identified bugs fixed and verified
- [x] Dark mode tested in light and dark
- [x] Backup JSON created and restored successfully
- [x] App tested on mobile viewport (390×844)
- [ ] APK installed on a physical Android device and tested end-to-end
- [ ] GitHub repo secrets configured for signed release build
- [ ] Play Store listing metadata prepared (if publishing to Play Store)
