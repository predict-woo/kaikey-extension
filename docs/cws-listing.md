# Chrome Web Store Listing Reference

Copy-pasteable answers for the CWS developer dashboard fields. Keep in sync
with `PRIVACY.md` if anything material changes.

## Listing copy

### Short description (≤132 chars)

```
Helps you complete the KAIST SSO push 2FA challenge from your browser using a key you register yourself.
```

### Detailed description

```
Kaikey is a helper extension for users who already have a KAIST account and have completed KAIST's official 2FA enrollment. It is not affiliated with, endorsed by, or operated by KAIST.

Kaikey has no backend server. All data stays in your browser's local storage; the extension only talks to KAIST's own servers.

What it does
After you complete KAIST's standard 2FA registration in your own browser, you upload a screenshot of the registration QR code into this extension. Kaikey decodes the code and finishes the same registration handshake that the official mobile app would, so the resulting key is stored locally in your browser instead of on a phone.

Once registered, when you sign in to a KAIST service:
- On the KAIST SSO login page, Kaikey can fill in your KAIST ID and submit the form.
- On the 2FA challenge page, Kaikey reads the two-digit code that the page itself displays, asks the KAIST authentication server for the pending challenge, and only approves the request if the digits match.
- On the KAIST KLMS SSO redirect page, Kaikey can follow the standard login link.

Auto-login can be turned off from the popup, in which case approvals are done manually by selecting the matching number in the popup.

What it does not do
- It does not send your data to any third party. All registration and approval calls go directly to KAIST's own SSO/auth endpoints, the same ones the official app uses.
- It does not bypass 2FA. Approval requires a valid challenge from KAIST and a digit match.
- It does not store your KAIST password. Only the per-device key from your own 2FA registration is stored locally.

Required permissions and why
- storage — to keep your registered device key and your auto-login preference in extension-local storage.
- scripting and activeTab — to run a small function inside KAIST SSO pages that triggers the page's own login button when auto-login is enabled.
- Host permission for sso.kaist.ac.kr and klms.kaist.ac.kr — these are the only sites the extension reads or interacts with.

Kaikey is open source. Source code: https://github.com/predict-woo/kaikey-extension
```

## Privacy form

### Single purpose description

```
Kaikey is a single-purpose extension that helps users who have completed KAIST's official two-factor authentication (2FA) registration handle KAIST Single Sign-On (SSO) push authentication requests from within their own browser. The user uploads a screenshot of their personal registration QR code, the extension completes KAIST's standard registration handshake, and the resulting device key is stored in browser local storage. When the user later visits the KAIST SSO login page, the extension auto-fills the ID, and on the 2FA challenge page, it sends an approval request to the KAIST authentication server only when the two-digit code shown on the page matches the code derived from the server challenge. The extension does not interact with any service, site, or data outside KAIST domains. It is not affiliated with, endorsed by, or operated by KAIST.
```

### storage justification

```
The storage permission is used solely to persist the per-device EC private key generated during KAIST's official registration flow, the associated registration metadata (site_id, sln_uu_id, base_url, etc.), and a single boolean for the auto-login toggle, all in chrome.storage.local. All of this data lives only in the user's local browser storage and is never transmitted to an external server or third party. Without persistent storage the user would have to re-register every time the browser restarts, which would defeat the extension's single purpose.
```

### activeTab justification

```
The activeTab permission is used only when the user has explicitly opened the KAIST SSO login page, in order to invoke (together with the scripting permission) the login function that the page itself defines. The extension does not access any other tab or site without that explicit user navigation, and does not read or modify content outside KAIST SSO.
```

### scripting justification

```
The scripting permission is used in exactly one call — chrome.scripting.executeScript({ world: "MAIN", func: () => loginProcMfa() }) — to invoke the loginProcMfa() function that the KAIST SSO login page defines on itself. The page's Content Security Policy blocks ordinary content scripts and inline scripts from calling that function, so this permission is required to trigger the page's own login button behavior. The permission is scoped to the KAIST SSO host and no code is injected into any other site.
```

### Host permissions justification

```
The extension only contacts the following two hosts:

1) https://sso.kaist.ac.kr/*
KAIST's official Single Sign-On server. Registration handshakes, authentication challenge lookups, and approval submissions are all sent directly to KAIST-operated public endpoints on this domain (api/app/regist/check, api/app/regist, api/app/auth/check, api/app/auth). These are the same endpoints used by KAIST's official mobile authenticator app.

2) https://klms.kaist.ac.kr/*
KAIST's Learning Management System (KLMS). Used only on the page https://klms.kaist.ac.kr/login/ssologin.php, where the extension follows the SSO login link that the page itself already displays.

No data is transmitted to any other external server, and content on sites outside the two hosts above is neither read nor modified.
```

### Are you using remote code?

**No, I am not using remote code.** The extension only runs the code bundled
in its own published package. It does not download or eval external
JavaScript or WebAssembly.

### User data being collected

Check the following:

- ✅ **Personally identifiable information** — the user's KAIST ID
  (`display_nm`), embedded in the registration QR code, is stored locally.
- ✅ **Authentication information** — the per-device EC key and related
  tokens generated during KAIST's official registration are stored locally.

Do not check (the extension does not collect):

- ❌ Health information
- ❌ Financial and payment information
- ❌ Personal communications
- ❌ Location
- ❌ Web history
- ❌ User activity
- ❌ Website content

### Three certifications (check all)

- ✅ I do not sell or transfer user data to third parties, outside of the
  approved use cases.
- ✅ I do not use or transfer user data for purposes that are unrelated to
  the item's single purpose.
- ✅ I do not use or transfer user data to determine creditworthiness or
  for lending purposes.

### Privacy policy URL

```
https://github.com/predict-woo/kaikey-extension/blob/main/PRIVACY.md
```
