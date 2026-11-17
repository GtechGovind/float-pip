# Verification and release checks

Verification dates: November 16–17, 2026.

## Automated evidence

- **19 Node behavioral tests passed.** Selection of playing/visible/loaded videos, non-mutating probes, native toggle, single observer installation, episode replacements, unsupported API guidance, Permissions Policy feedback, media rejection, direct-gesture fallback, open shadow roots, same-origin discovery beside an inaccessible iframe, offscreen iframe exclusion, child-document PiP exit, and popup scan behavior.
- **4 original Python package checks passed.** Each ZIP's integrity, manifest/root references and permissions, PNG dimensions, required source/release documentation, and store-asset dimensions.
- **Real Chrome 157.0.8103.79 smoke check passed.** Generated canvas-stream HTML5 video entered native PiP from a click, exited PiP, and replacement video's PiP hint was removed. A same-origin iframe video opened and closed native PiP. An offscreen frame did not outrank the visible player. Direct-gesture helper buttons rendered and worked in a real DOM. No page JavaScript errors.
- **Popup UI facade check passed.** Actual HTML/CSS/JS rendered in light and dark mode at 360px width, scanned, focused its primary button, and displayed success after a test browser-API response. This test uses a facade for browser extension APIs; it is not an installed-extension integration test. `previews/` images show this UI test.
- **Independent source review completed.** Two frame-discovery/visibility findings were fixed and covered by regression tests. No remote-code, analytics, unsafe HTML insertion, or unnecessary permission issues were found in the review.

Commands from the source folder:

```sh
node --test tests/*.test.cjs
python3 tools/build.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

The build uses only Python's standard library. It creates deterministic store ZIPs, a source ZIP, and SHA-256 checksums. Rebuild after any source/doc change. The store archives include a Manifest V3 manifest at ZIP root, permissions `activeTab` and `scripting`, and no host permissions or background worker.

Optional real browser smoke check:

```sh
npm install --no-save playwright
CHROME_PATH="/path/to/chrome" BROWSER_ARTIFACTS="/path/to/previews" node tools/browser-smoke.cjs
```

## Coverage limits

Installed-extension toolbar integration was completed in the publisher's existing Chrome session on November 17 after explicit installation approval. A local generated video entered native PiP through the real Float PiP popup, then returned to its original tab through the popup. A genuine popup screenshot was saved and used in the store artwork. The earlier automated test used the explicitly described API facade; it remains distinct from this later installed-extension check. Edge and Firefox executables were unavailable, so their packages have manifest/static tests but no live browser verification here. Minimum browser versions were not exercised. Netflix, Crunchyroll, YouTube and other live services were not tested. No streaming credentials were accessed. Chrome accepted the package upload and all required listing/privacy fields; submission is pending review. Firefox validator passed with zero errors and one Android-only minimum-version warning; desktop Firefox was selected and Android was not selected. Firefox is awaiting review with executable package and reproducible source attached. Edge Partner Center verified the uploaded package and accepted submission for certification; its status is In review. Store acceptance does not establish live Edge playback compatibility.

The source review noted that an activated document with frequent subtree changes can trigger a full video/open-shadow/frame rescan about every 150ms while changes continue. This performance concern is deferred; check CPU usage on busy player pages before release. No scanning runs before the controls are opened, and no mutation observer runs until PiP activation.

## Manual release matrix

Complete this in actual installed extensions before submission. Record exact browser version, OS, page URL (without account tokens), outcome and any limitations.

| Scenario | Chrome | Edge | Firefox |
|---|---|---|---|
| Load unpacked/temporary package | Passed in Chrome | Pending | Pending |
| Toolbar → scan → open PiP → return video | Passed with generated video | Pending | Pending |
| Shortcut opens controls, Enter activates, shortcut reassignment | Existing GoFullPage shortcut conflicts; toolbar passed; reassignment pending | Pending | Pending |
| Direct page gesture fallback, if browser requests it | Pending | Pending | Pending |
| Built-in PiP guidance when standard API is absent | N/A | N/A | Pending |
| Netflix playing episode, pause/resume, next episode | Pending | Pending | Pending |
| Crunchyroll playing episode, pause/resume, next episode | Pending | Pending | Pending |
| YouTube regular video and another plain HTML5 player | Pending | Pending | Pending |
| Captions, audio, fullscreen exit and PiP window close | Pending | Pending | Pending |
| Same-origin iframe, offscreen iframe, inaccessible other-origin player | Pending | Pending | Pending |
| Browser/store pages show clear restricted-page feedback | Pending | Pending | Pending |
| Full page navigation, tab close, repeated activation | Pending | Pending | Pending |
| Long playback / busy page CPU and memory | Pending | Pending | Pending |
| No extension-origin outgoing network requests or saved browsing data | Pending | Pending | Pending |
| Store validator / upload accepted | Accepted; pending staged review | Accepted; in review | Accepted; awaiting review (one Android-only warning) |

On Firefox without the standard API, the expected workflow is to clear restrictions, close the popup, then use Firefox's built-in PiP overlay or Shift + right-click video menu. Do not mark direct opening as passed if only the guided workflow was available.

If a service blocks PiP, record that result and describe the limitation in the listing. No package claims to bypass DRM, site Permissions Policy, subscriptions or browser protection. A generic helper cannot guarantee compatibility with every platform.

## Public repository verification — November 17, 2026

The open-source layout builds into `dist/` and excludes local/generated folders from the source archive. All 19 Node tests and 5 Python package checks passed. Chrome, Edge and Firefox ZIP bytes match the original submitted packages. CI runs the same checks plus a second-build checksum comparison.
