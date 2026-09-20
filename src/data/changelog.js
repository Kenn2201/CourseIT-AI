export const CHANGELOG_DATA = [
  {
    version: 'v1.19.2 LIVE Beta',
    date: 'September 20, 2026',
    title: 'Production Bug Fixes & Profile UI Transparency',
    badge: 'Latest Release',
    highlights: [
      { title: 'Generation Polling 404 Fix', desc: 'Fixed infinite polling loop on non-existent job endpoints; now stops immediately and displays clear error state.' },
      { title: 'Provider Rate Limit Clarity', desc: 'Eliminated false "Generation Paused" messages on 429/402 errors; now shows terminal "Generation Failed" with frozen elapsed timer.' },
      { title: 'Profile Credits Transparency', desc: 'Renamed "Remaining Course Credits" to "CourseIT Credits" with disclaimer that credits are internal usage units, not USD.' }
    ],
    notes: [
      'Fixed source-read failures: improved terminal state detection to freeze elapsed timer and display extraction errors immediately.',
      'Added Data & Account Management section with Clear Learning Data, Archive Account, and Delete Account options.',
      'Added Tutor mode pricing display to profile (Quick: 0.1 cr, Normal: 0.25 cr, Deep: 0.5 cr).',
      'Verified explicit requestType parameter on telemetry for accurate generation vs Tutor discrimination in analytics.',
      'Added 400/413/422 error fallback messages to guide users toward actionable fixes.',
      'All 70 regression tests passing: auth, generation pipeline, tutor quotas, billing, and telemetry verified.'
    ]
  },
  {
    version: 'v1.19.1 LIVE Beta',
    date: 'September 19, 2026',
    title: 'Tutor Reliability & Starter Course Fixes',
    badge: 'Previous Release',
    highlights: [
      { title: 'Starter Course Tutor Support', desc: 'Curated starter courses now resolve seamlessly in CourseTutor without 404 errors or fake source references.' },
      { title: 'Failure-Safe Credit Charging', desc: 'Tutor credits are deducted only after AI completion succeeds; failed requests (429, 5xx, timeouts) charge zero.' },
      { title: 'Strict Step Index Validation', desc: 'Invalid, negative, fractional, or out-of-range step indexes now return HTTP 400 validation errors instead of silently defaulting to Step 1.' }
    ],
    notes: [
      'Shared course resolution: unified resolveCourse helper for persistent and curated learning content.',
      'Protected credit balances against upstream AI provider outages with atomic post-call deduction.',
      'Preserved zero-cost local checkpoints and legacy course backward compatibility.'
    ]
  },
  {
    version: 'v1.19.0 LIVE Beta',
    date: 'September 19, 2026',
    title: 'Interactive Course Tutor, Zero-Cost Checkpoints, and Adaptive Learning',
    highlights: [
      { title: 'Interactive Course Tutor & "I\'m Stuck" Modal', desc: 'Active-step context-aware AI tutor with response modes (Quick, Normal, Deep) and ADHD-friendly error troubleshooting modal.' },
      { title: 'Zero-Cost Local Checkpoints', desc: 'Pre-generated self-assessment quizzes evaluated locally with instant feedback and zero token consumption.' },
      { title: 'Course v2 & Source Chunk Retrieval', desc: 'Action-first numbered steps with goal/why/actions/mistakes, 1,500–3,000 char source chunks, and stable chunk ID references.' }
    ],
    notes: [
      'Separated guest tutor allowance (15 messages/day) from guest course generation quota (3 courses/day).',
      'Added fine-grained tutor credit pricing (Quick: 0.1 cr, Normal: 0.25 cr, Deep: 0.5 cr) with zero charges on failed requests.',
      'Separated step completion (not_started / completed) from step understanding (unknown / understood / needs_review).',
      'Added dynamic resume banner to continue from the last active step upon returning to a course.',
      'Full backward compatibility: legacy course objects bridge cleanly without destructive migration or data loss.'
    ]
  },
  {
    version: 'v1.18.0 LIVE Beta',
    date: 'September 19, 2026',
    title: 'Interactive Motion Suite & Real-Time QOL',
    highlights: [
      { title: 'Interactive CardSwap Pipeline', desc: 'Visual 3D card stack showing the transformation from raw documentation into action curricula and practice.' },
      { title: 'Real-Time TextType Status', desc: 'Live terminal typewriter animation in generation progress modal for immediate active feedback.' },
      { title: 'Telemetry CountUp Counters', desc: 'Smooth GSAP counters for real syntheses, credits, and token metrics across profile and dashboard.' }
    ],
    notes: [
      'Added word-by-word SplitText hero animation tailored for ADHD readability without letter-by-letter delay.',
      'Created dedicated 404 page featuring canvas FuzzyText effect and easy navigation back to studio.',
      'Integrated GSAP motion primitives while maintaining strict prefers-reduced-motion accessibility.',
      'Preserved pure client-side theme switching with PixelSwap button transition.'
    ]
  },
  {
    version: 'v1.17.0 LIVE Beta',
    date: 'September 19, 2026',
    title: 'ADHD Action-First Positioning & UI Motion Refresh',
    highlights: [
      { title: 'ADHD Action-First Positioning', desc: 'Centered on the i-have-adhd philosophy: direct actions, numbered steps, minimal tangents, and concrete next steps.' },
      { title: 'Polished UI Motion', desc: 'Added accessible RotatingText, FadeContent viewport transitions, and a LogoLoop technology marquee with reduced-motion support.' },
      { title: 'Multi-Provider Transparency', desc: 'Updated landing and footer to reflect multi-provider AI routing across Gemini, Groq, Mistral, and OpenRouter.' }
    ],
    notes: [
      'Replaced absolute claims with realistic action-first descriptions ("Designed to strip conversational filler and surface next action").',
      'Documented design inspiration attribution to github.com/ayghri/i-have-adhd in README.',
      'Renamed public model pricing tiers to Fast, Balanced, Deep, and Maximum Depth to align with fallback capabilities.',
      'Expanded workflow pipeline into 4 distinct steps: Source Focus, Content Purification, Module Generation, and Practice Progress.'
    ]
  },
  {
    version: 'v1.16.0 LIVE Beta',
    date: 'September 19, 2026',
    title: 'Modular LLM Pipeline & Multi-Provider Fallback',
    highlights: [
      { title: 'Multi-Provider Cascade', desc: 'Resilient fallback order: Gemini → Cerebras → Groq → Mistral → OpenRouter.' },
      { title: 'Cerebras Integration', desc: 'Ultra-fast LPU inference fallback via CEREBRAS_API_KEY with Llama 3.1.' },
      { title: 'Granular Error Policy', desc: 'Fallbacks activate only on 429/5xx/timeouts; 400 bad requests and auth errors fail immediately without cascading.' }
    ],
    notes: [
      'Modularized server LLM architecture into manager, errors, and dedicated provider modules under server/llm/.',
      'Preserves generation request ID idempotency: zero duplicate courses, single credit deduction, and unified usage accounting on fallback success.',
      'Unconfigured API keys are skipped smoothly without throwing auth errors; all AI keys remain strictly server-side.'
    ]
  },
  {
    version: 'v1.15.0 LIVE Beta',
    date: 'September 19, 2026',
    title: 'Reliable Generation and Honest History',
    highlights: [
      { title: 'Clear Gemini Retry State', desc: 'Rate limits show provider-aware wait timing and keep the input ready to retry.' },
      { title: 'Real Generation Progress', desc: 'A viewport modal shows recorded server stages without simulated percentages.' },
      { title: 'Safer Course History', desc: 'Browser-only historical records are distinguished from server courses and can be removed locally.' }
    ],
    notes: [
      'Durable request IDs suppress repeated work and charges for the same generation request; uncertain interrupted jobs are not automatically restarted.',
      'Admin supports a separate server-only Appwrite Users-read key and displays verification/provider details when access permits.',
      'Unexpected failures have privacy-filtered Sentry capture; production key configuration and Sentry ingestion still need verification.',
      'The reported Semaphore course could not be inspected with an owner session; its exact production storage/deletion state remains unverified.'
    ]
  },
  {
    version: 'v1.14.0 LIVE Beta',
    date: 'September 18, 2026',
    title: 'Private Learning Workflows and Durable Source History',
    highlights: [
      { title: 'Explicit Course Privacy', desc: 'Signed-in courses default to Private, with separate Community and Public choices enforced by the API.' },
      { title: 'Focused Documentation Discovery', desc: 'Choose a relevant section from bounded same-site documentation suggestions before generation.' },
      { title: 'Private OCR Source History', desc: 'Signed-in image sources can be saved privately and previewed from course details or history.' }
    ],
    notes: [
      'Guest quota now reads the shared server counter; admin metrics recover recorded generation facts from durable account and guest histories.',
      'Admin distinguishes Appwrite Auth accounts from application profiles and displays unavailable when Auth enumeration is not configured.',
      'Email verification UI, safer dialogs, and opt-in Sentry monitoring are included; live provider, storage, and monitoring checks remain pending.',
      'Old OCR originals and historical token facts that were never recorded cannot be recovered; exact-once accounting is not yet implemented.'
    ]
  },
  {
    version: 'v1.13.2 LIVE Beta',
    date: 'September 18, 2026',
    title: 'Production Safety and Account Recovery',
    highlights: [
      { title: 'Safer Documentation Fetches', desc: 'Rejects private and local hosts, checks DNS and redirects, and caps fetched HTML size.' },
      { title: 'Real Password Recovery', desc: 'Uses Appwrite recovery links and a password update page instead of an unusable email code.' },
      { title: 'Reliable Feedback and Quotas', desc: 'Preserves verified feedback identity and message, reserves generation quota before AI calls, and removes duplicate session quota reads.' }
    ],
    notes: [
      'Signup registration now requires a verified Appwrite session; feedback emails report their delivery outcome.',
      'Upload picker no longer advertises unsupported PDF input; landing claims no longer promise unmeasured speeds or verified code.',
      'Production OAuth, recovery email delivery, and provider generation still need controlled end-to-end checks.'
    ]
  },
  {
    version: 'v1.13.1 LIVE Beta',
    date: 'September 18, 2026',
    title: 'Application Startup Hotfix',
    highlights: [
      { title: 'Application Startup Restored', desc: 'Separated Appwrite client initialization from authentication and course services to remove the circular import that prevented the app from loading.' }
    ],
    notes: [
      'Existing authentication and course-service exports remain compatible.',
      'New regression tests execute minified startup code with and without Appwrite configuration.'
    ]
  },
  {
    version: 'v1.13.0 LIVE Beta',
    date: 'September 18, 2026',
    title: 'Public Course Sharing, Durable Credits & Reliable AI Jobs',
    highlights: [
      { title: 'Shareable Public Courses', desc: 'Guest courses are available on the community board for 30 minutes. Account holders choose public or private visibility and can publish older private courses.' },
      { title: 'Persistent Accounts & Credit History', desc: 'Credits, approvals, usage history, feedback and maintenance settings now use durable server-side storage. Profile and Admin show credit transactions and token usage.' },
      { title: 'Clearer Generation Results', desc: 'Studio keeps recent generated-course links below the prompt. Failed AI requests return actionable errors and do not deduct credits.' }
    ],
    notes: [
      'Existing private courses stay private until explicitly published by their author or an administrator.',
      'Uploaded images are processed locally; original images are no longer uploaded to cloud storage.',
      'Guest access expires after 30 minutes; scheduled cleanup runs every 5 minutes. The shared guest quota still resets every 24 hours.',
      'Legacy course records remain readable. Previously lost temporary account records or usage history cannot be reconstructed completely.',
      'Netlify Functions use the modern Request API and strongly consistent conditional storage writes.'
    ]
  },
  {
    version: 'v1.12.2 LIVE Beta',
    date: 'September 18, 2026',
    title: 'Email Suite Crash, Course Visibility, Admin Dedup & Loop Fixes',
    highlights: [
      {
        title: 'Email Suite Crash Fixed',
        desc: 'The Email Suite tab crashed with ReferenceError on every click because customEmailBody state was never declared. Now fixed with a pre-filled default template.'
      },
      {
        title: 'Duplicate Admin Rows & System Docs Removed',
        desc: 'Admin panel no longer shows the same user twice (was deduplicating by user_id, now by email). System documents (maintenance flag) are also filtered out of all user and course lists.'
      },
      {
        title: 'CourseDetail & Dashboard Infinite Loop Fixed',
        desc: 'Course detail page was looping on every render because user object reference changed each render. Fixed with stable user?.id primitive dependency.'
      }
    ],
    notes: [
      'customEmailBody useState declaration added in Admin.jsx Email Suite',
      'listAllUsers now deduplicates by email — same person with 2 user_ids no longer appears twice',
      'listCourses filters source_url: system:// and creator_id: system documents',
      'topUpUserCredits now queries Appwrite by user_id before updating (no more cold-start silent fails)',
      'CourseDetail useEffect now uses user?.id (primitive) not user (object) as dependency'
    ]
  },
  {
    version: 'v1.12.1 LIVE Beta',
    date: 'September 18, 2026',
    title: 'Approval Persistence & Quota Source-of-Truth Fix',
    highlights: [
      {
        title: 'User Approval Now Persists Across Serverless Cold-Starts',
        desc: 'Fixed the root cause of approvals reverting to "pending" on page reload: the approve function now always queries Appwrite by user_id before updating, instead of relying on a cached $id that vanishes every time the serverless container recycles.'
      },
      {
        title: 'Appwrite is Now the Source of Truth for Quotas',
        desc: 'getUserQuota now checks Appwrite FIRST on every request instead of trusting the local /tmp file cache. The local file is only used as a fallback when Appwrite is unreachable, keeping it always in sync.'
      }
    ],
    notes: [
      'approveUserAndSendEmail() now queries Appwrite by user_id to find the correct document ID before writing — no more silent skips',
      'If no Appwrite record exists at all for the user, one is created during approval',
      'getUserQuota() now reads Appwrite before local cache to avoid serving stale pending status',
      'Approval email CTA link updated from localhost to production URL (courseitai.kenncode.me)',
      'Approval email sender updated to hello@courseit.kenncode.me'
    ]
  },
  {
    version: 'v1.12.0 LIVE Beta',
    date: 'September 18, 2026',
    title: 'Persistent Global Maintenance Mode, UI Restoration & Admin Stability',
    highlights: [
      {
        title: 'Real-Time Global Maintenance Mode via Appwrite',
        desc: 'Maintenance mode is now stored in Appwrite Cloud — toggling it from Admin instantly locks every browser in the world within 30 seconds via background polling. No more localStorage-only flags that only your own browser knew about.'
      },
      {
        title: 'Admin Panel Infinite Refresh Loop Fixed',
        desc: 'Resolved the root-cause of the Admin dashboard infinite re-fetch loop by replacing unstable object references in useEffect dependencies with stable primitive identifiers.'
      },
      {
        title: 'UI Restoration: Lower-Left Chatbot & Header Theme Toggle',
        desc: 'Restored the CourseIT Guide chatbot to the lower-left corner globally, relocated the light/dark theme toggle to the navigation header, and properly displayed the Powered By partner badges on the landing page.'
      }
    ],
    notes: [
      'Maintenance flag now persisted to Appwrite DB document (system_maintenance_flag) — all browsers sync within 30 seconds',
      'Admin panel no longer infinitely re-fetches after fixing useEffect dependency on user object reference',
      'setMaintenanceMode() gracefully creates the system document on first use if it does not exist yet',
      'Offline fallback: localStorage mirrors Appwrite state for instant paint on page reload',
      'Security audit: sanitized public changelog and server handler of internal paths, IDs, and emails',
      'Chatbot launcher restored to fixed bottom-left corner (bottom-6 left-6) across all routes',
      'Theme toggle moved to Navbar header — always accessible regardless of scroll position'
    ]
  },
  {
    version: 'v1.11.2 LIVE Beta',
    date: 'September 17, 2026',
    highlights: [
      {
        title: 'Universal CommonJS & ESM Serverless Bundling Fix',
        desc: 'Eliminated runtime module evaluation crash caused by bundler-injected module wrappers, ensuring 100% gateway uptime on all serverless backend routes.'
      },
      {
        title: 'Defensive Timeout Wrappers for Cloud Database Services',
        desc: 'Protected authentication and quota retrieval pipelines with non-blocking race timeouts, preventing serverless function hangs and gateway dropouts.'
      },
      {
        title: 'Admin Verification & Storage Resiliency',
        desc: 'Strengthened administrator privilege verification and fallback storage directory discovery across serverless cold-start cycles.'
      }
    ],
    notes: [
      'Fixed 502 Bad Gateway error on user quota retrieval and course generation in production',
      'Implemented non-blocking timeout guards for external cloud backend session checks',
      'Stabilized cross-environment runtime storage resolution across local and cloud environments'
    ]
  },
  {
    version: 'v1.11.1 LIVE Beta',
    date: 'September 17, 2026',
    title: 'Serverless Production Hotfix & Connected Documentation',
    highlights: [
      {
        title: 'Serverless Runtime Stability & Fallback Protection',
        desc: 'Hardened cloud runtime workers with read-only filesystem resilience and temporary storage routing, ensuring uninterrupted cold-start reliability.'
      },
      {
        title: 'Authentication Decoupling & Cloud Parity',
        desc: 'Decoupled core user authentication from collection dependencies to guarantee login and signup accessibility, and added build-time environment variable fallbacks.'
      },
      {
        title: 'Serverless Functions Bundler Optimization',
        desc: 'Refined serverless configuration with high-performance bundling and external module isolation for fast execution.'
      },
      {
        title: 'Connected Documentation & Semantic Versioning Policy',
        desc: 'Synchronized version identifiers, release checklists, and git commit references across project documentation and application metadata.'
      }
    ],
    notes: [
      'Added resilient client authentication initialization with actionable diagnostics',
      'Unified document extraction and OCR synthesis pipelines within the universal serverless API router',
      'Ensured all documentation cross-links resolve directly to the stable production branch'
    ]
  },
  {
    version: 'v1.11.0 LIVE',
    date: 'September 17, 2026',
    title: 'Production Live Release, Netlify Serverless Routing & Security Hardening',
    highlights: [
      {
        title: 'Complete Security Audit & Credential Scrubbing',
        desc: 'Scrubbed all hardcoded project credentials and database identifiers across tracked files, migrating completely to strict environment variables for public repository readiness.'
      },
      {
        title: 'Universal Serverless API Routing',
        desc: 'Deployed high-speed serverless wildcard routing handling all backend services with cryptographic JWT session verification.'
      },
      {
        title: 'Platform Maintenance Mode with Admin Bypass',
        desc: 'Added animated Maintenance screen with live status pills, administrator bypass authentication, and dynamic operational toggles in the Admin panel.'
      },
      {
        title: 'Profile Overhaul & Custom Avatar Photo Upload',
        desc: 'Enabled client-side custom profile picture upload with cover crop compression and instant cross-component synchronization, while preserving curated preset icons.'
      },
      {
        title: 'Account Summary & Workspace Metrics',
        desc: 'Replaced redundant course lists in Profile with live telemetry cards (custom syntheses count isolated from starter templates, reasoning credits, tokens consumed) and direct access to Studio Dashboard.'
      },
      {
        title: 'Global Rebranding to CourseIT Ai & Tech Badges',
        desc: 'Standardized brand identity to CourseIT Ai across all page titles, metadata, Navbar, and Footer; added tech stack partner badges.'
      }
    ],
    notes: [
      'Protected authentication dialog from unhandled state exceptions to prevent UI freezing during login',
      'Added browser autocomplete attributes and overflow scroll locks to authentication modal',
      'Pre-emptively cleared stale sessions on login to avoid active session conflicts',
      'Isolated curated starter templates from custom user courses in the dashboard catalog'
    ]
  },
  {
    version: 'v1.10.0 BETA',
    date: 'September 17, 2026',
    title: 'Guest Flow Restoration, Anti-Fluff Enforcement & Platform Polish',
    highlights: [
      {
        title: 'Guest Flow Regression Fix',
        desc: 'Prevented unauthenticated guest requests from triggering session verification errors, resolved temporary course loading, and eliminated private access barriers for guest visitors.'
      },
      {
        title: 'Zero-Fluff System Instruction & Imperative Steps',
        desc: 'Hardened LLM system prompt with strict negative constraints (banning conversational padding like "In this section") and mandating imperative verbs and runnable code snippets.'
      },
      {
        title: 'Modern IDE Code Block UI & Dynamic Language Detection',
        desc: 'Upgraded code snippet blocks with macOS-style window controls, dynamic language syntax badges (Bash, Dockerfile, GDScript, Rust, TypeScript, Python), and one-click copy functionality.'
      },
      {
        title: 'Rich Starter Course Snippets & Live Scripted Companion',
        desc: 'Completely populated runnable code snippets and implementation guides for Docker, React 19, Rust, and Godot starter courses; updated CourseTutor "Show Code" to display real verified syntax.'
      },
      {
        title: 'Structured Catalog & Attribution Consistency',
        desc: 'Separated the dashboard into Curated Starters and Community & Custom Courses with clear, consistent author attribution across all catalog views, admin tables, and user profiles.'
      },
      {
        title: 'Actionable Generation Error Pipeline',
        desc: 'Replaced hanging states and silent failures with helpful diagnostic messages and a one-click [Try Again] button.'
      }
    ],
    notes: [
      'Resolved navigation bar session refresh state synchronization on sign-in',
      'Portaled authentication modal directly to document body, centered input adornments, and added password visibility toggles',
      'Cleaned dashboard navigation layout for unauthenticated guest visitors',
      'Repositioned floating feedback controls to prevent layout collision with technical companion',
      'Migrated administrator contact configuration entirely to environment variables',
      'Allowed guest users to delete temporary guest courses locally without hitting backend authentication barriers'
    ]
  },
  {
    version: 'v1.9.0 BETA',
    date: 'September 17, 2026',
    title: 'Security Audit & Auth Hardening: Live Session Source of Truth, Backend JWT Verification, ACL Route Guards & Settings Engine',
    highlights: [
      {
        title: 'Unified Live Auth Context & Purged Fallbacks',
        desc: 'Eliminated stale client-side session desync by establishing authentication state as the single live source of truth; unauthenticated API calls immediately purge cached sessions.'
      },
      {
        title: 'Cryptographic JWT Verification Across Administrative APIs',
        desc: 'Hardened all backend administrative endpoints and sensitive actions to cryptographically verify user session JWTs, strictly rejecting unauthorized requests.'
      },
      {
        title: 'Strict Course ACL & Starter Catalog Namespacing',
        desc: 'Private custom courses now require verified author or administrator ownership. Public template courses are securely namespaced and isolated from community courses.'
      },
      {
        title: 'Document Ownership Migration',
        desc: 'Backfilled legacy course records with explicit creator ownership attributes, ensuring query filtering strictly preserves rightful author access.'
      },
      {
        title: 'Interactive Settings Page Controls',
        desc: 'Wired functional Color Theme switcher, ADHD Anti-Fluff Level selector (Concise, Balanced, Exhaustive), and Default Model Preference synced seamlessly with the course generator.'
      },
      {
        title: 'Expanded Help Documentation & Snappy Micro-Interactions',
        desc: 'Comprehensive step-by-step documentation on documentation synthesis, OCR upload limits, credit costs, and smooth micro-animations across dashboard cards.'
      }
    ],
    notes: [
      'Engineered unified authentication context across all application views and components',
      'Purged stale client session caches on unauthenticated responses to prevent identity desynchronization',
      'Removed hardcoded administrator credentials and balances in favor of live account metadata',
      'Enforced cryptographic JWT session authentication and role verification across all administrative management endpoints',
      'Backfilled legacy courses with verified creator ownership attributes',
      'Namespaced curated starter catalog to prevent collisions with user-generated custom courses',
      'Added dedicated 401/403 access error screens with navigation back to safety'
    ]
  },
  {
    version: 'v1.8.0 BETA',
    date: 'September 17, 2026',
    title: 'Consistency & Polish: Single Source of Truth for Version & Credits, Portalized Modals & Header Redesign',
    highlights: [
      {
        title: 'Single Source of Truth for Versioning',
        desc: 'Eliminated all version drift across UI surfaces, modals, badges, and documentation by routing through a centralized constants authority and versioning guide.'
      },
      {
        title: 'Single Source of Truth for Credit Balance',
        desc: 'Created centralized credit provider with live database synchronization, eliminating rounding loss and artificial display ceilings.'
      },
      {
        title: 'Viewport-Centered Portals for All Modals',
        desc: 'Mounted Changelog, Legal Consent, and Beta Feedback modals directly to document body via React Portals, fixing scroll-position bugs on long pages.'
      },
      {
        title: 'Mandatory First-Login Legal Consent Flow & Audit Trail',
        desc: 'Added account-level Terms & Privacy consent verification stored in user records for a persistent legal audit trail across devices, followed by release notes onboarding.'
      },
      {
        title: 'Sidebar & Footer Layout Separation',
        desc: 'Embedded the footer inside the main content workspace column on dashboard routes, eliminating overlap and layout clipping with the sidebar.'
      },
      {
        title: 'Softened Light Mode & Relocated Controls',
        desc: 'Toned down glare with soft slate backgrounds, audited WCAG text contrast tokens, and added clearly labeled theme switches in the sidebar and landing page.'
      },
      {
        title: 'Formatted Chatbot Typography Engine',
        desc: 'Integrated typography parser to render bold, italic, code tags, and bulleted lists cleanly without raw markdown syntax.'
      },
      {
        title: 'Consolidated Header & Internal Details Removal',
        desc: 'Replaced separate credits pill and logout button with an elegant user menu dropdown, added prominent Dashboard link on landing page, and removed internal infrastructure labels.'
      }
    ],
    notes: [
      'Established single source of truth versioning constant and release checklist',
      'Engineered centralized credit context with dynamic formatting and live quota event synchronization',
      'Refined quota accounting with exact decimal precision for accurate reasoning credit tracking',
      'Stored consent timestamp and terms version directly on account preferences for audit trail persistence',
      'Integrated typography parser for zero-dependency safe Markdown rendering in technical companion',
      'Wrapped interactive modals in React Portals to guarantee viewport centering',
      'Isolated footer inside main container in dashboard layout to prevent sidebar clipping'
    ]
  },
  {
    version: 'v1.7.0 BETA',
    date: 'September 17, 2026',
    title: 'Dashboard Application Shell, Appwrite Serverless History, Light Mode Theming & Auth Hardening',
    highlights: [
      {
        title: 'Dashboard Application Shell & Sidebar',
        desc: 'Transformed dashboard into a responsive application shell featuring dedicated Studio, Generation History, Profile, Preferences, and Help sections.'
      },
      {
        title: 'Serverless History & OCR Audit Storage',
        desc: 'Generation prompts and OCR uploads are stored and audited in cloud database collections with individual deletion and full user/admin access controls.'
      },
      {
        title: 'Universal Server-Side Auth Re-verification',
        desc: 'All protected endpoints re-verify identity via cryptographic session tokens, rejecting spoofed user IDs in request bodies.'
      },
      {
        title: 'Universal Light Mode Theming',
        desc: 'Added universal light theme styling across routes, cards, and inputs with smooth transitions.'
      },
      {
        title: 'Model Picker & Tab Hitbox Optimization',
        desc: 'Elevated dropdown hitboxes for smooth model selection and tab switching across viewports.'
      },
      {
        title: 'Course Attribution & 24h Guest Purging',
        desc: 'Added author attribution badges to course cards and detail pages, with automatic 24-hour auto-purging of unauthenticated guest courses.'
      },
      {
        title: 'Scripted Chatbot Scope Separation',
        desc: 'Separated public landing demo guide (anti-fluff FAQ chips) from authenticated technical companion (step-specific code and quiz support).'
      },
      {
        title: 'Header Navigation Auth Controls',
        desc: 'Relocated sign-in and sign-out controls to persistent header with smooth session checking skeleton loader and animated exit transitions.'
      }
    ],
    notes: [
      'Built responsive dashboard sidebar and generation history components with real-time search and filter controls',
      'Stored history in database collections rather than ephemeral local files for cloud serverless compatibility',
      'Implemented secure authentication client utilities alongside server-side session token verification',
      'Resolved model dropdown clipping and tab switcher hitboxes',
      'Introduced semantic theme toggle button and comprehensive light mode styles',
      'Repositioned feedback controls to eliminate overlap with technical companion',
      'Added author attribution and automatic 24-hour expiry calculation for guest courses',
      'Clarified landing page messaging regarding trial access and credit approval'
    ]
  },
  {
    version: 'v1.6.0 BETA',
    date: 'September 17, 2026',
    title: 'Course Deletion Security ACL, Google OAuth Persistence & Visible Model Fallbacks',
    highlights: [
      {
        title: 'Course Deletion Security Access Control',
        desc: 'Enforced author and admin verification on server and client. Starter templates and other users\' courses cannot be deleted by unauthorized visitors.'
      },
      {
        title: 'Google OAuth Session Persistence',
        desc: 'Prevented destructive session teardown on pending accounts, ensuring Google OAuth signups remain signed in with active sessions.'
      },
      {
        title: 'Google OAuth Pending Queue Integration',
        desc: 'New Google users land in the same pending approval queue as email signups, receiving acknowledgement emails and waiting for admin approval.'
      },
      {
        title: 'User-Visible Model Resilience Notices',
        desc: 'When a model hits temporary provider load and falls back to Flash Lite, users see a clear notification and are only charged for the actual model used.'
      },
      {
        title: 'Changelog Mobile Responsive Layout',
        desc: 'Fixed date badge wrapping and card layout so version dates never overflow or clip on mobile viewports.'
      }
    ],
    notes: [
      'Enforced strict author ownership and administrative authorization guards for course deletions',
      'Protected starter catalog templates from unauthorized client and server deletion',
      'Resolved social authentication session persistence for newly registered accounts',
      'Unified pending-approval flow for OAuth and email signups with auto-acknowledgement emails',
      'Added user-visible model fallback notifications in dashboard and success dialogs',
      'Optimized changelog modal date text wrapping for all mobile and desktop screen sizes',
      'Synchronized changelog data across repository documentation and client application'
    ]
  },
  {
    version: 'v1.5.0 BETA',
    date: 'September 17, 2026',
    title: 'ADHD Anti-Fluff Engine, Public Companion, Shared Trials & Token Monitor',
    highlights: [
      {
        title: 'OAuth Execution Guard',
        desc: 'Implemented execution guard preventing framework StrictMode from consuming one-time authentication tokens twice.'
      },
      {
        title: 'Real-Time Database Credit Writeback',
        desc: 'Credits decrement accurately on generation and sync to the cloud database quota store.'
      },
      {
        title: 'Animated Feedback & Action Notifications',
        desc: 'Added celebratory signup popups, authentication spinners, and animated toast notifications for all platform actions.'
      },
      {
        title: 'Shared 3/3 Public Guest Trial',
        desc: 'URL generation and Document OCR share a single pool of 3 free runs with locked higher tiers.'
      },
      {
        title: 'Public Landing Page Companion Bot',
        desc: 'CourseTutor interactive technical companion is now embedded on the public landing page.'
      },
      {
        title: 'Course Content Export (PDF & DOCX)',
        desc: 'Export structured courses to high-fidelity PDF print sheets, DOCX word documents, or Markdown.'
      },
      {
        title: 'Token & API Usage Monitor',
        desc: 'Real-time AI model token metrics tracking prompt, candidate, and total tokens per user.'
      }
    ],
    notes: [
      'Resolved OAuth authentication token double-invocation guard',
      'Synchronized credit deduction writeback to database quota collection',
      'Added celebratory signup popup and loading states across auth and admin views',
      'Added public landing page technical companion demo',
      'Shared 3/3 guest trial across URL and OCR with locked tier indicators',
      'Added PDF, DOCX, and Markdown course export in course detail view',
      'Added feedback export and direct tester communication tools in admin panel',
      'Added token and API consumption monitor with rate limit tracking'
    ]
  },
  {
    version: 'v1.4.1 BETA',
    date: 'September 17, 2026',
    title: 'ADHD Anti-Fluff Slogan, User Beta Feedback & PixelSwap Light Mode',
    notes: [
      'Added official ADHD and low attention span anti-fluff positioning',
      'Introduced AntiFluffDiff interactive before/after widget with word count metrics',
      'Created logged-in Beta Feedback system with 1-5 star ratings and admin review tab',
      'Ported animated Sun/Moon toggle with smooth transition styling',
      'Integrated developer portfolio, GitHub, and LinkedIn links in footer',
      'Added UserDetailsModal and Archived Accounts tab in Admin panel',
      'Delivered verified transactional email dispatch test suite'
    ]
  },
  {
    version: 'v1.4.0 BETA',
    date: 'September 16, 2026',
    title: 'Landing Page Separation, Step Readability & Scripted Companion',
    notes: [
      'Added dedicated public Landing Page with animated canvas background',
      'Revamped step instruction rendering into vertical numbered cards with language chips',
      'Introduced dockable CourseTutor Companion bot with scripted actions and quizzes',
      'Added Account Archiving workflow with automated confirmation dispatch',
      'Added DeleteConfirmModal to CourseCard, Profile, and Dashboard'
    ]
  },
  {
    version: 'v1.3.0',
    date: 'September 16, 2026',
    title: '250 Credits, Document OCR & Model Tiers',
    notes: [
      'Expanded credit quota from 50 to 250 free credits upon admin approval',
      'Added local document/diagram upload with client-side OCR extraction',
      'Introduced model pricing tiers: Flash Lite (0.5), 3.5 (1.0), 3.6 (2.0), 3.7 (5.0)',
      'Integrated transactional email approvals and password reset flow'
    ]
  },
  {
    version: 'v1.2.0',
    date: 'September 16, 2026',
    title: 'Cloud Database & Auth Integration',
    notes: [
      'Migrated database and auth sessions to cloud infrastructure',
      'Configured quota collection with status approval lifecycle',
      'Added OAuth2 social authentication handlers'
    ]
  }
];
