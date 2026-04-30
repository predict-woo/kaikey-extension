import { useStorage } from "@plasmohq/storage/hook"
import { LogOut, QrCode, ShieldCheck, Upload } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Switch } from "~components/ui/switch"
import type { DeviceState } from "~lib/auth"
import { AUTO_LOGIN_KEY, STATE_KEY, storage } from "~lib/state"
import { sendBg } from "~popup/messaging"
import { decodeQrFromFile } from "~popup/qr"

import "./style.css"

const REGISTER_URL =
  "https://sso.kaist.ac.kr/auth/twofactor/mfa/regist/step01"

type AuthCheckResult = {
  pending: boolean
  idToken?: string
  choices?: string[]
  realNumber?: string
  errcode?: string
}

function IndexPopup() {
  const [state] = useStorage<DeviceState>({ key: STATE_KEY, instance: storage })
  const [autoLogin, setAutoLogin] = useStorage<boolean>(
    { key: AUTO_LOGIN_KEY, instance: storage },
    (v) => (v === undefined ? true : v)
  )

  const hasSite = !!state?.sites?.length

  return (
    <div className="p-4 space-y-3 text-foreground">
      <header className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold">Kaikey</h1>
      </header>
      {hasSite ? (
        <RegisteredView
          state={state!}
          autoLogin={!!autoLogin}
          setAutoLogin={setAutoLogin}
        />
      ) : (
        <SetupView />
      )}
    </div>
  )
}

function SetupView() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const openRegistrationPage = () => {
    chrome.tabs.create({ url: REGISTER_URL })
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const qrJson = await decodeQrFromFile(file)
      const reply = await sendBg<{ site_id: string; display_nm: string }>({
        type: "register",
        qrJson
      })
      if (!reply.ok) throw new Error(reply.error)
      setSuccess(
        `Registered ${reply.data.display_nm} (${reply.data.site_id}).`
      )
    } catch (err) {
      setError((err as Error).message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          <li>Open the registration page and complete registration.</li>
          <li>
            A QR code will be shown at the end. Take a screenshot of it.
          </li>
          <li>Upload the screenshot below.</li>
        </ol>
        <Button className="w-full" onClick={openRegistrationPage}>
          <QrCode className="h-4 w-4" /> Open registration page
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        <Button
          className="w-full"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {busy ? "Registering…" : "Upload QR screenshot"}
        </Button>
        {error && (
          <p className="text-xs text-destructive break-words">{error}</p>
        )}
        {success && <p className="text-xs text-emerald-600">{success}</p>}
      </CardContent>
    </Card>
  )
}

function RegisteredView({
  state,
  autoLogin,
  setAutoLogin
}: {
  state: DeviceState
  autoLogin: boolean
  setAutoLogin: (v: boolean) => void
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

export default IndexPopup
