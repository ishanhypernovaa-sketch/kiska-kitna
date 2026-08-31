# PWA Deployment

Kiska Kitna is a static website and progressive web app. Deploy the entire project directory together. It supports both an origin root such as `https://example.com/` and a subdirectory such as `https://example.com/kiska-kitna/`; the document, manifest, service-worker registration, manifest scope, start URL, and shell assets all use relative paths.

Use `/` as the canonical root path. For a subdirectory deployment, use `/kiska-kitna/` and redirect `/kiska-kitna` to `/kiska-kitna/`; serving the slashless path directly would resolve relative assets from the origin root.

## Production requirements

- Serve production over HTTPS. `http://localhost` remains suitable for local development. On `file://` or an insecure non-localhost origin, the website still works but service workers and installation are unavailable.
- Serve `manifest.webmanifest` as `application/manifest+json` (or another standards-compliant manifest JSON type).
- Serve `service-worker.js` as JavaScript and require revalidation on every request, for example `Cache-Control: no-cache`. Do not give the service-worker file a long immutable browser-cache lifetime.
- Serve versioned static assets with normal browser caching. The service worker owns the offline shell cache.
- Preserve the deployed directory structure, including `icons/`. Do not rewrite shell asset requests to HTML.

## Update strategy

The service worker treats each named shell cache as an immutable release bundle. Installation requests use the cache version as a query parameter so the previous worker cannot satisfy a new installation with stale files. All required files must load before installation succeeds. A failed installation deletes only its incomplete new cache and leaves the active cache and worker untouched.

A successful update waits while an older controlled page remains open. After all old clients close, the new worker activates, claims clients, and removes older `kiska-kitna-shell-*` caches. This avoids changing assets underneath a running session. The next launch uses one internally consistent shell version.

This project has no build hashes. Every release must use a new, never-reused `CACHE_VERSION` in `service-worker.js`, including rollback releases. Never reuse a cache version after any shell asset changes. Changing the service worker triggers the browser update check. Cache activation never reads, migrates, or clears localStorage.

Publish a release in this exact order:

1. Prepare all shell assets listed in `APP_SHELL` and the new worker as one release.
2. Publish all shell assets to their final URLs in one atomic directory, artifact, or symlink switch. Do not update those files one at a time.
3. Verify every versioned shell URL succeeds from the completed release. Preserve a trailing slash on subdirectory deployments, such as `/kiska-kitna/`, so relative scope and asset URLs resolve consistently.
4. Publish `service-worker.js` last, only after the complete shell release is available. Continue serving it with `Cache-Control: no-cache`.

The new worker installs only after every shell response succeeds. If installation fails, its incomplete cache is deleted; the previous worker and cache remain active. Old shell caches are removed only after a new worker installs successfully and activates. To verify a failed update, keep the prior app open, make one staged shell URL fail, request the worker update, and confirm the prior worker remains active, its `kiska-kitna-shell-*` cache still exists, and offline reload still opens the prior shell.

For rollback, atomically republish the last known-good shell assets as a new release, assign another new `CACHE_VERSION`, and publish that rollback worker last. Do not restore or reuse an earlier cache version. Cache operations never touch localStorage, so groups and expenses remain independent of release and rollback.

If Cache Storage is manually cleared, successful online requests for allowlisted shell resources repair their entries in the active cache. After one complete online launch, offline launch works again and localStorage remains intact. Clearing localStorage removes app data independently and does not remove the cached application shell.

## Verification status

Local desktop Chromium automation verifies the DOM workflows, responsive layouts, keyboard focus behavior, JSON import/export logic, storage recovery, and online/offline service-worker behavior. This does not replace deployed HTTPS or physical-device verification.

Android Chrome, iOS Safari, platform file handling and sharing, and assistive-technology behavior with NVDA, VoiceOver, and TalkBack require physical verification before making compatibility claims.

## HTTPS release checklist

### Desktop Chrome (deployed HTTPS verification)

- Load and refresh the deployed root or subdirectory URL; confirm no console or network errors.
- In DevTools Application, validate the manifest, icons, start URL, scope, active service worker, and shell cache.
- Confirm the install action appears only after Chrome emits an install prompt; dismiss it and verify it stays hidden for that page session.
- Install, launch standalone, close all old tabs, and verify the new worker activates after a deployment update.
- Enable Offline in DevTools and reload; confirm the app shell and existing local data load.
- Confirm external WhatsApp navigation is not present in Cache Storage.

### Android Chrome (requires physical verification)

- Visit over HTTPS, install, and launch from the home screen.
- Launch and reload offline, then reconnect and verify a subsequent release update.
- Create and switch groups, verify JSON export download and import file-picker behavior, and verify the WhatsApp handoff.
- Confirm icon appearance, including the maskable icon crop.

### iOS Safari (requires physical verification)

- Visit over HTTPS and use Safari's Add to Home Screen action.
- Launch from the home screen, then launch and reload once while offline.
- Exercise group switching and modals; record JSON export, Files/share-sheet, import file-picker, and WhatsApp handoff behavior and any platform limitations.
- Confirm the title, touch icon, status-bar presentation, and layout. iOS does not expose the Chromium install-prompt event.

### Assistive technology (requires physical verification)

- Test desktop flows with NVDA and mobile flows with VoiceOver and TalkBack.
- Verify headings, landmarks, dialogs, live status announcements, focus restoration, form errors, and expense-list batching. Browser DOM checks are not equivalent to screen-reader verification.

## MVP boundary

Renaming an existing person is outside the current MVP. Group renaming is supported.
