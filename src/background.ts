import {
  approveAuth,
  authCheck,
  generateVnumber,
  parseQrJson,
  AuthProtocolError,
  regLookup,
  registerSite,
  upsertSite,
  vnumberChoices,
  type SiteState
} from "~lib/auth"
import { loadState, resetState, saveState } from "~lib/state"

export {}

type Msg =
  | { type: "register"; qrJson: string }
  | { type: "auth-check" }
  | { type: "approve"; idToken: string; selectedNumber: string; realNumber: string }
  | { type: "logout" }
  | { type: "auto-approve-if-match"; displayedDigits: string }
  | { type: "exec-login-proc-mfa" }

type Reply<T = unknown> = { ok: true; data: T } | { ok: false; error: string }

function selectSite(state: { sites: SiteState[] }): SiteState {
  if (!state.sites.length) {
    throw new AuthProtocolError("No registered site. Please register first.")
  }
  if (state.sites.length > 1) {
    // For now, just use the first; multi-site UI can be added later.
    return state.sites[0]
  }
  return state.sites[0]
}

async function handle(msg: Msg): Promise<Reply> {
  try {
    if (msg.type === "register") {
      const state = await loadState()
      const qr = parseQrJson(msg.qrJson)
      const lookup = await regLookup(qr, state)
      const site = await registerSite(qr, lookup, state)
      upsertSite(state, site)
      await saveState(state)
      return {
        ok: true,
        data: {
          site_id: site.site_id,
          display_nm: site.display_nm,
          sln_uu_id: site.sln_uu_id
        }
      }
    }

    if (msg.type === "auth-check") {
      const state = await loadState()
      const site = selectSite(state)
      const data = await authCheck(site, state)
      if (!data.result) {
        return { ok: true, data: { pending: false, errcode: data.errcode } }
      }
      if (!data.id_token || !data.challenge) {
        return { ok: false, error: "Auth check missing id_token or challenge." }
      }
      const real = await generateVnumber(data.challenge, site.version)
      const choices = vnumberChoices(real)
      return {
        ok: true,
        data: {
          pending: true,
          idToken: data.id_token,
          choices,
          realNumber: real
        }
      }
    }

    if (msg.type === "approve") {
      const state = await loadState()
      const site = selectSite(state)
      if (msg.selectedNumber !== msg.realNumber) {
        return { ok: false, error: "Selected number does not match." }
      }
      const result = await approveAuth(site, state, msg.idToken)
      if (!result.result) {
        return {
          ok: false,
          error: `Approval failed: ${result.errcode || JSON.stringify(result)}`
        }
      }
      return { ok: true, data: { approved: true } }
    }

    if (msg.type === "auto-approve-if-match") {
      const state = await loadState()
      const site = selectSite(state)
      const data = await authCheck(site, state)
      if (!data.result || !data.id_token || !data.challenge) {
        return {
          ok: true,
          data: { matched: false, reason: "no-pending-request" }
        }
      }
      const real = await generateVnumber(data.challenge, site.version)
      if (real !== msg.displayedDigits) {
        return { ok: true, data: { matched: false, reason: "mismatch", real } }
      }
      const result = await approveAuth(site, state, data.id_token)
      if (!result.result) {
        return {
          ok: false,
          error: `Approval failed: ${result.errcode || JSON.stringify(result)}`
        }
      }
      return { ok: true, data: { matched: true, approved: true } }
    }

    if (msg.type === "logout") {
      await resetState()
      return { ok: true, data: { reset: true } }
    }

    return { ok: false, error: "Unknown message type." }
  } catch (e) {
    return { ok: false, error: (e as Error).message || String(e) }
  }
}

chrome.runtime.onMessage.addListener((message: Msg, sender, sendResponse) => {
  if (message.type === "exec-login-proc-mfa") {
    const tabId = sender.tab?.id
    if (tabId == null) {
      sendResponse({ ok: false, error: "No tab id from sender." })
      return
    }
    chrome.scripting
      .executeScript({
        target: { tabId, frameIds: sender.frameId != null ? [sender.frameId] : undefined },
        world: "MAIN",
        func: () => {
          try {
            ;(window as any).loginProcMfa?.()
          } catch (e) {
            console.error("[Kaikey] loginProcMfa failed", e)
          }
        }
      })
      .then(() => sendResponse({ ok: true, data: { executed: true } }))
      .catch((e) =>
        sendResponse({ ok: false, error: (e as Error).message || String(e) })
      )
    return true
  }
  handle(message)
    .then(sendResponse)
    .catch((e) =>
      sendResponse({ ok: false, error: (e as Error).message || String(e) })
    )
  return true // async response.
})

chrome.runtime.onInstalled.addListener(async () => {
  await loadState()
})
