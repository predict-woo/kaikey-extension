export type Reply<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
}

export function sendBg<T = unknown>(msg: any): Promise<Reply<T>> {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve))
}
