# CourseIT Ai — Versioning & Release Checklist

This document is the official release and maintenance checklist for CourseIT Ai. It defines the single source of truth for version identifiers, badges, and documentation cross-links to prevent version drift across the application and public repository.

---

## 1. Single Source of Truth (App UI & Metadata)

All UI components, user-facing screens, and backend constants must import the active version from:  
📁 **[`src/constants/version.js`](src/constants/version.js)**

```javascript
export const CURRENT_VERSION = '1.19.2';
export const CURRENT_VERSION_LABEL = 'v1.19.2 LIVE Beta';
export const RELEASE_DATE = 'September 20, 2026';
export const RELEASE_NAME = 'Production Bug Fixes & Profile UI Transparency';

export const APP_NAME = 'CourseIT Ai';
export const APP_TAGLINE = 'Action-first docs learning paths';
export const APP_FULL_TITLE = `${APP_NAME} ${CURRENT_VERSION_LABEL}`;
```

Every UI surface dynamically imports from this constant:
- **Navbar logo tag & version indicator**: [`src/components/Navbar.jsx`](src/components/Navbar.jsx)
- **Dashboard Studio hero badge**: [`src/pages/Dashboard.jsx`](src/pages/Dashboard.jsx)
- **Landing page hero pill**: [`src/pages/Landing.jsx`](src/pages/Landing.jsx)
- **Footer logo badge & release notes link**: [`src/components/Footer.jsx`](src/components/Footer.jsx)
- **Changelog modal header & tabs**: [`src/components/ChangelogModal.jsx`](src/components/ChangelogModal.jsx)
- **Terms & Privacy modal preamble**: [`src/components/TermsPrivacyModal.jsx`](src/components/TermsPrivacyModal.jsx)
- **Beta Feedback modal header tag**: [`src/components/FeedbackModal.jsx`](src/components/FeedbackModal.jsx)
- **Maintenance screen badge**: [`src/pages/Maintenance.jsx`](src/pages/Maintenance.jsx)

---

## 2. Connected Documentation & Cross-Links

Version numbers and release records are synchronized across:
1. **[`README.md`](README.md)**: Displays active version shield, last commit hash, policy link, and high-level summary of latest releases.
2. **[`CHANGELOG.md`](CHANGELOG.md)**: Full chronological audit trail of all historical releases following [Keep a Changelog](https://keepachangelog.com/).
3. **[`src/data/changelog.js`](src/data/changelog.js)**: In-app interactive changelog modal data with feature highlights and release badges.
4. **[`package.json`](package.json)**: Application package version metadata (`"version": "1.19.2"`).

---

## 3. Release Checklist for Future Deployments

> [!IMPORTANT]
> **Mandatory For ALL Pushes (Small Hotfixes or Big Releases)**:  
> Because there is no automated CI bot to auto-increment versions on GitHub push, this checklist **MUST be executed manually for every single release, hotfix, or push**. Never push code without updating all 6 files. See [**`AGENTS.md`**](AGENTS.md) and [**`.agents/rules/versioning.md`**](.agents/rules/versioning.md) for agent operating instructions.

When preparing and releasing a new version, execute this checklist systematically:

1. [ ] **Update Single Source of Truth**:
   - Edit [`src/constants/version.js`](src/constants/version.js) with the new `CURRENT_VERSION`, `CURRENT_VERSION_LABEL`, `RELEASE_DATE`, and `RELEASE_NAME`.
2. [ ] **Update Package Metadata**:
   - Edit [`package.json`](package.json) (`"version": "..."`).
3. [ ] **Update In-App Changelog**:
   - Prepend new release entry to [`src/data/changelog.js`](src/data/changelog.js) with `badge: 'Latest Release'`, `highlights`, and `notes`.
4. [ ] **Update Repository Changelog**:
   - Add matching version section to [`CHANGELOG.md`](CHANGELOG.md) with categorized entries (`Security`, `Backend`, `Platform Features`, etc.).
5. [ ] **Update README.md**:
   - Update the version shield badge (`img.shields.io/badge/version-...`).
   - Update the latest commit hash or badge reference.
   - Update the "Recent Release Notes" bullet list.
6. [ ] **Security & Credential Check**:
   - Run grep search to verify zero API keys, secrets, or raw project/database IDs are hardcoded in tracked files.
7. [ ] **Verify Local & Serverless Builds**:
   - Run `npm run build` and ensure exit code 0.
   - Verify `netlify.toml` syntax (`[functions] node_bundler = "esbuild"`, no invalid keys).
8. [ ] **Git Commit & Deployment**:
   - Commit changes on `kenn/develop`.
   - Merge into `master`.
   - Push both branches to GitHub (`origin master`, `origin kenn/develop`).
   - On Netlify, verify that the automated build completes successfully. If environment variables were updated, trigger a deploy with **Clear cache and deploy site**.
