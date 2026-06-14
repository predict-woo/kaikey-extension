import { Download, QrCode, Upload } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import {
  REGISTER_URL,
  UPLOAD_WINDOW_URL,
  WINDOW_MODE
} from "~popup/constants"
import { sendBg } from "~popup/messaging"
import { decodeQrFromFile } from "~popup/qr"

// Firefox closes the toolbar popup the moment an OS file dialog opens
// (bug 1292701). The Firefox build opens a windows.create popup window
// for the upload step so the file picker has somewhere stable to live.
// Chrome is unaffected and keeps the original in-popup file picker.
// Inlined here (not in ~popup/constants) so dead-code elimination strips
// the Firefox-only branch from the Chrome bundle.
const NEED_UPLOAD_WINDOW =
  process.env.PLASMO_BROWSER === "firefox" && !WINDOW_MODE

export function SetupView({ onImport }: { onImport: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const openRegistrationPage = () => {
    chrome.tabs.create({ url: REGISTER_URL })
  }

  const openUploadWindow = () => {
    chrome.windows.create({
      url: UPLOAD_WINDOW_URL,
      type: "popup",
      width: 380,
      height: 360
    })
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
      if (WINDOW_MODE) {
        window.close()
        return
      }
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
          onClick={
            NEED_UPLOAD_WINDOW
              ? openUploadWindow
              : () => fileRef.current?.click()
          }>
          <Upload className="h-4 w-4" />
          {busy ? "Registering…" : "Upload QR screenshot"}
        </Button>
        {error && (
          <p className="text-xs text-destructive break-words">{error}</p>
        )}
        {success && <p className="text-xs text-emerald-600">{success}</p>}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={onImport}>
          <Download className="h-4 w-4" /> Import from another device
        </Button>
      </CardContent>
    </Card>
  )
}
