import type { PlasmoCSConfig } from "plasmo"

import { getAutoLogin, loadState } from "~lib/state"

export const config: PlasmoCSConfig = {
  matches: ["https://sso.kaist.ac.kr/auth/kaist/user/login/view*"],
  run_at: "document_idle",
  all_frames: false
}

const LOG_PREFIX = "[Kaikey login]"

async function waitForElement<T extends Element>(
  selector: string,
  timeoutMs = 8000
): Promise<T | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const el = document.querySelector<T>(selector)
    if (el) return el
    await new Promise((r) => setTimeout(r, 150))
  }
  return null
}

function setReactInputValue(input: HTMLInputElement, value: string): void {
  const proto = Object.getPrototypeOf(input)
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set
  if (setter) {
    setter.call(input, value)
  } else {
    input.value = value
  }
  input.dispatchEvent(new Event("input", { bubbles: true }))
  input.dispatchEvent(new Event("change", { bubbles: true }))
}

async function run() {
  const auto = await getAutoLogin()
  if (!auto) {
    console.log(LOG_PREFIX, "Auto-login disabled; skipping autofill + click.")
    return
  }
  const state = await loadState()
  const site = state.sites[0]
  if (!site) {
    console.log(LOG_PREFIX, "No registered site; skipping autofill.")
    return
  }

  const input = await waitForElement<HTMLInputElement>("#login_id_mfa")
  if (!input) {
    console.log(LOG_PREFIX, "Could not find #login_id_mfa input.")
    return
  }

  if (input.value === site.display_nm) {
    console.log(LOG_PREFIX, "ID already filled; clicking login.")
  } else {
    setReactInputValue(input, site.display_nm)
    console.log(LOG_PREFIX, "Filled ID as", site.display_nm)
  }

  const button = await waitForElement<HTMLAnchorElement>("a.btn_login", 4000)
  if (!button) {
    console.log(LOG_PREFIX, "Could not find login button.")
    return
  }
  // The anchor is `javascript:loginProcMfa()`. Anchor clicks from an isolated
  // content-script world don't execute javascript: URLs, and the page CSP blocks
  // inline <script> injection — so route through the background, which uses
  // chrome.scripting.executeScript({ world: "MAIN" }) to run the call.
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "exec-login-proc-mfa" })
  }, 200)
}

run().catch((e) => console.error(LOG_PREFIX, e))
