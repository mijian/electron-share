import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 1. IPC 通信: 双向
  ping: () => ipcRenderer.invoke('ping'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 2. IPC 通信: 单向 (通知)
  checkUpdate: () => ipcRenderer.send('check-update'),
  openWindow: (url?: string) => ipcRenderer.send('open-new-window', url),
  
  // 3. IPC 通信: 监听 (被动接收)
  onUpdateStatus: (callback: (status: string) => void) => 
    ipcRenderer.on('update-status', (_event, value) => callback(value)),

  // 4. Node.js 能力暴露 (无需 IPC)
  sha256: (text: string) => require('crypto').createHash('sha256').update(text).digest('hex'),

  // 5. 常见场景演示 (新)
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  showMessageBox: (msg: string) => ipcRenderer.invoke('show-message-box', msg),
  clipboardWrite: (text: string) => ipcRenderer.invoke('clipboard-write', text),
  clipboardRead: () => ipcRenderer.invoke('clipboard-read'),
  openExternal: (url: string) => ipcRenderer.send('open-external', url)
})
