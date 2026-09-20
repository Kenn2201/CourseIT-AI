# 🎓 CourseIT Ai

> **ADHD-friendly technical learning from documentation.**  
> Paste docs or scans, tell CourseIT what you want to learn, and get an action-first learning module with concise explanations, numbered steps, examples, commands, and clear next actions.

[![CourseIT Ai Banner](https://raw.githubusercontent.com/kennnacario/portfolio-kenn/master/project-3-CourseIT/public/favicon.ico)](https://courseitai.kenncode.me)
![Version](https://img.shields.io/badge/version-v1.19.2--LIVE--Beta-indigo.svg)
[![Last Commit](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2FKenn2201%2FCourseIT-AI%2Fcommits%2Fmaster&query=%24.sha&label=commit&color=purple&cacheSeconds=60)](https://github.com/Kenn2201/CourseIT-AI/commit/master)
[![Versioning Policy](https://img.shields.io/badge/policy-VERSIONING.md-blue.svg)](VERSIONING.md)
[![Changelog](https://img.shields.io/badge/changelog-CHANGELOG.md-emerald.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF.svg?logo=vite)
![Netlify](https://img.shields.io/badge/Netlify-Serverless-00C7B7.svg?logo=netlify)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v4-38b2ac.svg?logo=tailwind-css)
![Appwrite](https://img.shields.io/badge/Appwrite-Cloud%20Sydney-FD366E.svg?logo=appwrite)
![Multi-Provider AI](https://img.shields.io/badge/AI%20Routing-Gemini%20%7C%20Groq%20%7C%20Mistral%20%7C%20OpenRouter-6366f1.svg)
![Resend](https://img.shields.io/badge/Resend-Verified%20Domain-black.svg?logo=resend)

---

## 📜 Version & Changelog

CourseIT Ai maintains a strict single source of truth for all releases:
* **Current Production Version**: `v1.19.2 LIVE Beta` ([`src/constants/version.js`](src/constants/version.js))
* **Release Checklist & Policy**: [**VERSIONING.md**](VERSIONING.md)
* **Full Changelog**: [**CHANGELOG.md**](CHANGELOG.md)
* **License**: [**MIT License**](LICENSE)
* **Latest Production Commit**: [`master HEAD`](https://github.com/Kenn2201/CourseIT-AI/commit/master)

### Latest Release: v1.19.2 LIVE Beta (September 20, 2026) — *Production Bug Fixes & Profile UI Transparency*

* **Generation Polling 404 Fix**: Fixed infinite polling loop on non-existent job endpoints; now stops immediately and displays a clear error state.
* **Provider Rate Limit Clarity**: Eliminated false "Generation Paused" messages on 429/402 errors; now shows terminal "Generation Failed" with frozen elapsed timer.
* **Profile Credits Transparency**: Renamed "Remaining Course Credits" to "CourseIT Credits" with disclaimer that credits are internal usage units, not USD.
* **Data & Account Management**: Added Clear Learning Data, Archive Account, and Delete Account options to user profile.

> 📖 **Full Historical Changelog**: To keep this README focused and concise, all historical release notes from v1.19.0 down to v1.0.0 are maintained separately in [**CHANGELOG.md**](CHANGELOG.md).

---

## ⚡ What is CourseIT Ai?

Standard technical documentation is often filled with introductory scene-setting, marketing fluff, and wall-of-text explanations that trigger cognitive fatigue. 

**CourseIT Ai solves developer ADHD and documentation fatigue** by transforming any documentation URL or scanned image into an **action-first, numbered curriculum**:

* **One Concept per Step**: Never bundles multiple concepts together.
* **No Scene-Setting**: Immediately starts with the action or command.
* **Concrete Time Estimates**: Each step includes an actionable estimate (e.g. `~5 min`).
* **Relevant Commands & Code**: Commands, code examples, and exact edits are included when relevant.
* **Pro Tips & Gotchas**: Callouts of common pitfalls, edge cases, and subtle failure modes.
* **Client-Side OCR (Tesseract.js)**: Drag & drop scanned textbook pages, notes, or screenshots for instant local text extraction.
* **Course Export**: Download **Markdown (.md)** or an HTML-based **Word-compatible .doc** file; use your browser's Print / Save as PDF action for PDF.
* **Scripted Technical Companion Tutor**: Embedded interactive assistant with 4 instant scripted action chips ("Explain simply", "Show code", "Common gotchas", "Quick quiz").

---

## 💡 Design Inspiration

CourseIT was inspired by the [`i-have-adhd`](https://github.com/ayghri/i-have-adhd) agent philosophy. Its ADHD-friendly, action-first design is directly shaped by that emphasis on:
* **Direct actions** over passive scene-setting
* **Numbered steps** with single clear concepts
* **Minimal tangents** to protect working memory
* **Concise explanations** that get straight to the mechanism
* **Concrete next steps** with runnable code and commands when relevant

*(Note: CourseIT Ai is an independent project and is not officially affiliated with `i-have-adhd`.)*

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 6 | Reactive interface with StrictMode resilience, motion primitives, and lazy initialization |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Curated dark & light modes with custom glassmorphism, marquee animations, and print rules |
| **Serverless Backend** | Netlify Functions (Node 22) | Universal serverless API router with JWT session verification |
| **Extraction** | Mozilla Readability + JSDOM | High-speed server-side HTML scraping and article isolation |
| **OCR** | Tesseract.js | In-browser client-side optical character recognition |
| **AI Routing** | Gemini, Cerebras, Groq, Mistral, OpenRouter | Multi-provider fallback cascade with AST zero-fluff validation |
| **Authentication & Legacy Courses** | Appwrite Cloud (Sydney `syd1`) | OAuth2 (Google & GitHub), email auth and existing course documents |
| **Application State** | Netlify Blobs | Persistent courses, credits, approvals, history, feedback and maintenance |
| **Email Delivery** | Resend API | Transactional emails dispatched from `CourseIT <hello@courseit.kenncode.me>` |
| **Error Monitoring** | Sentry (`@sentry/react`, `@sentry/node`) | Production exception telemetry with client and server error boundaries |
| **Hosting & CI/CD** | Netlify | Automated continuous deployment directly connected to GitHub |

---

## Runtime Architecture (Source-Verified; Deployment Checks Pending)

```text
Namecheap DNS (provider reported by owner)
  └─ courseitai.kenncode.me → Netlify CDN → React/Vite browser app
                                      │          ├─ Appwrite Auth (sessions, OAuth, verification)
                                      │          └─ optional Sentry browser errors
                                      └─ /api/* → Netlify Functions
                                                   ├─ Appwrite JWT verification
                                                   ├─ Netlify Blobs (courseit-state)
                                                   ├─ legacy Appwrite Database reads
                                                   ├─ Modular LLM (Gemini -> Cerebras -> Groq -> Mistral -> OpenRouter)
                                                   ├─ Resend emails
                                                   └─ optional Sentry server errors
```

Doppler is available as a local development command; production secret synchronization with Netlify has not been verified. Signed-in OCR source images now use a separate private Netlify Blobs store, not Appwrite Storage; production persistence still needs an authenticated deployment test. Previously generated OCR originals were never stored and cannot be recovered. Sentry sends no events unless its DSNs are configured. The local Appwrite API key returned `401` during this audit, so live Auth totals, provider settings, collections, and buckets still require console access.

| Data | Current source of truth | Important limit |
| :--- | :--- | :--- |
| Identity, email verification, OAuth sessions | Appwrite Auth | Total Auth count requires a server key with Users read scope. |
| Approval, credits, account generation transactions | Netlify Blobs `users/<id>` | Legacy Appwrite quota records may be read for migration. Embedded transaction arrays are not a separate immutable ledger. |
| Guest trial and guest transaction history | Netlify Blobs `settings/guest-quota` | One global shared three-per-24-hour allowance. |
| New courses, feedback, maintenance, secondary usage logs | Netlify Blobs | Course, charge, and secondary log are separate writes; production reconciliation remains necessary. |
| Older course records | Appwrite Database | Read-only catalog fallback, currently scanned rather than indexed by visibility. |
| New signed-in OCR source images | Netlify Blobs `courseit-sources` (local binary files in development) | PNG/JPEG/WebP up to 4 MB; owner/admin read, owner-only write. Upload happens after generation, so a failed upload leaves the course but no original. Guests retain images only on-device; older originals are unavailable. |
| UI preferences/cache | Browser `localStorage` | Not an authorization or credit-balance authority. |

Signed-in courses default to **Private** (owner/admin). **Community** requires a signed-in account; **Public** is readable without login. Guest courses are public and expire after 30 minutes. Anonymous catalog responses are capped at three recent public generated courses; a Blob feed index avoids a full scan once it contains three active courses. Older public records fall back to a legacy scan until an index migration is completed. Curated starter examples are separate client-side content.

The optional topic workflow inspects one SSRF-checked documentation page, ranks same-origin links, asks the user to choose a section, and then generates from that section. It does not crawl a site or guarantee that every navigation item will be found.

Generation requests now use a client request ID and a durable `generation-jobs/<id>` status record. The progress dialog polls recorded stages rather than displaying a timed percentage. Repeating the same request ID returns the existing result or current state; an interrupted job with uncertain completion is **not** automatically regenerated. Gemini 429 responses show a bounded retry countdown when the provider supplies timing. New server-backed courses and browser-only historical records are distinguished in history; removing a historical-only card clears the browser copy, not server credit history.

### Manual service setup

- In GitHub, create an OAuth App under **Settings → Developer settings → OAuth apps**. Set Homepage URL to `https://courseitai.kenncode.me`; copy the **exact Authorization callback URL shown by Appwrite's GitHub provider**. Do not use CourseIT's `/auth/success` URL as GitHub's callback.
- In Appwrite Auth, enable the GitHub provider and enter its Client ID/Secret; register `courseitai.kenncode.me` as a Web platform. No repository scope is required for basic sign-in. Keep the GitHub secret in Appwrite, not a `VITE_` variable or this repository.
- For Admin's **Total Appwrite Auth Accounts**, give the server-only Appwrite API key the required Users read permission. Until then the dashboard intentionally says **Unavailable**; it never substitutes application-profile count.
- If the existing `APPWRITE_API_KEY` is intentionally limited to course/database reads, set a separate server-only `APPWRITE_USERS_API_KEY` with `users.read` scope in Netlify/Doppler for the Admin Auth overview. It must target the same Appwrite project and endpoint; never prefix it with `VITE_`. Provider identities are shown when the same key can list them.
- For email verification, ensure the Appwrite Web platform accepts `https://courseitai.kenncode.me/auth/verify`, then test a disposable email/password account end to end.
- To enable error monitoring, set `VITE_SENTRY_DSN` at frontend build time and `SENTRY_DSN` for Functions. Verify test events and privacy scrubbing in Sentry before relying on it. Do not put a Sentry auth token in browser variables.

---

## 🚀 Getting Started

### Storage and regression checks

Production uses a site-wide `courseit-state` Netlify Blobs store through modern Netlify Functions. Runtime credentials are supplied by Netlify; no extra storage key is required. Credit updates use [strong consistency and conditional writes](https://docs.netlify.com/build/data-and-storage/netlify-blobs/). Local development stores state in ignored `server/data/state/` (override with `COURSEIT_DATA_DIR`). Do not place secrets or this local state in Git.

Run `npm test` for isolated regression checks (mock AI/auth, no real emails) and `npm run build` before deployment. Credit history begins with this release; old temporary data cannot be recreated. Existing Appwrite source-image uploads are not deleted by the new guest-course cleanup.

### 1. Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) `>= 22.20.0` (Netlify uses `v22.x`)
* [npm](https://www.npmjs.com/) `>= 9.x`
* [Git](https://git-scm.com/)

---

### 2. Clone the Repository

```bash
git clone https://github.com/Kenn2201/CourseIT.git
cd CourseIT
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
# Server-only AI generation (Gemini primary; configured fallbacks: Cerebras -> Groq -> Mistral -> OpenRouter)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
LLM_API_KEY=your_gemini_api_key_here
CEREBRAS_API_KEY=your_cerebras_api_key
GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Appwrite Cloud (Sydney syd1)
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_collection_id

# Appwrite Server API Key (for server handlers)
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_COLLECTION_ID=your_collection_id
APPWRITE_API_KEY=your_appwrite_server_key

# Resend Transactional Emailer
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=CourseIT <hello@courseit.kenncode.me>

# Platform Administrator Email
ADMIN_EMAIL=your_admin_email@example.com
VITE_ADMIN_EMAIL=your_admin_email@example.com
```

---

### 5. Run the Local Development Server

```bash
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 🌐 Netlify Production Deployment

To connect and deploy the repository to Netlify:

1. **Import Project**: Log in to Netlify, click **Add new site > Import an existing project**, and select your GitHub repository (`Kenn2201/CourseIT`).
2. **Build Settings**:
   * **Build command**: `npm run build`
   * **Publish directory**: `dist`
   * **Functions directory**: `netlify/functions` (auto-detected via `netlify.toml`)
3. **Environment Variables**: Under **Site configuration > Environment variables**, add all environment variables listed above. The AI keys are server-only: use the exact uppercase names, make them available to Functions in Production, and never prefix them with `VITE_`. If Doppler supplies Netlify's variables, confirm they reach the deployed function runtime, not just the build. Gemini remains primary; on a temporary provider limit or outage the server tries configured Cerebras, Groq, Mistral, then OpenRouter free. Missing fallback keys are skipped. CourseIT records the actual provider/model and charges a fallback generation at the Flash Lite credit tier.
4. **Trigger Clean Deploy**: If environment variables are added or changed, click **Deploys > Trigger deploy > Clear cache and deploy site** to ensure Vite compiles the frontend bundle with the latest values.
5. **Authorize Appwrite Web Platform (CORS)**:
   * Open your [Appwrite Cloud Console](https://syd.cloud.appwrite.io) (Sydney `syd1`).
   * Navigate to your project > **Overview** (or **Settings**) > **Platforms**.
   * Click **Add Platform** > **Web App**.
   * Enter:
     * **Name**: `CourseIT Production`
     * **Hostname**: `courseitai.kenncode.me`
   * *(Optional)* Add a secondary platform with Hostname `*.netlify.app` or your preview domain.
   * *Critical*: Without registering your domain as a Web Platform, Appwrite Cloud will reject client-side authentication and session requests with `403 Forbidden` and block CORS.

---

## 🌲 Git Branching Strategy

The repository follows a clean branch workflow:

| Branch | Purpose |
| :--- | :--- |
| `master` | Stable, production-ready releases deployed to Netlify. |
| `kenn/develop` | Active development, feature iterations, and beta testing. |

---

## 🧩 Key Architecture Highlights

```text
project-3-CourseIT/
├── netlify/
│   └── functions/
│       └── api.js        # Universal serverless REST API function for Netlify deployment
├── server/
│   ├── handler.js        # Core business logic: Appwrite sync, quotas, emailer, safe fallback
│   ├── llm/              # Modular LLM pipeline (Gemini, Cerebras, Groq, Mistral, OpenRouter)
│   │   ├── manager.js    # Fallback cascade orchestrator
│   │   ├── errors.js     # Error classification & retry policies
│   │   └── providers/    # Provider modules (gemini, cerebras, groq, mistral, openrouter)
│   ├── llm.js            # Backward-compatible delegation entrypoint
│   ├── extract.js        # Web scraper with Readability content purification
│   └── data/             # Local fallback JSON stores (users_quota, token_usage, feedback)
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── reactbits/           # Tasteful motion primitives (ShapeGrid, RotatingText, FadeContent, LogoLoop)
│   │   ├── CourseTutor.jsx      # Scripted technical companion tutor
│   │   ├── UrlInputForm.jsx     # URL & OCR input with locked tier cross-out & modal
│   │   ├── StepItem.jsx         # Numbered step card with code blocks & checklists
│   │   ├── AdminModal.jsx       # Auth modal with OAuth, email login, and freeze protection
│   │   └── Navbar.jsx           # Global header with dynamic avatar sync & credit badge
│   ├── pages/
│   │   ├── Landing.jsx          # ADHD-friendly showcase page with RotatingText, LogoLoop & Anti-Fluff Diff
│   │   ├── Dashboard.jsx        # Course catalog, live quota counter, generation pipeline
│   │   ├── CourseDetail.jsx     # Full learning path with print-to-PDF, .doc, and .md export
│   │   ├── Profile.jsx          # Custom PFP photo upload & workspace telemetry metrics
│   │   ├── Admin.jsx            # Admin operations & Maintenance mode toggle
│   │   └── Maintenance.jsx      # Animated maintenance status screen with Admin Bypass
│   ├── constants/
│   │   ├── version.js           # Single source of truth for versioning (v1.17.0 LIVE Beta)
│   │   └── presets.js           # Curated avatar presets
│   ├── lib/
│   │   ├── appwrite.js          # Appwrite client SDK initialization with resilient fallbacks
│   │   ├── auth.js              # Auth & session guards with ensureAccount lazy init
│   │   └── ocr.js               # Client-side image OCR and text-file reading
│   └── data/
│       ├── changelog.js         # Interactive version history source of truth
│       └── starterCourses.js    # Built-in public cross-ecosystem templates
├── netlify.toml          # Netlify build, redirects, and function bundler config
├── vite.config.js        # Vite build config + local dev API middleware + env define
└── package.json
```

---

## 🛡️ License

Built with ❤️ by [Kenn Nacario](https://kenncode.me) for developers who value their time.  
Licensed under the [MIT License](LICENSE).
