# Publish Float PiP

Prepared November 16, 2026. The archives are built submission files, not store-approved releases. Finish the browser and live-player checks in TESTING.md before submitting. Chrome was submitted for staged review on November 17, 2026. Firefox was also submitted on November 17, 2026 and is awaiting review. Edge was submitted on November 17, 2026 and Partner Center confirms In review; automatic publication after approval was authorized. No public store release has been verified yet. See [release status](RELEASE-STATUS.md).

## Publisher details

- Author/publisher name: **Govind Yadav**.
- Website: **https://qurkos.com/** (also set as the manifest homepage).
- Live privacy-policy URL: **https://qurkos.com/float-pip/privacy/**.
- Upload-ready page: `docs/privacy-policy.html`. Published and verified over HTTPS on November 17, 2026.
- Public support contact approved by publisher: **govind.csae@gmail.com**. Verified in the Chrome publisher account on November 17, 2026.

## 1. Prepare your publisher details

1. Choose the final extension name and check store availability. If renaming, update the build manifest generator, UI, documentation and artwork together, then rebuild.
2. Use your own developer accounts under Govind Yadav and complete each store's identity, contact and payment requirements as requested by its dashboard.
3. Provide a working public support email or support page. Publish `privacy-policy.html` on a public HTTPS URL you control, and enter that URL in the listing. The included policy refers people to your store support contact; make sure the contact is populated.
4. Install the unpacked packages in all three browsers and test your own Netflix and Crunchyroll accounts. Do not advertise verified service compatibility until those checks pass. There are no service-specific hacks in the extension.
5. Capture real installed-extension screenshots. Use public or self-owned video to avoid displaying paid footage, account details or other personal data. The included Chrome artwork shows the installed Chrome popup; capture separate genuine screenshots for other browsers.

## 2. Chrome Web Store

- Package: `dist/float-pip-chrome-1.0.0.zip`.
- Register and finish developer setup, then open the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole), create a new item, and upload the ZIP.
- Complete the listing, privacy and distribution fields. Copy the purpose, permissions rationale and listing text below. Declare no remotely hosted code and no collected user data for this exact code.
- Supply `extension/icons/icon128.png`, `store-assets/small-promo-440x280.png`, and `store-assets/chrome-controls-1280x800.jpg`. This image uses a genuine installed Chrome popup capture on a promotional backdrop.
- Add the hosted privacy-policy URL, support contact and reviewer instructions. Submit for review; choose deferred publishing if you want to launch manually after approval.

Follow the [official publishing guide](https://developer.chrome.com/docs/webstore/publish) and [image requirements](https://developer.chrome.com/docs/webstore/images). Dashboard validation is the final authority if requirements change.

## 3. Microsoft Edge Add-ons

- Package: `dist/float-pip-edge-1.0.0.zip`.
- Register as an extension developer in [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview). Create a new extension and upload the ZIP.
- Complete availability, properties, privacy and localized listing fields. Add your support contact, hosted privacy-policy URL and reviewer notes.
- Use `store-assets/logo300.png` as the square logo. The 440×280 promotional tile is included; screenshots at 1280×800 work for both Chrome and Edge.
- Save, complete dashboard validation, then submit for certification.

See Microsoft's [official submission guide](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension).

## 4. Firefox Add-ons (AMO)

- Package: `dist/float-pip-firefox-1.0.0.zip`; do not upload the Chrome ZIP.
- Sign in at the [Add-ons Developer Hub](https://addons.mozilla.org/developers/), choose Submit a New Add-on, and select listing on addons.mozilla.org.
- Upload the Firefox ZIP and resolve any validator errors. It is plain, readable JavaScript without bundling or minification. If a reviewer requests source, provide `float-pip-source-1.0.0.zip` with the build command `python3 tools/build.py`.
- Keep the manifest's unique Gecko ID stable after the first submission. The package declares Firefox 140+ and `data_collection_permissions.required: ["none"]`.
- Fill in the listing, support contact, policy and reviewer notes. Clearly disclose the built-in PiP guidance workflow when the standard API is absent. Upload appropriate icon/screenshots and submit.
- AMO signs approved extensions. Use the signed store result for permanent normal-release Firefox installation; renaming this unsigned ZIP to XPI does not sign it.

See the [submission guide](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/) and [no-data declaration requirements](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).

## Listing copy

**Name:** Float PiP

**Short description:** Open accessible videos in picture-in-picture with temporary tab access. Includes guidance for Firefox’s built-in PiP.

**Full description:**

Keep a video nearby while you do something else. Float PiP helps open accessible HTML5 videos in your browser's picture-in-picture player.

Start playback, click Float PiP, then choose Open picture-in-picture. The extension prefers the largest visible playing video. It clears the website's PiP restriction hint and handles replacement videos while the activated document remains open. If your browser needs a direct click, an on-page button helps complete the request.

Use Alt + Shift + P to open the controls, then Enter to activate the focused button. Customize the shortcut in your browser's extension settings.

Float PiP uses temporary access to the current tab. It has no analytics, advertising, account system, remote scripts or persistent website permissions. It collects and transmits no personal data.

Browser support varies. Firefox versions without the standard PiP API use Firefox's built-in PiP icon or menu after restrictions are cleared. Cross-origin embedded players may require opening the original player page. Protected media, browser settings and website policies can prevent PiP; captions and site overlays may remain in the original tab. Keep the source tab open. A full page navigation requires activating the extension again.

Float PiP is independent and is not affiliated with video services or browser vendors. It does not bypass subscriptions, DRM or access restrictions.

## Privacy-form answers and permissions

**Single purpose:** Help the user open an accessible video from the current tab in the browser's native picture-in-picture player.

**activeTab:** Temporary access after the user invokes the extension, used to find a video in the current tab without persistent website permissions.

**scripting:** Execute the bundled video helper to inspect video readiness/geometry, clear the PiP hint, observe player replacements and request native PiP in the activated document and accessible same-origin child documents.

**Remote code:** None. All JavaScript, CSS, HTML and icons are packaged locally. No eval, CDN, remote scripts or fetched executable code.

**Data:** No personal data is collected or transmitted. No video URLs, credentials, browsing history or page content are stored. Temporary video readiness/geometry results stay in memory. Verify these statements again if you modify the source.

## Reviewer notes

Start any ordinary accessible HTML5 video on an HTTPS page. Click the toolbar icon, then Open picture-in-picture. If a direct-gesture helper appears, close the popup and click its page button within 30 seconds. Use the popup to return the video. The shortcut opens controls; Enter activates the focused button.

No extension account or payment is needed. Firefox 140–152, or a browser without the standard API, shows instructions for built-in PiP rather than claiming to open a native window. In Firefox, hover over the video for the built-in control, or Shift + right-click and select Watch in Picture-in-Picture. Netflix/Crunchyroll are not needed to test the generic helper. Do not provide personal streaming credentials in a public field.

## Updates and rebuilds

Change both version values in `tools/build.py` and `package.json`, rebuild, rerun tests and upload to the existing store listings. Keep each store's extension identity and the Firefox Gecko ID stable. Never add broad host permissions or analytics without updating the product, policy, forms and testing together.

The build produces deterministic ZIPs and `SHA256SUMS.txt`. Chrome and Edge packages are intentionally identical in this release. Store signing and approval happen only after submission.
