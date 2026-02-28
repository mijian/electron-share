import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

// 配置日志 (可选)
// autoUpdater.logger = require("electron-log")
// @ts-ignore
// autoUpdater.logger.transports.file.level = "info"

// 自动下载配置 (设为 false 可手动控制下载时机)
autoUpdater.autoDownload = false

export function setupAutoUpdate(win: BrowserWindow) {
  
  // 1. 设置更新源 (通常在 package.json 中配置 publish 字段，这里也可以动态设置)
  // 注意：在实际项目中，如果不配置 setFeedURL，electron-updater 会自动读取 package.json 中的 build.publish 配置
  // autoUpdater.setFeedURL({
  //   provider: 'generic',
  //   url: 'https://your-update-server.com/download/'
  // })

  // --- 监听更新事件 ---

  // 1. 开始检查
  autoUpdater.on('checking-for-update', () => {
    win.webContents.send('update-status', '正在检查更新...')
  })

  // 2. 发现新版本
  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update-status', `发现新版本 v${info.version}，准备下载...`)
    // 手动触发下载
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 v${info.version}，是否现在更新？`,
      buttons: ['是', '否']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  // 3. 没有新版本
  autoUpdater.on('update-not-available', (info) => {
    win.webContents.send('update-status', '当前已是最新版本。')
  })

  // 4. 下载出错
  autoUpdater.on('error', (err) => {
    win.webContents.send('update-status', '更新出错: ' + err.message)
  })

  // 5. 下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    // let log_message = "下载速度: " + progressObj.bytesPerSecond
    // log_message = log_message + ' - 已下载 ' + progressObj.percent + '%'
    // log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
    win.webContents.send('update-status', `下载中: ${Math.round(progressObj.percent)}%`)
  })

  // 6. 下载完成，准备安装
  autoUpdater.on('update-downloaded', (info) => {
    win.webContents.send('update-status', '下载完成，即将重启安装...')
    
    dialog.showMessageBox({
      title: '安装更新',
      message: '更新已下载完毕，应用将重启以完成安装。',
      buttons: ['立即重启']
    }).then(() => {
      autoUpdater.quitAndInstall()
    })
  })

  // --- 接收渲染进程指令 ---
  
  // 移除旧的监听器以防止重复添加
  ipcMain.removeHandler('check-update') // 如果之前是 handle
  ipcMain.removeAllListeners('check-update')

  ipcMain.on('check-update', () => {
    // 仅在打包环境下检查，开发环境通常跳过或 mock
    if (app.isPackaged) {
      autoUpdater.checkForUpdates()
    } else {
      // --- 模拟完整的自动更新流程 (Mock) ---
      const mockVersion = '2.0.0'
      win.webContents.send('update-status', '开发环境: 开始模拟更新流程...')
      
      // 1. 模拟检查
      setTimeout(() => {
        win.webContents.send('update-status', '正在检查更新 (Mock)...')
        
        // 2. 模拟发现新版本
        setTimeout(async () => {
          win.webContents.send('update-status', `发现新版本 v${mockVersion} (Mock)，准备下载...`)
          
          // 模拟弹窗询问
          const { response } = await dialog.showMessageBox({
            type: 'info',
            title: '发现新版本 (Mock)',
            message: `发现新版本 v${mockVersion}，是否现在更新？\n(这是一个开发环境的模拟弹窗)`,
            buttons: ['是', '否']
          })

          if (response === 0) {
            // 用户点击“是”，模拟下载进度
            let progress = 0
            win.webContents.send('update-status', '开始下载... (Mock)')
            
            const timer = setInterval(() => {
              progress += 10
              win.webContents.send('update-status', `下载中: ${progress}% (Mock)`)
              
              if (progress >= 100) {
                clearInterval(timer)
                
                // 3. 模拟下载完成
                win.webContents.send('update-status', '下载完成，准备安装... (Mock)')
                
                setTimeout(() => {
                  dialog.showMessageBox({
                    title: '安装更新 (Mock)',
                    message: '更新已下载完毕，应用将重启以完成安装。\n(点击确定将模拟重启)',
                    buttons: ['立即重启']
                  }).then(() => {
                    // 模拟重启
                    app.relaunch()
                    app.exit(0)
                  })
                }, 1000)
              }
            }, 500)
          } else {
             win.webContents.send('update-status', '用户取消了更新 (Mock)')
          }
        }, 1500)
      }, 1000)
    }
  })
}