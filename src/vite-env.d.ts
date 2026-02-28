/// <reference types="vite/client" />

interface ElectronAPI {
  // IPC Basics
  ping: () => Promise<string>
  getAppVersion: () => Promise<string>
  checkUpdate: () => void
  openWindow: (url?: string) => void
  onUpdateStatus: (callback: (status: string) => void) => void
  sha256: (text: string) => string

  // Common Scenarios
  getSystemInfo: () => Promise<any>
  openFileDialog: () => Promise<string[]>
  showMessageBox: (msg: string) => Promise<number>
  clipboardWrite: (text: string) => Promise<string>
  clipboardRead: () => Promise<string>
  openExternal: (url: string) => void
}

interface Window {
  electronAPI: ElectronAPI
}
