# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.19.2] - 2026-09-20 — Production Bug Fixes & Profile UI Transparency (LIVE Beta)

### Fixed
- **Generation Polling 404 Loop**: Fixed client-side infinite polling against non-existent or deleted job endpoints. Client now stops polling immediately and displays a clear error state instead of cycling indefinitely through 404 responses.
- **Provider Rate Limit False "Paused" State**: Eliminated misleading "Generation Paused" messages on provider billing exhaustion (402/429 errors). Terminal failure states now show "Generation Failed" with elapsed timer frozen at error timestamp instead of continuing to count upward.
- **Invalid Summarize Payload Handling**: Added explicit fallback error messages for 400/413/422 validation/payload errors. Early request validation now prevents polling loops from starting on initial generation request failures.
- **Source-Read Failure Progress**: Improved terminal state detection in generation pipeline. Elapsed timer now freezes immediately when source documentation extraction fails instead of displaying false progress.

### Changed
- **Profile Credits Terminology**: Renamed "Remaining Course Credits" to "CourseIT Credits" with expanded clarification: "Used for AI course generation and contextual Tutor requests. CourseIT credits are internal usage units and do not equal cash, USD, or provider API dollars."
- **Profile Pricing Display**: Added Tutor mode costs to pricing card breakdown (Quick: 0.1 cr, Normal: 0.25 cr, Deep: 0.5 cr) alongside generation model tier costs.
- **Profile Data Management**: Added new "Data & Account Management" section with Clear Learning Data, Archive Account, and Delete Account Permanently options (UI ready with handler implementation ready for next phase).

### Improved
- **Telemetry Discrimination**: All generation path recordTokenUsage calls now include explicit `requestType: 'course_generation'` parameter. Verified Tutor path includes `requestType: 'tutor_query'`. Admin analytics can now accurately separate Tutor usage from course generation events.
- **Error Guidance**: Consistent fallback messages guide users toward actionable fixes when generation input fails validation (e.g., "Check your source URL or text and try again" for 422).

### Verified
- All 70 regression tests passing (auth, generation pipeline, tutor quotas, billing, telemetry)
- No stale bearer tokens sent on public/guest requests; optional auth flows preserve guest Tutor access
- Billing metadata accurately recorded with requested/actual provider/model/tier details and chargedCredits vs maximumCreditCost

## [1.19.1] - 2026-09-19 — Tutor Reliability & Starter Course Fixes (LIVE Beta)

### Fixed
- **Curated Starter Course Tutor Support**: CourseTutor now resolves static starter courses (`starter-react-server-components`, `starter-godot-signals`, etc.) seamlessly without throwing 404 Course not found. Starter courses without source chunks rely on structured step content without generating fabricated source references or fake citations.
- **Credit Charging After Success**: Tutor credits are now verified beforehand but charged only after upstream AI completion succeeds. If providers fail with 429, 5xx, or network timeouts, user credit balances remain untouched.
- **Strict `stepIndex` Validation**: Out-of-bounds, negative, fractional, or malformed step indexes now reject immediately with HTTP 400 Bad Request instead of silently falling back to Step 1.

### Improved
- **Shared Course Resolution (`server/catalog.js`)**: Created a unified `resolveCourse(courseId, session)` helper shared between persistent storage and curated templates with strict ownership checks for private courses.
- **Tutor Prompt Bounding**: Enhanced step context with code snippets and pro-tips for all learning modules.

## [1.19.0] - 2026-09-19 — Interactive Course Tutor, Zero-Cost Checkpoints, and Adaptive Learning (LIVE Beta)

### Added
- **Interactive Context-Aware Course Tutor (`/api/tutor`)**:
  - Bound to the learner's active step with bounded context prompt construction (system instructions, step context, and 2–4 targeted source chunks).
  - Three response modes: **Quick** (concise 2–3 sentences, ~150 tokens), **Normal** (balanced explanation with code snippets, ~400 tokens), and **Deep** (in-depth mental models and edge cases, ~800 tokens).
  - ADHD-friendly **"I'm Stuck" Modal**: specialized error troubleshooting flow allowing users to paste error stack traces and select stuck categories ("I got an error", "I don't understand", "The code didn't work", "I need an example").
  - `[Show source]` inline viewer for grounded answers referencing stored documentation chunks.
- **Zero-Cost Local Checkpoints**:
  - Pre-generated step checkpoints (`question`, `options`, `correctIndex`, `explanation`) evaluated 100% locally in the browser with immediate "Correct!" or "Not quite" feedback without spending AI tokens.
  - "Quiz me" button immediately serves the pre-generated checkpoint at zero token cost; AI is only queried if the user explicitly requests an additional quiz.
- **Course v2 Schema & Source Chunking (`server/courseChunks.js`, `server/courseSchema.js`)**:
  - Rich step structure: `goal`, `why`, `actions`, `expectedResult`, `commonMistakes`, `checkpoint`, `suggestedQuestions`, and stable `sourceRefs`.
  - Content chunker segmenting documentation into 1,500–3,000 character chunks with 200–400 character overlap while strictly preserving code blocks and heading boundaries.
  - 4-tier chunk retrieval: Step `sourceRefs` → Heading/title matching → Keyword scoring → Course fallback.
