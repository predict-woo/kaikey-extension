export const REGISTER_URL =
  "https://sso.kaist.ac.kr/auth/twofactor/mfa/regist/step01"

export const WINDOW_MODE =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("mode") === "window"

export const UPLOAD_WINDOW_URL =
  chrome.runtime.getURL("popup.html") + "?mode=window"
