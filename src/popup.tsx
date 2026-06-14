import { useStorage } from "@plasmohq/storage/hook"
import { ShieldCheck } from "lucide-react"
import { useState } from "react"

import type { DeviceState } from "~lib/auth"
import { AUTO_LOGIN_KEY, STATE_KEY, storage } from "~lib/state"
import { ExportView } from "~popup/views/export"
import { ImportView } from "~popup/views/import"
import { RegisteredView } from "~popup/views/registered"
import { SetupView } from "~popup/views/setup"

import "./style.css"

type View = "default" | "export" | "import"

function IndexPopup() {
  const [state] = useStorage<DeviceState>({ key: STATE_KEY, instance: storage })
  const [autoLogin, setAutoLogin] = useStorage<boolean>(
    { key: AUTO_LOGIN_KEY, instance: storage },
    (v) => (v === undefined ? true : v)
  )
  const [view, setView] = useState<View>("default")

  const hasSite = !!state?.sites?.length
  const back = () => setView("default")

  let body: JSX.Element
  if (view === "export") {
    body = <ExportView onBack={back} />
  } else if (view === "import") {
    body = <ImportView onBack={back} onSuccess={back} />
  } else if (hasSite) {
    body = (
      <RegisteredView
        state={state!}
        autoLogin={!!autoLogin}
        setAutoLogin={setAutoLogin}
        onExport={() => setView("export")}
      />
    )
  } else {
    body = <SetupView onImport={() => setView("import")} />
  }

  return (
    <div className="p-4 space-y-3 text-foreground">
      <header className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold">Kaikey</h1>
      </header>
      {body}
    </div>
  )
}

export default IndexPopup