- **Independent Quota & Fine-Grained Pricing**:
  - Separate guest tutor quota (15 messages/day) stored under `settings/guest-tutor-quota`, completely independent of the 3 course generation/day limit.
  - Granular tutor credit deductions: Quick (0.1 cr), Normal (0.25 cr), Deep (0.5 cr). Zero charges on failed upstream provider requests.
- **Adaptive Understanding & Resume Experience**:
  - Clean separation between step completion (`not_started` / `completed`) and step comprehension (`unknown` / `understood` / `needs_review`).
  - Welcome back banner upon reopening courses with direct 1-click continuation to the last active step.

### Changed and Hardened
- Preserved 100% backward compatibility with legacy courses: legacy steps (`summary`, `implementation`) automatically bridge to Course v2 format at read/render time without destructive database migrations.
- Modularized schemas and prompt logic cleanly into `server/courseSchema.js` and `server/llm/prompts.js`.
- Preserved existing multi-provider fallback cascade for tutor queries (`Gemini → Cerebras → Groq → Mistral → OpenRouter`).

## [1.18.0] - 2026-09-19 — Interactive Motion Suite, 404 Experience, and Real-Time QOL (LIVE Beta)

### Added
- **Interactive CardSwap Component**: Added 3D stacked card transformation pipeline on the landing page demonstrating the concrete transformation from messy documentation to an action-first curriculum and practice tests.
- **GSAP SplitText Animation**: Implemented word-by-word entrance motion on the hero tagline with graceful `prefers-reduced-motion` fallbacks to ensure instant readability without ADHD-distracting character stutter.
- **Terminal TextType Generation Status**: Integrated animated typewriter console output in `LoadingPipeline.jsx` dynamically cycling through real extraction and generation stages.
- **Live Telemetry CountUp**: Added GSAP counter animation to real account metrics (remaining credits, generated courses, processed tokens) in `Profile.jsx` using strictly genuine data without simulated marketing fluff.
- **Dedicated 404 Not Found Page**: Created full-page route `NotFound.jsx` with an interactive glitch/fuzzy canvas (`FuzzyText.jsx`) and direct actions to return to home or explore the curriculum catalog.
- **Light/Dark PixelSwap Theme Toggle**: Integrated high-performance diagonal pixel-swap toggle with keyboard accessibility (`Enter`/`Space`) and reduced-motion detection.

### Changed and Hardened
- Installed core animation foundation `@gsap/react` and `gsap` without bloated 3D or WebGL bundles, keeping runtime footprint minimal.
- Preserved existing custom motion primitives (`RotatingText.jsx`, `FadeContent.jsx`, `LogoLoop.jsx`, `ShapeGrid.jsx`) without duplicate dependencies.
- Added catch-all route `path="*"` in `App.jsx` pointing to `NotFound.jsx` for graceful broken-link recovery.

## [1.17.0] - 2026-09-19 — ADHD Action-First Positioning and UI Motion Refresh (LIVE Beta)

