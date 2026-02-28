<template>
  <div class="permission-card">
    <h2>3. 权限管理演示 (Permission Demo)</h2>
    <p class="desc">
      Electron 主进程拦截权限请求，并弹出自定义对话框询问用户。<br>
      (请点击下方按钮体验流程)
    </p>

    <div class="perm-grid">
      <!-- 1. 摄像头权限 -->
      <div class="perm-item">
        <div class="perm-header">
          <span class="icon">📷</span>
          <span class="name">摄像头 (Camera)</span>
        </div>
        <div class="perm-status" :class="cameraStatus">
          {{ getStatusText(cameraStatus) }}
        </div>
        <button 
          @click="requestCamera" 
          :disabled="cameraStatus === 'granted' || loading.camera"
          class="action-btn"
        >
          {{ loading.camera ? '请求中...' : '请求访问' }}
        </button>
        <button 
          @click="checkDevices" 
          class="sub-btn"
          style="margin-top: 5px;"
        >
          检查设备
        </button>
      </div>

      <!-- 2. 麦克风权限 -->
      <div class="perm-item">
        <div class="perm-header">
          <span class="icon">🎤</span>
          <span class="name">麦克风 (Microphone)</span>
        </div>
        <div class="perm-status" :class="micStatus">
          {{ getStatusText(micStatus) }}
        </div>
        <button 
          @click="requestMic" 
          :disabled="micStatus === 'granted' || loading.mic"
          class="action-btn"
        >
          {{ loading.mic ? '请求中...' : '请求访问' }}
        </button>
        <button 
          @click="checkDevices" 
          class="sub-btn"
          style="margin-top: 5px;"
        >
          检查设备
        </button>
      </div>

      <!-- 3. 通知权限 -->
      <div class="perm-item">
        <div class="perm-header">
          <span class="icon">🔔</span>
          <span class="name">系统通知 (Notification)</span>
        </div>
        <div class="perm-status" :class="notifyStatus">
          {{ getStatusText(notifyStatus) }}
        </div>
        <button 
          @click="requestNotification" 
          :disabled="notifyStatus === 'granted' || loading.notify"
          class="action-btn"
        >
          {{ loading.notify ? '请求中...' : '发送通知' }}
        </button>
      </div>
    </div>
    
    <!-- 结果展示区域 -->
    <div v-if="logs.length" class="log-container">
      <div v-for="(log, idx) in logs" :key="idx" class="log-item">{{ log }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

type Status = 'unknown' | 'granted' | 'denied' | 'unsupported'

export default Vue.extend({
  name: 'PermissionDemo',
  data() {
    return {
      cameraStatus: 'unknown' as Status,
      micStatus: 'unknown' as Status,
      notifyStatus: 'unknown' as Status,
      
      loading: {
        camera: false,
        mic: false,
        notify: false
      },
      
      logs: [] as string[]
    }
  },
  mounted() {
    this.checkInitialStatus()
  },
  methods: {
    addLog(msg: string) {
      const time = new Date().toLocaleTimeString()
      this.logs.unshift(`[${time}] ${msg}`)
      if (this.logs.length > 5) this.logs.pop()
    },
    
    getStatusText(status: Status) {
      const map = {
        unknown: '未请求',
        granted: '已允许',
        denied: '已拒绝',
        unsupported: '不支持'
      }
      return map[status]
    },

    async checkInitialStatus() {
      // 检查通知权限
      if (!("Notification" in window)) {
        this.notifyStatus = 'unsupported'
      } else if (Notification.permission === 'granted') {
        this.notifyStatus = 'granted'
      } else if (Notification.permission === 'denied') {
        this.notifyStatus = 'denied'
      }
      
      // 其他权限很难在不请求的情况下知道状态，保持 unknown
    },

    // 辅助：列出设备
    async checkDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        
        // 1. 摄像头
        const cameras = devices.filter(d => d.kind === 'videoinput')
        if (cameras.length === 0) {
          this.addLog('警告: 未检测到摄像头设备！')
        } else {
          this.addLog(`检测到 ${cameras.length} 个摄像头:`)
          cameras.forEach(c => this.addLog(`- ${c.label || 'Unknown Camera'} (${c.deviceId.slice(0, 5)}...)`))
        }

        // 2. 麦克风
        const mics = devices.filter(d => d.kind === 'audioinput')
        if (mics.length === 0) {
          this.addLog('警告: 未检测到麦克风设备！')
        } else {
          this.addLog(`检测到 ${mics.length} 个麦克风:`)
          mics.forEach(m => this.addLog(`- ${m.label || 'Unknown Mic'} (${m.deviceId.slice(0, 5)}...)`))
        }
      } catch (err: any) {
        this.addLog(`设备枚举失败: ${err.message}`)
      }
    },

    // 1. 请求摄像头
    async requestCamera() {
      this.loading.camera = true
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        this.cameraStatus = 'granted'
        this.addLog('摄像头权限获取成功')
        stream.getTracks().forEach(track => track.stop())
      } catch (err: any) {
        console.error(err)
        this.cameraStatus = 'denied'
        if (err.name === 'NotFoundError') {
          this.addLog('错误: 未找到摄像头设备 (NotFoundError)')
        } else if (err.name === 'NotAllowedError') {
          this.addLog('错误: 用户/系统拒绝了权限 (NotAllowedError)')
        } else {
          this.addLog(`摄像头错误: ${err.message}`)
        }
      } finally {
        this.loading.camera = false
      }
    },

    // 2. 请求麦克风
    async requestMic() {
      this.loading.mic = true
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.micStatus = 'granted'
        this.addLog('麦克风权限获取成功')
        stream.getTracks().forEach(track => track.stop())
      } catch (err: any) {
        console.error(err)
        this.micStatus = 'denied'
        if (err.name === 'NotFoundError') {
          this.addLog('错误: 未找到麦克风设备 (NotFoundError)')
        } else if (err.name === 'NotAllowedError') {
          this.addLog('错误: 用户/系统拒绝了权限 (NotAllowedError)')
        } else {
          this.addLog(`麦克风错误: ${err.message}`)
        }
      } finally {
        this.loading.mic = false
      }
    },

    // 3. 请求通知
    requestNotification() {
      if (this.notifyStatus === 'unsupported') return

      this.loading.notify = true
      Notification.requestPermission().then((permission) => {
        this.loading.notify = false
        if (permission === 'granted') {
          this.notifyStatus = 'granted'
          this.addLog('通知权限已获取')
          new Notification('权限演示', { body: '恭喜！通知权限配置成功。' })
        } else {
          this.notifyStatus = 'denied'
          this.addLog('通知权限被拒绝')
        }
      })
    }
  }
})
</script>

