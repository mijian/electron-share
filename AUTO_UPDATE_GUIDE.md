# Electron 自动更新完整指南 (Auto Update Guide)

本文档将指导您如何理解和配置 Electron 应用的自动更新功能。

## 1. 核心原理

Electron 自动更新主要依赖两个组件：
1.  **electron-builder**: 负责打包应用，并生成更新配置文件 (`latest.yml`)。
2.  **electron-updater**: 负责在应用运行时检查更新、下载和安装。

## 2. 演示 Demo (如何体验)

本项目已经内置了一个完整的自动更新演示。

### 开发环境 (Mock 模式)
为了方便在开发阶段体验交互流程，我们实现了一套 Mock（模拟）逻辑。

1.  运行项目：`npm run dev`
2.  在应用界面找到 **"4. 自动更新演示 (Auto Update)"** 卡片。
3.  点击 **"检查更新"** 按钮。
4.  您将看到模拟的全流程：
    *   检查更新 -> 发现新版本 -> 弹窗询问 -> 模拟下载进度 -> 下载完成 -> 模拟重启。

### 生产环境 (真实模式)
当应用被打包 (`npm run build`) 后，`electron-updater` 会自动接管逻辑，连接真实的更新服务器。

## 3. 真实环境配置步骤

要实现真实的自动更新，您需要配置更新源（Publish Provider）。最简单的方式是使用 GitHub Releases。

### 第一步：配置 package.json

在 `package.json` 的 `build` 字段中添加 `publish` 配置：

```json
"build": {
  "publish": [
    {
      "provider": "github",
      "owner": "您的GitHub用户名",
      "repo": "您的仓库名"
    }
  ],
  // ... 其他配置
}
```

### 第二步：配置 GitHub Token (仅 CI/CD 需要)
如果您在本地打包并上传，通常需要配置 `GH_TOKEN` 环境变量，或者使用 `electron-builder` 的自动发布功能。

### 第三步：发布流程

1.  **修改版本号**：在 `package.json` 中增加版本号 (例如从 `1.0.0` 改为 `1.0.1`)。
2.  **打包**：运行 `npm run build`。
3.  **上传**：
    *   `electron-builder` 会在 `release` 目录下生成 `ElectronVue2Share Setup 1.0.1.exe` 和 `latest.yml`。
    *   在 GitHub 上创建一个新的 Release（Tag 为 `v1.0.1`）。
    *   将生成的 `.exe` 和 `latest.yml` 文件上传到该 Release 中。
    *   **发布 Release**。

### 第四步：用户端更新
当用户打开旧版本 (`1.0.0`) 的应用时，`electron-updater` 会：
1.  读取 GitHub 上的 `latest.yml`。
2.  发现版本 `1.0.1` 比当前版本大。
3.  自动下载新版本的 `.exe`。
4.  下载完成后，提示用户重启安装。

## 4. 关键代码解析

### 主进程 (`electron/auto-update.ts`)
```typescript
import { autoUpdater } from 'electron-updater'

// 设置不自动下载，以便我们可以手动控制（例如先弹窗询问用户）
autoUpdater.autoDownload = false

// 监听 "update-available" 事件
autoUpdater.on('update-available', (info) => {
  // 弹窗询问用户是否下载
  dialog.showMessageBox(...).then((result) => {
    if (result.response === 0) {
      // 用户同意后，开始下载
      autoUpdater.downloadUpdate() 
    }
  })
})

// 监听 "update-downloaded" 事件
autoUpdater.on('update-downloaded', () => {
  // 下载完成，退出并安装
  autoUpdater.quitAndInstall()
})
```

## 5. 常见问题

*   **Q: 开发环境报错 "dev-app-update.yml" 不存在？**
    *   A: 这是正常的。开发环境无法进行真实更新。请使用我们的 Mock 模式进行 UI 调试。
*   **Q: 打包后白屏？**
    *   A: 请检查 `vite.config.ts` 中的 `base: './'` 配置是否正确。
*   **Q: 更新下载慢？**
    *   A: GitHub 在国内访问较慢。可以考虑配置 `provider: 'generic'` 并使用国内的 OSS/S3 服务作为更新源。
