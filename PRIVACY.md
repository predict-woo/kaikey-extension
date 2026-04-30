# Privacy Policy

_Last updated: 2026-04-30_

This privacy policy describes how the **Kaikey** browser extension
("Kaikey", "we", "the extension") handles user data. Kaikey is an open-source
helper extension for users who already have a KAIST account and have
completed KAIST's official 2FA enrollment. Kaikey is not affiliated with,
endorsed by, or operated by KAIST.

## What data Kaikey handles

Kaikey processes the following data, all of which is generated or supplied
by the user during normal use of KAIST's own 2FA flow:

- The user's KAIST ID (the `display_nm` field embedded in the registration
  QR code that the user uploads).
- The per-device cryptographic key generated when completing KAIST's standard
  push-authenticator registration handshake (an EC P-256 key pair).
- Registration metadata returned by KAIST's authentication server during
  registration (`site_id`, `sln_uu_id`, the server RSA public key, the
  registration token).
- A single boolean preference for whether auto-login is enabled.

## Where the data is stored

All of the above is stored in the extension's local browser storage
(`chrome.storage.local`). The data never leaves the user's browser except
when the extension makes the same API calls that the official KAIST mobile
authenticator already makes, directly to KAIST's own servers (see below).

## Network requests

Kaikey only contacts the following hosts:

- `https://sso.kaist.ac.kr/*` – KAIST's official Single Sign-On server. Used
  to complete registration, query pending push challenges, and submit
  approval responses through the same public endpoints used by KAIST's
  official mobile app (`api/app/regist/check`, `api/app/regist`,
  `api/app/auth/check`, `api/app/auth`).
- `https://klms.kaist.ac.kr/*` – KAIST's Learning Management System. Used
  only to follow the SSO login link that the page itself displays at
  `https://klms.kaist.ac.kr/login/ssologin.php`.

Kaikey does not contact any third-party server, analytics provider, or
tracking service. No data is transmitted to the extension authors.

## What Kaikey does not do

- Kaikey does not store, read, or transmit your KAIST password.
- Kaikey does not bypass two-factor authentication. Approval is only sent
  when the digits displayed by KAIST's own 2FA challenge page match the
  digits derived from the server-provided challenge.
- Kaikey does not read or modify the contents of any site other than the
  KAIST hosts listed above.
- Kaikey does not load or execute any remote JavaScript or WebAssembly. All
  code that runs is bundled inside the published extension package.

## Data retention and deletion

The data remains in your browser until you remove it. You can delete it at
any time by clicking "Logout" in the popup, or by removing the extension
from `chrome://extensions`. Removing the extension also clears its local
storage.

## Children's data

Kaikey is intended for KAIST account holders. Kaikey does not knowingly
collect data from children.

## Contact

For questions about this policy, please open an issue at
<https://github.com/predict-woo/kaikey-extension/issues>.
