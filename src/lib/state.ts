import { Storage } from "@plasmohq/storage"

import { newDeviceState, type DeviceState } from "./auth"

export const storage = new Storage({ area: "local" })

export const STATE_KEY = "auth_state"
export const AUTO_LOGIN_KEY = "auto_login_enabled"

export async function loadState(): Promise<DeviceState> {
  const existing = await storage.get<DeviceState>(STATE_KEY)
  if (existing && existing.device_id && Array.isArray(existing.sites)) {
    return existing
  }
  const fresh = newDeviceState()
  await storage.set(STATE_KEY, fresh)
  return fresh
}

export async function saveState(state: DeviceState): Promise<void> {
  await storage.set(STATE_KEY, state)
}

export async function resetState(): Promise<DeviceState> {
  const fresh = newDeviceState()
  await storage.set(STATE_KEY, fresh)
  return fresh
}

export async function getAutoLogin(): Promise<boolean> {
  const v = await storage.get<boolean>(AUTO_LOGIN_KEY)
  return v === undefined ? true : Boolean(v)
}

export async function setAutoLogin(enabled: boolean): Promise<void> {
  await storage.set(AUTO_LOGIN_KEY, enabled)
}
