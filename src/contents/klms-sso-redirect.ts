import type { PlasmoCSConfig } from "plasmo"

import { getAutoLogin } from "~lib/state"

export const config: PlasmoCSConfig = {
  matches: ["https://klms.kaist.ac.kr/login/ssologin.php*"],
  run_at: "document_idle",
  all_frames: false
}

const LOG_PREFIX = "[Kaikey klms]"

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

async function run() {
  const auto = await getAutoLogin()
  if (!auto) {
    console.log(LOG_PREFIX, "Auto-login disabled; skipping.")
    return
  }
  const link = await waitForElement<HTMLAnchorElement>("div.login > a")
  if (!link) {
    console.log(LOG_PREFIX, "Could not find login link.")
    return
  }
  console.log(LOG_PREFIX, "Following SSO login link:", link.href)
  link.click()
}

run().catch((e) => console.error(LOG_PREFIX, e))
