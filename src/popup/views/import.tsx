import { ArrowLeft, Download } from "lucide-react"
import { useState } from "react"

import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import type { DeviceState } from "~lib/auth"
import { decryptState } from "~lib/share"
import { STATE_KEY, storage } from "~lib/state"

export function ImportView({
  onBack,
  onSuccess
}: {
  onBack: () => void
  onSuccess: () => void
}) {
  const [blob, setBlob] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performImport = async () => {
    setError(null)
    const trimmed = blob.trim()
    if (!trimmed) {
      setError("Paste the encoded text from the source device.")
      return
    }
    if (!passphrase) {
      setError("Enter the passphrase from the source device.")
      return
    }
    setBusy(true)
    try {
      const state = await decryptState<DeviceState>(trimmed, passphrase)
      if (
        !state ||
        typeof state !== "object" ||
        !Array.isArray((state as DeviceState).sites)
      ) {
        throw new Error("Decrypted payload is not a Kaikey device state.")
      }
      await storage.set(STATE_KEY, state)
      onSuccess()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Import device</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">
          Paste the encoded text from the source device and enter its
          passphrase.
        </p>
        <textarea
          placeholder="Paste the encoded text here…"
          className="w-full h-24 rounded-md border border-input bg-background p-2 font-mono text-[10px]"
          value={blob}
          onChange={(e) => setBlob(e.target.value)}
        />
        <input
          type="password"
          autoComplete="off"
          placeholder="Passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") performImport()
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
        <Button className="w-full" onClick={performImport} disabled={busy}>
          <Download className="h-4 w-4" />
          {busy ? "Decrypting…" : "Import"}
        </Button>
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
