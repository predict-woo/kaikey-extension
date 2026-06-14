import { ArrowLeft, QrCode } from "lucide-react"
import qrcode from "qrcode-generator"
import { useState } from "react"

import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { encryptState } from "~lib/share"
import { loadState } from "~lib/state"

export function ExportView({ onBack }: { onBack: () => void }) {
  const [passphrase, setPassphrase] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blob, setBlob] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setError(null)
    if (passphrase.length < 6) {
      setError("Passphrase must be at least 6 characters.")
      return
    }
    if (passphrase !== confirm) {
      setError("Passphrases do not match.")
      return
    }
    setBusy(true)
    try {
      const state = await loadState()
      if (!state.sites?.length) {
        setError("Nothing to export — no device registered.")
        return
      }
      const encoded = await encryptState(state, passphrase)
      const qr = qrcode(0, "L")
      qr.addData(encoded)
      qr.make()
      setQrDataUrl(qr.createDataURL(4, 2))
      setBlob(encoded)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const copyBlob = async () => {
    if (!blob) return
    try {
      await navigator.clipboard.writeText(blob)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("Could not copy to clipboard.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Export device</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!blob ? (
          <>
            <p className="text-xs text-muted-foreground">
              Set a one-time passphrase. Enter the same on the receiving
              device.
            </p>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Passphrase (min 6 chars)"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm passphrase"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") generate()
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
            <Button className="w-full" onClick={generate} disabled={busy}>
              <QrCode className="h-4 w-4" />
              {busy ? "Encrypting…" : "Generate"}
            </Button>
          </>
        ) : (
          <>
            <img
              src={qrDataUrl!}
              alt="Share QR"
              className="mx-auto block bg-white p-1 rounded"
              style={{
                width: 200,
                height: 200,
                imageRendering: "pixelated"
              }}
            />
            <p className="text-[11px] text-muted-foreground text-center">
              Scan with your phone's camera, or copy the text below.
            </p>
            <textarea
              readOnly
              className="w-full h-16 rounded-md border border-input bg-background p-2 font-mono text-[9px] break-all"
              value={blob}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={copyBlob}>
              {copied ? "Copied." : "Copy text"}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Enter the same passphrase on the receiving device to decrypt.
            </p>
          </>
        )}
        {error && (
          <p className="text-xs text-destructive break-words">{error}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </CardContent>
    </Card>
  )
}