<style scoped>
.permission-card {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  margin-bottom: 20px;
  color: #fff;
}

h2 {
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
  font-size: 1.2rem;
  color: #ddd;
}

.desc {
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 15px;
}

.perm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.perm-item {
  background: #383838;
  padding: 15px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.perm-header {
  margin-bottom: 10px;
}

.icon { font-size: 1.5rem; display: block; margin-bottom: 5px; }
.name { font-weight: bold; font-size: 0.9rem; }

.perm-status {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 10px;
  background: #555;
}

.perm-status.granted { background: #27ae60; color: white; }
.perm-status.denied { background: #c0392b; color: white; }
.perm-status.unknown { background: #7f8c8d; color: white; }

.action-btn {
  background-color: #3498db;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  width: 100%;
  transition: background 0.2s;
}

.action-btn:hover:not(:disabled) { background-color: #2980b9; }
.action-btn:disabled { background-color: #555; cursor: not-allowed; opacity: 0.7; }

.sub-btn {
  background-color: transparent;
  color: #aaa;
  border: 1px solid #555;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  width: 100%;
  transition: all 0.2s;
}
.sub-btn:hover { border-color: #888; color: #fff; }

.log-container {
  margin-top: 15px;
  background: #1e1e1e;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  max-height: 100px;
  overflow-y: auto;
}

.log-item {
  color: #bbb;
  border-bottom: 1px solid #333;
  padding: 2px 0;
}
</style>
