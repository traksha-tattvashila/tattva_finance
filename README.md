# Tattva Finance

**Your personal financial companion** — a mobile-first web app to track income, manage expenses, and build savings goals. Built by Tattvashila.

> All data stays on your device (localStorage). No backend, no account required.

---

## ✨ Features

- **Dashboard** — real-time overview with intelligent status messages and month-over-month comparison
- **Month Planner** — set salary income, create budget categories, manage carry-forwards and additional income
- **Expense Tracker** — quick-add FAB, category tagging, search and filter
- **Savings Goals** — emoji auto-detection, circular progress, "Fund from Balance" shortcut
- **Reports** — spending pie chart, allocation vs actual bars, month comparison, CSV/JSON export
- **Accounts** — track multiple accounts and inter-account transfers
- **Settings** — dark mode, currency symbol, budget style (Simple / Detailed), data backup & restore
- **PWA** — installable from browser, offline-capable
- **Android APK** — built via GitHub Actions with Capacitor

---

## 🏃 Local Development

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/) — `npm install -g pnpm`

### Install & Run

```bash
# Install all workspace dependencies
pnpm install

# Start the development server
pnpm --filter @workspace/tattva-finance run dev
```

The app starts on the port defined by the `PORT` environment variable (defaults to `4173`).

### Build for Production

```bash
pnpm --filter @workspace/tattva-finance run build
```

Output: `artifacts/tattva-finance/dist/public/`

### Preview Production Build

```bash
pnpm --filter @workspace/tattva-finance run start
```

### TypeScript Check

```bash
pnpm --filter @workspace/tattva-finance run typecheck
```

---

## 📱 Android APK

The Android APK is built via [Capacitor](https://capacitorjs.com/) and automated with GitHub Actions.

### Architecture

```
artifacts/tattva-finance/
├── dist/public/         ← Vite build output (web assets)
├── android/             ← Capacitor Android project (committed to repo)
├── capacitor.config.ts  ← Capacitor configuration
└── public/
    ├── manifest.json    ← PWA manifest
    └── sw.js            ← Service worker
```

### Build APK Locally

Requirements: JDK 17+, Android Studio / Android SDK (API 33+)

```bash
# 1. Build the web app
cd artifacts/tattva-finance
PORT=4173 BASE_PATH=/ pnpm run build

# 2. Sync web assets into Android project
npx cap sync android

# 3. Build debug APK
cd android
./gradlew assembleDebug

# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

To open in Android Studio:
```bash
npx cap open android
```

### APK via GitHub Actions

Push to `main` — the workflow automatically:

1. Installs pnpm + Node.js
2. Builds the Vite web app
3. Sets up Java 17 + Android SDK
4. Runs `cap sync android`
5. Runs `./gradlew assembleDebug`
6. Uploads `app-debug.apk` as a workflow artifact

**Download the APK:** GitHub → Actions → Latest workflow run → Artifacts → `tattva-finance-debug-apk`

#### Release APK (Signed)

Trigger manually via `workflow_dispatch` → select `release`. Requires these repository secrets:

| Secret | Description |
|--------|-------------|
| `KEYSTORE_BASE64` | Base64-encoded `.jks` keystore file |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias in the keystore |
| `KEY_PASSWORD` | Key password |

To encode your keystore:
```bash
base64 -i your-keystore.jks | pbcopy   # macOS
base64 your-keystore.jks | xclip       # Linux
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Routing | wouter |
| Animation | framer-motion |
| Toasts | sonner |
| Charts | recharts (custom wrappers) |
| Mobile | Capacitor 6 |
| Package manager | pnpm workspaces |

---

## 🗂️ Project Structure

```
/
├── artifacts/
│   └── tattva-finance/      ← Main web app
│       ├── src/
│       │   ├── pages/       ← Dashboard, Planner, Expenses, Goals, Reports, Settings…
│       │   ├── components/  ← Layout, Charts, Shared, UI
│       │   ├── context/     ← FinanceContext (global state)
│       │   ├── services/    ← localStorage helpers
│       │   ├── utils/       ← formatters, export helpers
│       │   └── types/       ← TypeScript types
│       ├── public/          ← Static assets, manifest, service worker
│       ├── android/         ← Capacitor Android project
│       └── capacitor.config.ts
├── lib/                     ← Shared workspace libraries
├── .github/workflows/       ← GitHub Actions CI/CD
└── README.md
```

---

## 📦 Deployment (Replit)

The app is deployed as a **static site** via Replit. The build produces static files served directly — no server required.

```bash
# Replit publish build command (automatic):
pnpm --filter @workspace/tattva-finance run build
# Serves: artifacts/tattva-finance/dist/public/
```

---

## 🔒 Data & Privacy

- **100% local** — all data in browser `localStorage`, never sent to any server
- **Backup** — export all data as JSON from Settings → Backup & Restore
- **Restore** — import JSON backup to recover data on a new device

---

## 📄 License

MIT © Tattvashila
