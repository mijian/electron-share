import { app, BrowserWindow, ipcMain, session, dialog, shell, clipboard, Notification, Menu, Tray, nativeImage } from 'electron'
import { join } from 'path'
import * as os from 'os'
import { setupPermissionHandler } from './permission-manager'
import { setupAutoUpdate } from './auto-update'

// Disable security warnings for demo
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
let tray: Tray | null = null

function createTray() {
  console.log('正在创建系统托盘 (Bitmap Mode)...')
  
  // 方案: 使用 nativeImage.createFromBitmap 直接生成原生位图
  // 这可以避开所有 PNG 解码/文件路径/Base64 问题
  const size = 32 // 32x32 for High DPI
  const buffer = Buffer.alloc(size * size * 4)
  
  // 填充为红色 (RGBA: 255, 0, 0, 255)
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 255     // R
    buffer[i + 1] = 0   // G
    buffer[i + 2] = 0   // B
    buffer[i + 3] = 255 // A
  }
  
  let trayIcon = nativeImage.createFromBitmap(buffer, { width: size, height: size })
  
  console.log('Bitmap Icon Empty?', trayIcon.isEmpty())
  console.log('Bitmap Icon Size:', trayIcon.getSize())

  tray = new Tray(trayIcon)
  tray.setToolTip('Electron Demo App (Red Box)')
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => win?.show() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])
  
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => win?.show())
  
  tray.displayBalloon({
    title: '系统托盘 (最终修复)',
    content: '如果看到这个气泡，说明托盘逻辑已执行。请寻找红色方块！',
    iconType: 'info'
  })
  
  console.log('系统托盘创建成功！')
}

function createMenu() {
  const template = [
    {
      label: 'Demo',
      submenu: [
        { label: '关于', click: () => dialog.showMessageBox({ title: 'About', message: 'Electron Vue 2 Demo v1.0' }) },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900, // 稍微增加高度以容纳更多 demo
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  // --- Permission Handling ---
  setupPermissionHandler(win)

  // --- Auto Update ---
  setupAutoUpdate(win)
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  createMenu()

  // --- 1. IPC Handlers ---
  ipcMain.handle('ping', () => 'pong (来自主进程)')
  ipcMain.handle('get-app-version', () => app.getVersion())

  // --- 2. 窗口管理 ---
  ipcMain.on('open-new-window', (event, url) => {
    const child = new BrowserWindow({ width: 600, height: 400, autoHideMenuBar: true })
    const content = `
      <body style="background:#222;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
        <h2>New Window</h2>
        <p>This is a separate renderer process.</p>
        <p>PID: ${process.pid}</p>
        <button onclick="window.close()" style="padding:8px 16px;cursor:pointer;background:#42b883;color:white;border:none;border-radius:4px;">Close</button>
      </body>
    `
    child.loadURL(url || `data:text/html;charset=utf-8,${encodeURIComponent(content)}`)
  })

  // --- 3. 常见场景演示 Handlers ---
  
  // 3.1 系统信息
  ipcMain.handle('get-system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus()[0].model,
      memory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      homeDir: os.homedir()
    }
  })

  // 3.2 原生对话框 (Dialog)
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
    })
    return result.filePaths
  })

  ipcMain.handle('show-message-box', async (event, msg) => {
    const result = await dialog.showMessageBox(win!, {
      type: 'info',
      title: 'Electron Demo',
      message: msg,
      buttons: ['确定', '取消']
    })
    return result.response // 0 或 1
  })

  // 3.3 剪贴板操作
  ipcMain.handle('clipboard-write', (event, text) => {
    clipboard.writeText(text)
    return '已写入剪贴板'
  })
  
  ipcMain.handle('clipboard-read', () => {
    return clipboard.readText()
  })

  // 3.4 默认浏览器打开链接
  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url)
  })

  // --- 4. Auto Update Mock ---
  // 移至 auto-update.ts 统一管理
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
