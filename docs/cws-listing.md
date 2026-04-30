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

## Privacy form (Korean dashboard)

### 전용 목적 설명

```
Kaikey는 KAIST의 공식 2단계 인증(2FA) 등록을 마친 사용자가, KAIST 통합인증(SSO)에서 발생하는 푸시 인증 요청을 자신의 브라우저 안에서 처리할 수 있도록 도와주는 단일 목적의 확장 프로그램입니다. 사용자가 본인의 등록 QR 코드 스크린샷을 직접 업로드하면, 확장 프로그램이 KAIST의 표준 등록 핸드셰이크를 완료하고 그 결과로 생성된 디바이스 키를 브라우저 로컬 저장소에 저장합니다. 이후 사용자가 KAIST SSO 로그인 페이지를 방문하면 ID를 자동 입력하고, 2FA 챌린지 페이지에서는 페이지에 표시된 두 자리 숫자가 서버 챌린지로부터 도출한 숫자와 일치하는 경우에 한해 승인 요청을 KAIST 인증 서버로 전송합니다. KAIST 도메인 외의 어떤 서비스, 사이트, 데이터에도 관여하지 않습니다. 본 확장 프로그램은 KAIST와 공식적인 제휴, 후원, 운영 관계가 없습니다.
```

### storage 사용 근거

```
storage 권한은 사용자가 KAIST의 공식 등록 절차에서 생성한 디바이스별 EC 개인키와 등록 메타데이터(site_id, sln_uu_id, base_url 등), 그리고 자동 로그인 토글 boolean 값을 chrome.storage.local에 보관하기 위해서만 사용됩니다. 모든 데이터는 사용자의 브라우저 로컬 저장소에만 존재하며 외부 서버나 제3자에게 전송되지 않습니다. 이 데이터를 영구 저장하지 않으면 브라우저를 다시 시작할 때마다 등록을 다시 진행해야 하므로 확장 프로그램의 단일 목적 달성에 필수적입니다.
```

### activeTab 사용 근거

```
activeTab 권한은 사용자가 KAIST SSO 로그인 페이지를 직접 열어 본 경우에 한해, 해당 탭에 대해 scripting 권한과 함께 페이지가 자체적으로 정의한 로그인 함수를 호출하기 위해 사용됩니다. 사용자의 명시적인 페이지 이동 없이 다른 탭이나 사이트에 접근하지 않으며, KAIST SSO 외의 콘텐츠는 읽거나 수정하지 않습니다.
```

### scripting 사용 근거

```
scripting 권한은 KAIST SSO 로그인 페이지가 자체적으로 정의한 loginProcMfa() 함수를 페이지의 main world에서 실행하기 위해 chrome.scripting.executeScript({ world: "MAIN", func: () => loginProcMfa() }) 한 줄의 호출에만 사용됩니다. 해당 페이지의 콘텐츠 보안 정책(CSP)이 일반 콘텐츠 스크립트나 인라인 스크립트의 함수 호출을 차단하기 때문에, 이 권한 없이는 페이지의 정상적인 로그인 버튼 동작을 호출할 수 없습니다. 권한은 KAIST SSO 호스트에 한정되어 사용되며, 다른 사이트에는 어떤 코드도 주입하지 않습니다.
```

### 호스트 권한 사용 근거

```
확장 프로그램은 아래 두 호스트에만 접근합니다.

1) https://sso.kaist.ac.kr/*
KAIST의 공식 통합인증(SSO) 서버입니다. 등록 핸드셰이크, 인증 챌린지 조회, 승인 요청은 모두 KAIST가 운영하는 이 도메인의 공개 엔드포인트(api/app/regist/check, api/app/regist, api/app/auth/check, api/app/auth)로 직접 전송됩니다. KAIST 모바일 앱이 사용하는 동일한 엔드포인트입니다.

2) https://klms.kaist.ac.kr/*
KAIST 학습관리시스템(KLMS)입니다. https://klms.kaist.ac.kr/login/ssologin.php 페이지에서, 페이지가 이미 표시하고 있는 SSO 로그인 링크를 자동으로 따라가는 용도로만 사용됩니다.

위 두 호스트 외 어떤 외부 서버에도 데이터를 전송하지 않으며, 그 외 사이트의 콘텐츠를 읽거나 수정하지 않습니다.
```

### 원격 코드 사용 중이신가요?

**아니요, 원격 코드 권한을 사용하고 있지 않습니다.** Extension 패키지에
포함된 코드만 실행하며, 외부 JS/Wasm을 다운로드하거나 eval하지
않습니다.

### 수집하는 사용자 데이터

체크할 항목:

- ✅ **개인 식별 정보** — 등록 QR 코드에 포함된 사용자의 KAIST ID
  (`display_nm`)가 로컬에 저장됩니다.
- ✅ **인증 정보** — KAIST의 공식 등록 절차에서 생성된 디바이스별
  EC 키와 관련 토큰이 로컬에 저장됩니다.

체크하지 않는 항목 (수집하지 않음):

- ❌ 건강 정보
- ❌ 금융 및 결제 정보
- ❌ 개인적인 커뮤니케이션
- ❌ 위치
- ❌ 웹 기록
- ❌ 사용자 활동
- ❌ 웹사이트 콘텐츠

### 세 가지 공개 (모두 ✅)

- ✅ 승인된 사용 사례를 제외하고 사용자 데이터를 제3자에 판매 또는
  전송하지 않음
- ✅ 항목의 전용 목적과 관련 없는 목적으로 사용자 데이터를 사용하거나
  전송하지 않음
- ✅ 신용도 판단 또는 대출을 위해 사용자 데이터를 사용하거나
  전송하지 않음

### 개인정보처리방침 URL

```
https://github.com/predict-woo/kaikey-extension/blob/main/PRIVACY.md
```
