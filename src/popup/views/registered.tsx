import { LogOut, Share2 } from "lucide-react"
import { useState } from "react"

import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Switch } from "~components/ui/switch"
import type { DeviceState } from "~lib/auth"
import { sendBg } from "~popup/messaging"

type AuthCheckResult = {
  pending: boolean
  idToken?: string
  choices?: string[]
  realNumber?: string
  errcode?: string
}

export function RegisteredView({
  state,
  autoLogin,
  setAutoLogin,
  onExport
}: {
  state: DeviceState
  autoLogin: boolean
  setAutoLogin: (v: boolean) => void
  onExport: () => void
}) {
  const site = state.sites[0]
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<AuthCheckResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkRequests = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    setPending(null)
    try {
      const reply = await sendBg<AuthCheckResult>({ type: "auth-check" })
      if (!reply.ok) throw new Error(reply.error)
      if (!reply.data.pending) {
        setMessage("No pending request.")
      } else {
        setPending(reply.data)
      }
    } catch (e) {
      setError((e as Error).message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const pickNumber = async (n: string) => {
    if (!pending?.idToken || !pending?.realNumber) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const reply = await sendBg({
        type: "approve",
        idToken: pending.idToken,
        selectedNumber: n,
        realNumber: pending.realNumber
      })
      if (!reply.ok) throw new Error(reply.error)
      setMessage("Approved.")
      setPending(null)
    } catch (e) {
      setError((e as Error).message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const logout = async () => {
    if (!confirmingLogout) {
      setConfirmingLogout(true)
      setTimeout(() => setConfirmingLogout(false), 4000)
      return
    }
    setConfirmingLogout(false)
    setBusy(true)
    try {
      const reply = await sendBg({ type: "logout" })
      if (!reply.ok) throw new Error(reply.error)
      setMessage(null)
      setError(null)
      setPending(null)
    } catch (e) {
      setError((e as Error).message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4 space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">User:</span>{" "}
            <span className="font-medium">{site.display_nm}</span>
          </div>
          <div className="text-xs text-muted-foreground break-all">
            {site.site_id}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Auto-login</div>
            <div className="text-xs text-muted-foreground">
              Auto-pick the matching number on the 2FA page.
            </div>
          </div>
          <Switch checked={autoLogin} onCheckedChange={setAutoLogin} />
        </CardContent>
      </Card>

      <Button className="w-full" disabled={busy} onClick={checkRequests}>
        {busy ? "Checking…" : "Check for login requests"}
      </Button>

      {pending && pending.choices && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Pick the number shown on the website
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {pending.choices.map((n) => (
              <Button
                key={n}
                variant="outline"
                className="text-lg font-semibold h-12"
                disabled={busy}
                onClick={() => pickNumber(n)}>
                {n}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {message && <p className="text-xs text-emerald-600">{message}</p>}
      {error && (
        <p className="text-xs text-destructive break-words">{error}</p>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        disabled={busy}
        onClick={onExport}>
        <Share2 className="h-4 w-4" /> Export to another device
      </Button>

      <Button
        variant={confirmingLogout ? "destructive" : "ghost"}
        size="sm"
        className={
          confirmingLogout
            ? "w-full"
            : "w-full text-muted-foreground"
        }
        disabled={busy}
        onClick={logout}>
        <LogOut className="h-4 w-4" />
        {confirmingLogout ? "Click again to confirm" : "Logout"}
      </Button>
    </div>
  )
}
