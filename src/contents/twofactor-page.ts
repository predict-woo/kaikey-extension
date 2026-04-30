import type { PlasmoCSConfig } from "plasmo"

import { getAutoLogin } from "~lib/state"

export const config: PlasmoCSConfig = {
  matches: ["https://sso.kaist.ac.kr/auth/twofactor/mfa/login2Factor*"],
  run_at: "document_idle",
  all_frames: false
}

const LOG_PREFIX = "[Kaikey twofactor]"

async function waitForDigits(timeoutMs = 15000): Promise<string | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const wrap = document.querySelector<HTMLDivElement>(
      ".auth_number .nember_wrap"
    )
    if (wrap) {
      const spans = wrap.querySelectorAll("span")
      if (spans.length >= 2) {
        const a = (spans[0].textContent || "").trim()
        const b = (spans[1].textContent || "").trim()
        if (/^\d$/.test(a) && /^\d$/.test(b)) return a + b
      }
    }
    // Fallback: the sr-only div contains the same digits.
    const sr = document.querySelector<HTMLDivElement>(
      ".auth_number .sr-only"
    )
    if (sr) {
      const text = (sr.textContent || "").trim()
      if (/^\d{2}$/.test(text)) return text
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  return null
}

function sendMessage<T = unknown>(msg: any): Promise<T> {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve))
}

async function run() {
  const auto = await getAutoLogin()
  if (!auto) {
    console.log(LOG_PREFIX, "Auto-login disabled; skipping.")
    return
  }

  const digits = await waitForDigits()
  if (!digits) {
    console.log(LOG_PREFIX, "Could not read displayed digits.")
    return
  }
  console.log(LOG_PREFIX, "Page digits:", digits)

  // Try a few times — the auth request may not yet be registered server-side.
  for (let attempt = 0; attempt < 5; attempt++) {
    const reply = await sendMessage<{ ok: boolean; data?: any; error?: string }>({
      type: "auto-approve-if-match",
      displayedDigits: digits
    })
    if (reply.ok && reply.data?.matched) {
      console.log(LOG_PREFIX, "Approved.")
      return
    }
    if (reply.ok && reply.data?.reason === "no-pending-request") {
      await new Promise((r) => setTimeout(r, 1500))
      continue
    }
    console.log(LOG_PREFIX, "Result:", reply)
    return
  }
  console.log(LOG_PREFIX, "No matching request after retries.")
}

run().catch((e) => console.error(LOG_PREFIX, e))
