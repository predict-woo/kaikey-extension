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

## What Kaikey does **not** do

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

---

# 개인정보처리방침 (한국어)

_최종 수정일: 2026-04-30_

본 방침은 **Kaikey** 브라우저 확장 프로그램(이하 "Kaikey", "본 확장
프로그램")이 사용자 데이터를 어떻게 처리하는지 설명합니다. Kaikey는
KAIST 계정을 보유하고 KAIST의 공식 2단계 인증(2FA) 등록을 완료한
사용자를 위한 오픈소스 도우미 확장 프로그램이며, KAIST와 공식적인
제휴, 후원, 운영 관계가 없습니다.

## Kaikey가 다루는 데이터

Kaikey는 사용자가 KAIST 자체 2FA 절차를 정상적으로 사용하는 과정에서
사용자 본인이 생성하거나 제공하는 다음 데이터를 처리합니다.

- 사용자의 KAIST ID (사용자가 직접 업로드한 등록 QR 코드에 포함된
  `display_nm` 필드).
- KAIST의 표준 푸시 인증 등록 핸드셰이크 과정에서 생성되는 디바이스별
  암호 키 (EC P-256 키 쌍).
- 등록 시 KAIST 인증 서버가 반환하는 등록 메타데이터 (`site_id`,
  `sln_uu_id`, 서버 RSA 공개키, 등록 토큰).
- 자동 로그인 활성화 여부에 대한 단일 boolean 설정.

## 데이터 저장 위치

위 모든 데이터는 확장 프로그램의 로컬 브라우저 저장소
(`chrome.storage.local`)에 저장됩니다. 데이터는 KAIST 공식 모바일
인증 앱이 이미 호출하는 KAIST 자체 서버로의 API 호출을 위해서만
브라우저 외부로 나가며, 그 외 어떤 경로로도 전송되지 않습니다.

## 네트워크 요청

Kaikey는 다음 호스트에만 접근합니다.

- `https://sso.kaist.ac.kr/*` – KAIST 공식 통합 인증(SSO) 서버. 등록,
  대기 중인 인증 요청 조회, 승인 응답 전송은 모두 KAIST 모바일 앱이
  사용하는 공개 엔드포인트(`api/app/regist/check`, `api/app/regist`,
  `api/app/auth/check`, `api/app/auth`)로 직접 전송됩니다.
- `https://klms.kaist.ac.kr/*` – KAIST 학습관리시스템(KLMS).
  `https://klms.kaist.ac.kr/login/ssologin.php` 페이지가 이미 표시하고
  있는 SSO 로그인 링크를 따라가는 용도로만 사용됩니다.

Kaikey는 어떤 제3자 서버, 분석 제공자, 추적 서비스에도 연결하지
않습니다. 사용자 데이터는 확장 프로그램 작성자에게도 전송되지
않습니다.

## Kaikey가 하지 **않는** 것

- 사용자의 KAIST 비밀번호를 저장하거나 읽거나 전송하지 않습니다.
- 2단계 인증을 우회하지 않습니다. KAIST 자체 2FA 챌린지 페이지에 표시된
  숫자가 서버 챌린지로부터 도출된 숫자와 일치할 때에만 승인을
  전송합니다.
- 위에 명시된 KAIST 호스트 외 어떤 사이트의 콘텐츠도 읽거나 수정하지
  않습니다.
- 어떤 원격 JavaScript 또는 WebAssembly도 다운로드하거나 실행하지
  않습니다. 실행되는 모든 코드는 게시된 확장 프로그램 패키지에 포함된
  코드뿐입니다.

## 보관 및 삭제

저장된 데이터는 사용자가 제거하기 전까지 브라우저에 남아 있습니다.
팝업의 "Logout" 버튼을 누르거나 `chrome://extensions`에서 확장
프로그램을 제거하면 즉시 삭제됩니다.

## 아동의 데이터

Kaikey는 KAIST 계정 보유자를 대상으로 합니다. 아동의 데이터를 알면서
수집하지 않습니다.

## 문의

본 방침에 관한 문의는 GitHub 저장소
<https://github.com/predict-woo/kaikey-extension/issues>에 이슈로
남겨주시기 바랍니다.
