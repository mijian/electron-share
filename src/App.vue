<template>
  <div class="container">
    <h1>Electron + Vue 2 + TS Share Demo</h1>
    <p>Version: {{ appVersion }}</p>

    <!-- 1. IPC Communication -->
    <div class="card">
      <h2>1. IPC Communication (双向/窗口)</h2>
      <div style="display: flex; gap: 10px;">
        <button @click="handlePing">Send Ping</button>
        <button @click="openNewWindow" style="background-color: #3498db;">打开新窗口</button>
      </div>
      <p>Result: <strong>{{ pingResult }}</strong></p>
    </div>

    <!-- 2. Common Scenarios -->
    <div class="card">
      <h2>2. 常见桌面端场景 (Native APIs)</h2>
      
      <div class="demo-item">
        <strong>系统信息:</strong>
        <button @click="getSystemInfo" class="small-btn">获取</button>
        <pre v-if="systemInfo">{{ systemInfo }}</pre>
      </div>

      <div class="demo-item">
        <strong>文件对话框:</strong>
        <button @click="openFileDialog" class="small-btn">选择图片</button>
        <div v-if="selectedFiles.length" style="margin-top:5px; font-size: 0.8em;">
          选中: {{ selectedFiles.join(', ') }}
        </div>
      </div>

      <div class="demo-item">
        <strong>系统弹窗:</strong>
        <button @click="showMessageBox" class="small-btn">显示 Message Box</button>
        <span style="margin-left: 10px; font-size: 0.9em;">点击结果: {{ messageBoxResult }}</span>
      </div>

      <div class="demo-item">
        <strong>剪贴板:</strong>
        <div style="display: flex; gap: 5px;">
          <input v-model="clipboardInput" placeholder="输入内容" style="width: 120px;">
          <button @click="writeClipboard" class="small-btn">写入</button>
          <button @click="readClipboard" class="small-btn">读取</button>
        </div>
        <div style="margin-top: 5px; font-size: 0.9em;">当前剪贴板: {{ clipboardContent }}</div>
      </div>

      <div class="demo-item">
        <strong>外部链接:</strong>
        <a href="#" @click.prevent="openExternal">在默认浏览器打开 Google</a>
      </div>
    </div>

    <!-- 3. Permission -->
    <PermissionDemo />

    <!-- 4. Auto Update -->
    <UpdateDemo />

    <!-- 5. System Integration -->
    <div class="card">
      <h2>5. 系统集成 (System Integration)</h2>
      <div class="demo-item">
        <strong>系统托盘 (Tray):</strong>
        <span style="font-size: 0.9em; color: #aaa;">请查看任务栏右下角图标 (双击显示/右键菜单)</span>
      </div>
      <div class="demo-item">
        <strong>应用菜单 (Menu):</strong>
        <span style="font-size: 0.9em; color: #aaa;">请查看顶部自定义菜单 (Demo / 视图)</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import PermissionDemo from './components/PermissionDemo.vue'
import UpdateDemo from './components/UpdateDemo.vue'

export default Vue.extend({
  name: 'App',
  components: {
    PermissionDemo,
    UpdateDemo
  },
  data() {
    return {
      appVersion: '',
      pingResult: '',
      
      // Scenarios Data
      systemInfo: null as any,
      selectedFiles: [] as string[],
      messageBoxResult: '',
      clipboardInput: 'Hello Clipboard',
      clipboardContent: ''
    }
  },
  async mounted() {
    this.appVersion = await window.electronAPI.getAppVersion()
  },
  methods: {
    // 1. IPC
    async handlePing() {
      this.pingResult = await window.electronAPI.ping()
    },
    openNewWindow() {
      window.electronAPI.openWindow()
    },

    // 2. Common Scenarios
    async getSystemInfo() {
      this.systemInfo = await window.electronAPI.getSystemInfo()
    },
    async openFileDialog() {
      this.selectedFiles = await window.electronAPI.openFileDialog()
    },
    async showMessageBox() {
      const response = await window.electronAPI.showMessageBox('这是一个原生系统弹窗演示')
      this.messageBoxResult = response === 0 ? '点击了确定' : '点击了取消'
    },
    async writeClipboard() {
      await window.electronAPI.clipboardWrite(this.clipboardInput)
      this.clipboardContent = '(已写入)'
    },
    async readClipboard() {
      this.clipboardContent = await window.electronAPI.clipboardRead()
    },
    openExternal() {
      window.electronAPI.openExternal('https://www.google.com')
    }
  }
})
</script>

<style>
body {
  font-family: 'Segoe UI', sans-serif;
  background-color: #1e1e1e;
  color: #fff;
  margin: 0;
  display: flex;
  justify-content: center;
}

.container {
  max-width: 900px;
  width: 100%;
  padding: 20px;
}

h1 { text-align: center; color: #42b883; }

.card {
  background: #2d2d2d;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

h2 {
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
  font-size: 1.2rem;
  color: #ddd;
}

button {
  background-color: #42b883;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover { background-color: #3aa876; }

.small-btn {
  padding: 4px 10px;
  font-size: 12px;
  margin-left: 10px;
}

.demo-item {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #333;
}

.demo-item:last-child { border-bottom: none; }

pre {
  background: #111;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #8be9fd;
}

.log-box {
  background: #111;
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  font-family: monospace;
  max-height: 80px;
  overflow-y: auto;
  font-size: 0.85rem;
  color: #aaa;
}

a { color: #3498db; text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
