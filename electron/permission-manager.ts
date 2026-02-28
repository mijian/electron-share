import { BrowserWindow, dialog, session, webContents, systemPreferences } from 'electron'
import * as os from 'os'

/**
 * 设置权限请求处理器
 * 优化点：
 * 1. 针对不同权限类型，提供细粒度的控制
 * 2. 对于敏感权限（如摄像头、麦克风），增加用户确认弹窗
 * 3. 记录权限请求日志
 */
export function setupPermissionHandler(mainWindow: BrowserWindow) {
  const ses = session.defaultSession

  // 1. 处理权限请求 (异步)
  ses.setPermissionRequestHandler(async (webContents, permission, callback, details) => {
    const url = details.requestingUrl
    console.log(`[Permission Request] Type: ${permission}, Origin: ${url}`)

    // 默认允许的列表
    const autoAllowedPermissions = [
      'fullscreen', // 全屏
      'pointerLock' // 鼠标锁定
    ]

    if (autoAllowedPermissions.includes(permission)) {
      return callback(true)
    }

    // 针对敏感权限，询问用户
    if (permission === 'media' || permission === 'notifications' || permission === 'midi' || permission === 'openExternal') {
      
      // macOS 系统权限检查 (仅针对摄像头/麦克风)
      if (process.platform === 'darwin' && permission === 'media') {
        const camStatus = systemPreferences.getMediaAccessStatus('camera')
        const micStatus = systemPreferences.getMediaAccessStatus('microphone')
        console.log(`[System Check] Camera: ${camStatus}, Microphone: ${micStatus}`)
        
        if (camStatus === 'denied' || micStatus === 'denied') {
          dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: '系统权限受限',
            message: '请在“系统偏好设置 -> 安全性与隐私”中允许应用访问摄像头和麦克风',
          })
          return callback(false)
        }
      }

      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['允许', '拒绝'],
        defaultId: 0,
        cancelId: 1,
        title: '权限申请',
        message: `应用程序正在请求访问您的 ${getPermissionName(permission)}`,
        detail: `来源: ${url}`
      })

      return callback(response === 0)
    }

    // 其他情况默认拒绝
    console.warn(`[Permission Blocked] Type: ${permission}`)
    callback(false)
  })

  // 2. 处理权限检查 (同步)
  // 注意：某些 API (如 Notification) 会先进行同步检查
  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    // 对于开发环境或特定 Origin，可以直接返回 true
    // 但为了演示完整流程，这里我们还是让它走 RequestHandler (通常 CheckHandler 返回 null/undefined 会回退到 RequestHandler，但 Electron 类型定义要求 boolean)
    // 实际项目中，如果希望每次都询问，这里应该谨慎处理。
    // 这里简单起见，如果是 notifications，我们先允许通过 Check，让它触发 Request (如果适用) 或者直接由 OS 管理
    
    // 注意：setPermissionCheckHandler 的返回值如果是 false，则请求直接失败。
    // 如果是 true，则通过。
    // 对于 Notification，通常 CheckHandler 返回 true 即可，后续逻辑由 OS 或 RequestHandler 决定。
    
    console.log(`[Permission Check] Type: ${permission}, Origin: ${requestingOrigin}`)
    
    // 允许所有检查通过，以便在 RequestHandler 中进行拦截和询问
    // 实际生产环境可能需要更严格的逻辑
    return true
  })
}

function getPermissionName(permission: string): string {
  switch (permission) {
    case 'media': return '摄像头/麦克风'
    case 'notifications': return '系统通知'
    case 'midi': return 'MIDI 设备'
    case 'openExternal': return '外部链接打开'
    default: return permission
  }
}