### Added
- **Tasteful Landing Page Motion**: Introduced accessible `RotatingText` for dynamic headline rotation, `FadeContent` viewport entrance animations, and a `LogoLoop` production infrastructure ticker.
- **Design Inspiration Attribution**: Formally documented project inspiration from the [`i-have-adhd`](https://github.com/ayghri/i-have-adhd) philosophy (action first, numbered steps, minimal tangents, and concrete next actions).
- **Expanded 4-Step Synthesis Pipeline**: Clarified learning module creation into 4 distinct phases: Source & Focus Selection, Content Purification, Action-First Module Generation, and Practice Progress.

### Changed and Hardened
- Replaced absolute fluff claims across Landing, Dashboard, CourseTutor, and AntiFluffDiff with accurate action-first phrasing.
- Updated user-facing model tiers to provider-agnostic names: Fast Tier (0.5 cr), Balanced Tier (1.0 cr), Deep Tier (2.0 cr), and Maximum Depth Tier (5.0 cr).
- Updated Landing, Footer, and README badges to accurately describe multi-provider AI routing (Google Gemini, Groq, Mistral, OpenRouter).
- Verified `prefers-reduced-motion` compliance across all animation components to ensure zero disorientation for motion-sensitive users.

## [1.16.0] - 2026-09-19 — Modular LLM Pipeline and Multi-Provider Fallback (LIVE Beta)

### Added
- **Multi-Provider Fallback Cascade**: Orchestrated automatic fallback order `Gemini → Cerebras → Groq → Mistral → OpenRouter`.
- **Cerebras Inference Provider**: Added OpenAI-compatible fast LPU inference support with `CEREBRAS_API_KEY` (Llama 3.1 8B).
- **Modularized LLM Subsystem**: Structured `server/llm/` into `manager.js`, `errors.js`, and dedicated provider modules (`gemini.js`, `cerebras.js`, `groq.js`, `mistral.js`, `openrouter.js`).
- **Granular Error Handling**: Strict fallback criteria that only cascades on 429 rate limits, timeouts, temporary 5xx errors, and service outages, while immediately rejecting 400 Bad Request and 401/403 auth errors without fanning out.

### Fixed and Hardened
- Preserved single generation request ID across all fallback attempts; guarantees zero duplicate courses created and single credit deduction.
- Safe missing key handling skips unconfigured providers without throwing runtime credential errors.
- Added comprehensive unit and regression tests covering all 8 provider lifecycle conditions and idempotency rules (52 / 52 passing).

## [1.15.0] - 2026-09-19 — Reliable Generation and Honest History (LIVE Beta)

### Added
- Store a durable generation request ID and recorded process stages; show those stages in a viewport-fixed progress modal instead of timed percentages.
- Display bounded provider retry timing and a countdown for Gemini rate limits. Retry the same request ID without starting duplicate work or charges.
- Support a separate server-only Appwrite Users-read key and display Auth verification/provider information when the key permits.

### Fixed and Hardened
- Stop fallback Gemini calls after a 429; return safe error codes and avoid exposing provider stack traces.
- Distinguish browser-only historical course records from server-backed courses. Removing a stale record clears local cache; server deletion retains owner checks.
- Add safe request/stage error logs and opt-in Sentry flush for unexpected server failures.

### Verification and Limits
- Local regression tests, frontend build, and function bundle pass. Live Gemini, Appwrite Auth, Sentry, and responsive modal checks remain pending.
- The reported Semaphore course returned 404 to an anonymous production read, but its owner-side storage/deletion state could not be verified. Same-request duplicate protection is not a cross-store atomic ledger.

## [1.14.0] - 2026-09-18 — Private Learning Workflows and Durable Source History (LIVE Beta)

### Security and Privacy
- Default signed-in courses to Private; validate Private, Community, and Public permissions on the server and redact non-owner metadata.
- Add authenticated owner/admin access for newly saved OCR source images; anonymous catalog responses remain limited to three public courses.

### Added and Changed
- Offer bounded, same-site documentation section discovery and record original, selected, and resolved source URLs.
- Preserve new signed-in PNG/JPEG/WebP OCR originals in a private binary store with course/history previews and normal course-deletion cleanup.
- Reconstruct admin generation metrics from durable account and guest transaction histories, separate Auth-account totals from application profiles, and show unknown totals honestly.
- Add Appwrite email-verification UI, opt-in privacy-filtered Sentry, a React error boundary, and viewport-aware modal behavior.
- Read guest quota from the server on startup and after generation; clarify global guest/public-trial behavior.

### Verification and Limits
- Local regression tests, frontend build, and Netlify function bundle pass. Live OAuth, email, Sentry, storage persistence, responsive dialogs, and production accounting still require controlled checks.
- Historical OCR originals and unrecorded token history cannot be recovered. Exact-once generation accounting and full legacy catalog indexing are not included.

## [1.13.2] - 2026-09-18 — Production Safety and Account Recovery (LIVE Beta)

### Security
- Restrict documentation fetches to public HTTP(S) destinations, recheck DNS and redirects, pin vetted addresses, and cap HTML responses at 1 MB.
- Require a verified Appwrite session for signup registration and feedback identity; reject oversized API bodies and text input.
- Reserve guest slots and account credits before AI work, releasing reservations on failure; update Readability past its security advisory.

### Fixed
- Replace the nonfunctional password-reset code with an Appwrite recovery-link request and password update page.
- Preserve feedback message and verified sender, escape feedback email HTML, and await signup/feedback email dispatch outcomes.
- Reuse session quota data, show unavailable credits without invented balances, and avoid full usage scans on ordinary quota reads.
- Parallelize independent catalog reads and remove unsupported PDF upload and unverified landing-page claims.

### Verification
- Added regression coverage for URL policy, feedback, signup identity, quota reservations, and request limits. Production provider, OAuth, and email delivery remain to be verified with test accounts.

## [1.13.1] - 2026-09-18 — Application Startup Hotfix (LIVE Beta)

### Fixed
- Moved shared Appwrite client initialization into a dependency-free application module, breaking the authentication/catalog import cycle behind the production `Cannot access 'Ai' before initialization` crash.
- Preserved existing client exports and shared account/client identity.

### Tests
- Execute minified Vite/Rollup startup bundles with Appwrite configured and unconfigured; the new tests reproduced the initialization error before the fix.

## [1.13.0] - 2026-09-18 — Public Course Sharing, Durable Credits & Reliable AI Jobs (LIVE Beta)

### Added
- Public community courses with explicit sharing controls, author/admin publication of older courses, and recent generated-course links below the Studio prompt.
- Persistent credit transaction history in Profile and Admin, including fractional deductions, top-ups, balances and generation token totals.
- Netlify Blobs storage for courses, accounts, approvals, feedback, usage and maintenance settings, with conditional writes protecting concurrent credit updates.

### Fixed
- Removed cross-account URL-cache reuse that could return another author's private course or overwrite their content.
- Read legacy creator metadata from serialized course steps, paginate all Appwrite results, preserve distinct account IDs and remove synthetic account placeholders.
- Maintenance changes now require verified admin identity, persist server-side, and report write failures instead of showing false success.
- Share one API implementation between local development and modern Netlify Functions; verify session identity for privileged requests.
- Bound AI retries and source-fetch timeouts, surface useful provider/gateway errors, and charge only after successful generation and course persistence.
- Validate account-session JWTs during the initial quota fetch instead of relying on stale browser auth state.

### Changed
- Guest course access expires after 30 minutes, with physical cleanup scheduled every 5 minutes. Signed-in saved courses are retained.
- OCR source images remain on the user's device; generated course text follows the selected visibility policy.
- Existing private courses remain private until explicitly published. The shared guest trial remains three generations per 24-hour reset.
- Legacy Appwrite courses remain available. Missing temporary account records may be recovered from known course authors or sign-in, but lost balances and historical usage are not fabricated.
- Added automated regression coverage for authorization, expiry, maintenance, pagination, generation failures and conditional credit updates.

## [1.12.2] - 2026-09-18 — Email Suite Crash, Course Visibility, Admin Dedup & Loop Fixes (LIVE Beta)

### Fixed & Hardened
- **Email Suite `ReferenceError` Crash**: `customEmailBody` state variable was never declared — clicking Email Suite caused an immediate `Uncaught ReferenceError`. Added the missing `useState` declaration with a sensible default template.
- **Duplicate Admin User in Panel**: `listAllUsers()` was deduplicating by `user_id`, but the same admin email can exist under two different `user_id` records in Appwrite. Changed merge key to **email address** so the same person is never shown twice.
- **System Documents Leaking into Course Catalog**: When admin is logged in, all Appwrite documents were returned including `system://maintenance` flag and courses created by `creator_id: 'system'`. Added explicit filter to exclude all `source_url: 'system://*'` and `creator_id: 'system'` documents from course lists.
- **Guest Courses Appearing in Community Section**: The community section showed guest-created courses from other sessions. Properly isolated by the existing `creator_id` filter (now that system docs are excluded, the admin view is clean).
- **CourseDetail Page Infinite Reload Loop**: `useEffect` had `user` (unstable object reference) as a dependency — triggered a re-fetch on every render. Replaced with stable `user?.id` primitive.
- **Top-Up Credits Not Persisting**: `topUpUserCredits()` had the same `user.$id` cold-start bug as approve. Now queries Appwrite by `user_id` before updating.

## [1.12.1] - 2026-09-18 — Approval Persistence & Quota Source-of-Truth Fix (LIVE Beta)

### Fixed & Hardened
- **Root Cause: User Approvals Reverting to Pending After Reload**:
  - `approveUserAndSendEmail()` was silently skipping the Appwrite write whenever the cached `user.$id` was missing (which happens every serverless cold-start that wipes `/tmp`). The function now explicitly queries Appwrite by `user_id` to find the correct document before updating — cold-starts cannot break this anymore.
  - If no Appwrite record exists for the user at all (edge case), one is created automatically during the approval flow.
- **Appwrite Promoted to Source of Truth for Quota Reads**:
  - `getUserQuota()` was reading the local `/tmp` file cache *first*, meaning a stale `pending` record from a cold-start would shadow the approved state in Appwrite. Reversed the priority — Appwrite is now checked first on every request; local file is only a fallback if Appwrite times out or is unreachable.
- **Email & Link Fixes**:
  - Approval email CTA link corrected from `http://localhost:5173` to `https://courseitai.kenncode.me`.
  - Approval email sender corrected to `hello@courseit.kenncode.me`.

## [1.12.0] - 2026-09-18 — Persistent Global Maintenance Mode, UI Restoration & Admin Stability (LIVE Beta)

### Added
- **Appwrite-Backed Global Maintenance Mode**:
  - Maintenance mode flag is now stored as a system document in Appwrite Cloud (`system_maintenance_flag`) instead of browser-local `localStorage`.
  - Every browser polls Appwrite every 30 seconds — toggling maintenance from Admin Panel locks **all users globally** within ~30 seconds.
  - Same-browser toggle remains instant via local `CustomEvent` dispatch.
  - Offline / Appwrite-unavailable fallback gracefully reads from `localStorage` (stays in sync with last known Appwrite state).
  - `setMaintenanceMode()` creates the system document automatically on first use if it does not exist in the collection.

### Fixed & Hardened
- **Admin Panel Infinite Re-fetch Loop**:
  - Resolved root-cause of the Admin dashboard infinitely refreshing by replacing the `user` object (new reference every render) in `useEffect` dependencies with stable primitives `user?.id` and `user?.email`.
- **UI Restoration — Chatbot, Theme Toggle & Partner Badges**:
  - Restored `CourseTutor` chatbot launcher to the lower-left corner (`fixed bottom-6 left-6`) across all application routes.
  - Relocated the Light/Dark theme toggle into the Navbar header — always accessible regardless of scroll position.
  - Restored `Powered By` partner badges to the landing page footer via correct `showPoweredBy` prop.
- **Security Sanitization**:
  - Audited and scrubbed public-facing changelog, server handler, and documentation of internal API route paths, collection IDs, and personal emails.
  - Established `.agents/rules/versioning.md` as mandatory AI versioning protocol for all future commits.
- **Auth Diagnostics**:
  - Added `formatAuthError` diagnostic helper surfacing actionable Appwrite Web Platform CORS setup instructions when hostname is unregistered.

## [1.11.2] - 2026-09-17 — Serverless Evaluation Hotfix & Quota Engine Stabilization (LIVE Beta)

### Fixed & Hardened
- **Serverless Module Evaluation & Packaging Resilience**:
  - Eliminated serverless startup crash caused by bundler-injected module wrappers evaluating in AWS Lambda CommonJS execution environment.
  - Replaced environment-sensitive module path resolution with universal directory discovery, restoring 100% gateway uptime across all backend serverless endpoints.
  - Resolved 502 Bad Gateway failures on user quota retrieval and AI course generation in production.
- **Defensive Timeout Wrappers for Cloud Database Services**:
  - Protected backend session verification and user quota database queries with non-blocking race timeouts.
  - Guaranteed that slow external responses or cold network handshakes gracefully fall back without causing serverless function timeouts.
- **Administrator Role Verification & Storage Resiliency**:
  - Hardened administrator privilege verification and fallback directory initialization across serverless container recycling cycles.
  - Wrapped serverless quota session authentication in defensive exception handling to guarantee reliable guest and user fallbacks.

## [1.11.1] - 2026-09-17 — Serverless Production Hotfix & Connected Documentation (LIVE Beta)

### Fixed & Hardened
- **Serverless Worker Runtime & Fallback Protection**:
  - Resolved read-only filesystem crash on cloud serverless workers by directing runtime fallback data files to system temporary storage.
  - Wrapped all local file and directory access in safe exception handling blocks to guarantee serverless cold-start reliability.
  - Aligned serverless request handler parameters and function signatures with core processing pipelines.
  - Unified document extraction and OCR text synthesis within the universal serverless function router.
- **Authentication Decoupling & Cloud Parity**:
  - Decoupled pure user authentication from database collection dependencies, ensuring login and signup function smoothly even during schema migrations.
  - Configured default endpoint to the active regional cloud node.
  - Injected build-time environment mappings to automatically resolve prefixed and standard configuration variables.
  - Implemented resilient client authentication initialization with actionable setup diagnostics.
- **Serverless Build Configuration Syntax**:
  - Cleaned serverless bundler configuration syntax to guarantee reliable automated builds.
  - Enforced high-performance bundling with external module isolation.

### Documentation & Version Synchronization
- **Connected Documentation**:
  - Synchronized SemVer across version constants (`v1.11.1 LIVE Beta`), package metadata, in-app changelog, release documentation, and repository guides.
  - Linked commit references and established single source of truth guidelines.

## [1.11.0] - 2026-09-17 — Production Live Release, Netlify Serverless Routing & Security Hardening

### Security & Credential Scrubbing
- **Complete Public Repository Audit**:
  - Completely scrubbed all hardcoded project credentials, database identifiers, and collection references across configuration and source files.
  - Migrated entire platform configuration to strict environment variables with safe fallbacks ensuring no build-time crashes when credentials are absent.
  - Verified with repository-wide automated regex scanning — zero hardcoded credentials remain in tracked files.

### Backend & Deployment
- **Universal Serverless API Routing**:
  - Deployed universal serverless API router handling all backend endpoints under serverless execution with cryptographic session verification.
  - Configured wildcard path redirects routing application API requests to serverless workers.
  - Cryptographically verifies user session JWTs across all protected endpoints, preserving full parity with local development.

### Platform Features & UX
- **Platform Maintenance Mode**:
  - Implemented maintenance screen with real-time operational status indicators, countdown timers, and administrator bypass authentication.
  - Wired global maintenance route guards checking active operational environment variables and local administrative states.
  - Added interactive platform access toggle allowing authorized administrators to control public access on demand.
- **Profile Overhaul & Custom Avatar Photo Upload**:
  - Built client-side custom profile photo uploader with automatic cover cropping and compression.
  - Stored optimized image locally with instantaneous cross-component synchronization across navigation bars and profile views.
  - Preserved curated preset avatars with seamless switching.
  - Replaced redundant course lists in Profile with a comprehensive **Account Summary & Workspace Metrics** dashboard (custom syntheses count, reasoning credits, processed tokens) and direct studio access.
- **Authentication Modal Polish & Stability**:
  - Protected authentication state changes with exception handling to prevent dialog freezing on login completion.
  - Added browser autocomplete attributes (`email`, `current-password`, `new-password`, `name`) resolving DOM warnings.
  - Enforced body scroll locks and responsive centering preventing modal clipping on mobile and compact viewports.
  - Added pre-emptive session clearance during sign-in to prevent active session collision errors.
- **Global Rebranding & Tech Badges**:
  - Rebranded platform identity to **CourseIT Ai** across document titles, page headers, navigation, and footers.
  - Added tech stack partner badge strip celebrating ecosystem tools.

## [1.10.0-beta] - 2026-09-17 — Guest Flow Restoration, Anti-Fluff Enforcement & Platform Polish

### Fixed & Restored
- **Guest Flow Regression**:
  - Fixed client authentication requests to skip JWT token creation for unauthenticated guest sessions, preventing session verification scope failures.
  - Resolved guest courses directly from local storage, preventing 404 database queries and eliminating private access barrier blocks for guest visitors.
  - Allowed guest users to delete temporary guest courses locally without hitting backend authentication barriers.
  - Resolved navigation bar session refresh state synchronization on sign-in.
  - Cleaned dashboard navigation layout for unauthenticated guest visitors.

### Added & Improved
- **Anti-Fluff System Instruction**:
  - Hardened LLM system prompt with strict negative constraints (banning conversational padding like "In this section") and mandating imperative verbs and runnable code snippets.
  - Enforced single-concept step modularity with concrete execution time estimates.
- **Modern IDE Code Block UI**:
  - Designed macOS-style window controls (colored dot indicators), syntax badges, and one-click copy buttons.
  - Added dynamic language syntax detection (Dockerfile, Terminal / Bash, GDScript, Rust, TypeScript / React, JSON, Python).
- **Rich Starter Course Code Snippets & Live Scripted Companion**:
  - Added runnable code snippets, concrete implementation steps, and verified pro-tips for all curated starter courses (Docker Multi-Stage, React 19, Rust Ownership, Godot Signals).
  - Upgraded technical companion actions to present verified code snippets instead of generic placeholder text.
- **Catalog Structural Separation & Attribution Consistency**:
  - Split dashboard catalog into two distinct visual sections: "Curated Starters" and "Community & Custom Generated Courses".
  - Standardized author attribution across Course Cards, Generation History, Admin Management, and Profile with "Created by [user]" and temporary guest badges.
- **Actionable Generation Pipeline Error Handling**:
  - Replaced hanging or silent errors with actionable diagnostic messages (scraping, synthesis, or network issues) and a one-click [Try Again] button.
- **Login/Signup Modal Polish**:
  - Portaled authentication dialog directly to document body, centered input adornments, and added password visibility toggles.
- **Environment & Layout Polish**:
  - Repositioned floating feedback controls to eliminate overlap with docked technical companion.
  - Moved administrator contact configuration entirely to environment variables across frontend and server.

## [1.9.0-beta] - 2026-09-17 — Security Audit & Auth Hardening: Live Session Source of Truth, Backend JWT Verification, ACL Route Guards & Settings Engine

### Added
- **Unified Live AuthContext**:
  - Implemented centralized authentication context providing verified user identity, administrator role, authentication status, and credit balance across the component tree.
  - Linked credit accounting directly with authentication lifecycle to ensure synchronous updates.
- **Strict Course ACL & Starter Isolation**:
  - Namespaced public starter courses and isolated custom user courses: unauthenticated guests only view public starter templates.
  - Custom courses require verified author ownership or administrator privileges to view or delete; added dedicated 401/403 access error screens with return-to-safety navigation.
- **Interactive Dashboard Settings Page Controls**:
  - Implemented real-time functional controls for **Color Theme** (Dark / Soft Light), **ADHD Anti-Fluff Level** (Concise, Balanced, Exhaustive), and **Default Model Preference** (Gemini Flash Lite, Flash, Pro).
  - Synced default model selection directly to the generation input form.
- **Expanded Help & Architecture Documentation**:
  - Expanded Help workspace into an interactive knowledge base detailing documentation synthesis, client-side OCR upload limits, credit costs, and export workflows.

### Fixed & Hardened
- **Root-Cause Auth Session State Desync**:
  - Resolved session desync where unauthenticated visitors saw cached administrator states upon opening profile settings.
  - Removed outdated local storage caching fallbacks that preserved expired sessions on 401 response; now strictly purges session tokens and resets to guest state.
  - Stripped hardcoded administrator email fallbacks from user profile views and enforced an authentication required lock guard.
- **Server-Side Cryptographic JWT Verification Across Administrative Endpoints**:
  - Enforced cryptographically verified session JWT tokens across all administrative control and management endpoints.
  - Prevented identity spoofing and blocked unauthorized access to user emails, feedback, and admin actions.
- **Document Ownership Migration**:
  - Backfilled legacy course records with explicit creator ownership attributes, ensuring query filtering strictly retains rightful owner access.
- **Release Notes Scroll Fix**:
  - Updated all "Release Notes" links and hero badges to directly open the announcement modal without triggering unwanted page jumps.

## [1.8.0-beta] - 2026-09-17 — Consistency & Polish: Single Source of Truth for Version & Credits, Portalized Modals & Header Redesign

### Added
- **Single Source of Truth for Versioning**:
  - Created centralized constants authority exporting version metadata and release labels.
  - Added repository-level versioning maintenance guide for consistent release tagging.
  - Eliminated hardcoded version drift across logo pills, hero banners, footers, and modal headers.
- **Single Source of Truth for Credit Balance**:
  - Implemented centralized credit provider subscribed to live quota updates and balance refresh events.
  - Formatted credits dynamically without artificial display caps.
  - Refined quota accounting with exact decimal precision for accurate reasoning credit tracking.
- **Mandatory First-Login Legal Consent Flow & Audit Trail**:
  - Introduced non-dismissible consent dialog requiring explicit agreement to Terms of Service, Privacy Policy, and Cookies.
  - Stored consent timestamp and terms version directly on account preferences, establishing a durable, cross-device legal audit trail.
  - Automatically launches the Changelog "What's New" modal immediately upon consent acceptance for seamless onboarding.
- **Formatted Chatbot Typography Engine**:
  - Engineered zero-dependency typography parser for the companion bot.
  - Renders bold, italic, inline code tags, and bullet points into styled typography, replacing raw markdown syntax.

### Fixed & Hardened
- **Viewport-Centered Modal Portals**:
  - Mounted all interactive dialogs directly to the document body via React Portals.
  - Resolved deep-scroll offset bug on long landing pages and prevented CSS transform ancestor clipping.
- **Sidebar & Footer Layout Separation**:
  - Relocated footer inside the main workspace column in dashboard routes, preventing it from overlapping or spanning underneath the sidebar.
- **Softened Light Mode & Relocated Controls**:
  - Replaced glaring white tones with soft slate backgrounds and clean card surfaces.
  - Audited and updated WCAG text contrast tokens for secondary and colored accent elements.
  - Relocated theme toggles into the dashboard sidebar and an accessible toggle in the landing lower section.
- **Header Redesign & Infrastructure De-identification**:
  - Consolidated separate credits badge and sign-out button into a unified user profile dropdown menu.
  - Added prominent Dashboard navigation button on the public landing page when authenticated.
  - Completely removed internal cloud infrastructure labels from user-facing views.

## [1.7.0-beta] - 2026-09-17 — Dashboard Application Shell, Appwrite Serverless History, Light Mode Theming & Auth Hardening

### Fixed & Hardened
- **Model Picker & Tab Hitbox Optimization**:
  - Elevated z-index and isolated hitboxes so disabled generation states never impede tab switchers or model dropdowns.
- **Universal Light Mode Theming**:
  - Replaced non-interactive wrappers with semantic, fully clickable theme toggle buttons.
  - Added comprehensive universal light mode styling rules covering body, cards, panels, inputs, and borders across all pages.
  - Injected an inline theme initialization script to eliminate theme flashes on page reload.
- **Feedback & Chatbot Layout Polish**:
  - Adjusted button docking to prevent visual overlap between feedback controls and the technical companion.
- **Universal Server-Side Auth Re-verification**:
  - Implemented secure authentication client utilities alongside server-side session token verification.
  - Server endpoints independently verify session tokens, rejecting spoofed user IDs in request bodies.

### Added
- **Dashboard Application Shell with Sidebar**:
  - Restructured dashboard into an application shell featuring five distinct workspaces (Studio & Courses, Generation History, My Account, Preferences, Help & Docs).
- **Serverless Cloud Storage Architecture**:
  - Stored generation history and uploaded OCR documents in cloud database collections and storage buckets, ensuring persistence across serverless executions.
  - Enforced strict ACLs: users can read and delete their own history entries; administrators can audit and delete across all users.
- **Course Author Attribution & 24h Guest Purging**:
  - Added "Created by [User]" badges to course cards and detail page headers.
  - Guest generations automatically expire and self-delete after 24 hours.
- **Distinct Chatbot Scopes**:
  - Public Landing Mode: "CourseIT Guide" offering interactive product FAQ chips (Anti-Fluff Engine, Supported Inputs, Model Credits, Guest Trial).
  - Course Detail Mode: "Technical Companion" providing step-focused code explanations, runnable snippets, common bugs, and concept quizzes.

## [1.6.0-beta] - 2026-09-17 — Course Deletion Security ACL, Google OAuth Persistence & Visible Model Fallbacks

### Fixed & Secured
- **Critical Security: Course Deletion Access Control**:
  - Course deletion is strictly restricted to verified course authors or platform administrators.
  - Unauthorized visitors cannot access or trigger delete actions in the interface or API.
  - Starter catalog templates are permanently protected from deletion by non-admin visitors.
- **Google OAuth Session Persistence**:
  - Resolved session persistence for pending accounts, ensuring Google OAuth users remain signed in with active sessions.
- **Changelog Date Text Layout & Overflow Fix**:
  - Redesigned changelog cards to use responsive wrapping so dates never overflow or clip across any mobile viewport width.

### Added
- **Unified Pending-Approval Flow for Google OAuth**:
  - Google OAuth signups land in the identical pending approval queue as email signups, receiving acknowledgement emails and awaiting admin approval.
- **User-Visible Model Resilience Notices**:
  - When a higher-tier model encounters temporary upstream load and falls back to Flash Lite, users see an informative notification and are only charged for the actual model used.

## [1.5.0-beta] - 2026-09-17 — OAuth Token Resilience, Shared Guest Trials, Course Exports & Token Monitor

### Added
- **OAuth Execution Guard**:
  - Implemented execution locks preventing framework StrictMode from consuming one-time OAuth secrets twice.
- **Real-Time Database Credit Writeback**:
  - Quota deduction is strictly enforced per model and synchronized to the database quota collection.
- **Shared 3/3 Public Guest Trial Sandbox**:
  - URL generation and OCR document extraction share a single pool of 3 free runs per 24 hours with locked higher tiers.
- **Scripted Technical Companion**:
  - Embedded interactive companion on the public landing page and course detail views.
- **Course Content Export (PDF, DOCX, Markdown)**:
  - 1-click export to high-contrast PDF, formatted Word documents, and clean Markdown.
- **Admin Tester Emailer & Feedback Export**:
  - Direct email composer with dark-mode HTML templates and feedback export capabilities.
- **AI Token & Cost Monitor**:
  - Real-time token usage and cost tracking in the Admin dashboard.

## [1.4.1-beta] - 2026-09-17 — ADHD Anti-Fluff Engine, User Feedback, ThemeToggle & Security Hardening

### Added
- **ADHD & Low Attention Span Anti-Fluff Positioning**:
  - Official positioning: *"Built for developers with ADHD, documentation fatigue, or low attention spans. Zero AI fluff."*
  - Interactive **AntiFluffDiff** component comparing wordy LLM responses against CourseIT's direct numbered action steps.
  - Multi-ecosystem expansion: curated starter documentation for React 19, Rust, Docker, and Godot 4.
- **User Beta Feedback System**:
  - Interactive feedback dialog capturing star ratings, category selection, and notes, with an administrative review tab.
- **PixelSwap Animated Light Mode**:
  - Smooth animated transitions between Sun and Moon theme states with persistent storage.
- **Developer Portfolio Integration**:
  - Footer component featuring developer portfolio, GitHub, LinkedIn profile, and contact links.
- **Verified Transactional Email Suite**:
  - Verified sender configuration for user approval, password reset, quota adjustments, and welcome notifications.
- **Admin Details & Archive Modals**:
  - Management modal for inspecting users, adjusting credits, approving accounts, and reactivating archived accounts.

## [1.4.0-beta] - 2026-09-17 — Landing Page Separation, Step Readability & Scripted Companion

### Added
- **Dedicated Public Landing Page**:
  - Clear value proposition explaining the philosophy of "Action-First Learning Engine for Developers".
  - Dynamic interactive background using animated canvas grids.
  - "How It Works" 3-step workflow pipeline with spotlight presentation cards.
- **Clean Public & Authenticated State Separation**:
  - Complete logout state that thoroughly clears cloud sessions and local credentials.
  - Logged-out visitors access the rich Landing Page, while authenticated users access the full generator Dashboard.
- **Step Text Readability Revamp**:
  - Parsed multi-sentence implementation text into sequential vertical cards with badges.
  - High-contrast typography and styled terminal code blocks with one-click copy and actionable pro-tip callouts.
- **Scripted Technical Companion Bot**:
  - Dockable companion focused on the active course with 4 instant scripted action chips (explanation, code, gotchas, quiz).

## [1.3.0] - 2026-09-16 — 250 Credits, OAuth2 Token Flow, Profile & Model Cost Tiers

### Added
- **250 Course Credits Trial**: Accounts upgraded to 250 credits with live meter tracking in navigation and profile views.
- **OAuth2 Token Flow**: Direct integration with social OAuth handlers and secure callback verification.
- **Model Credit Pricing Tiers**: Flash Lite (0.5), 3.5 Lite (1.0), 3.6 Flash (2.0), 3.7 Flash (5.0).
- **User Profile Page**: Account management, password reset via email, credit meters, and stored course management.
- **Transactional Email Dispatching**: Verified transactional email delivery for user verification and password resets.

## [1.2.0] - 2026-09-16 — SaaS Architecture & Local Document OCR Release

### Added
- **Local Document Upload & OCR (Tesseract.js)**: Drag and drop scanned tutorial screenshots, diagrams, and text files with client-side OCR extraction.
- **Secure Cloud Storage**: Dedicated cloud storage bucket for user-uploaded documents and image assets.
- **Account-Based Quotas**: Default credit allocation with real-time sync across navigation bars and input panels.
- **Admin Approval Workflow**: Approval queue for beta tester registrations with automated approval email dispatch.

## [1.1.0] - 2026-09-16 — Public Release Announcement

### Added
- **Actionable Implementation Instructions & Code Snippets**: Each step provides setup navigation, runnable code snippets or CLI syntax, and practical pro-tips.
- **Recommended Next Step Guidance**: Courses suggest concrete follow-up topics and projects to tackle next.
- **URL Deduplication Cache**: Instant cached retrieval for previously synthesized documentation links.
- **Model Selector**: Live dropdown on the dashboard to select reasoning tiers.
- **In-App Announcement Modal**: Release notes and changelog dialog accessible across views.

## [0.1.0] - 2026-09-16

### Added
- Initial project scaffolding with Vite, React 19, and Tailwind CSS.
- Readability text extraction and content purification pipeline.
- AI model integration enforcing action-first prompt rules.
- Cloud database and local fallback storage layer.
- Interactive Dashboard with course catalog and completion checklists.
