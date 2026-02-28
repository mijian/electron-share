<template>
  <div class="update-card">
    <h2>4. 自动更新演示 (Auto Update)</h2>
    <p class="desc">
      基于 electron-updater 实现。模拟检查更新流程。
    </p>

    <div class="update-status">
      <div class="status-indicator" :class="statusClass"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <div class="controls">
      <button 
        @click="checkForUpdate" 
        :disabled="isChecking"
        class="action-btn"
      >
        {{ isChecking ? '检查中...' : '检查更新' }}
      </button>
    </div>
    
    <div v-if="logs.length" class="log-container">
      <div v-for="(log, idx) in logs" :key="idx" class="log-item">{{ log }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'UpdateDemo',
  data() {
    return {
      isChecking: false,
      statusText: '等待检查...',
      logs: [] as string[]
    }
  },
  computed: {
    statusClass(): string {
      if (this.isChecking) return 'checking'
      if (this.statusText.includes('发现新版本')) return 'available'
      if (this.statusText.includes('最新')) return 'latest'
      if (this.statusText.includes('错误')) return 'error'
      return 'idle'
    }
  },
  mounted() {
    // 监听主进程发来的更新状态
    window.electronAPI.onUpdateStatus((message: string) => {
      this.addLog(message)
      
      if (message.includes('检查更新')) {
        this.statusText = '正在检查...'
        this.isChecking = true
      } else if (message.includes('发现新版本')) {
        this.statusText = '发现新版本!'
        this.isChecking = false
      } else if (message.includes('最新') || message.includes('Mock')) {
        this.statusText = '当前已是最新版本'
        this.isChecking = false
      } else if (message.includes('Error') || message.includes('失败')) {
        this.statusText = '检查失败'
        this.isChecking = false
      }
    })
  },
  methods: {
    checkForUpdate() {
      this.logs = []
      this.addLog('正在发起更新检查...')
      window.electronAPI.checkUpdate()
    },
    addLog(msg: string) {
      const time = new Date().toLocaleTimeString()
      this.logs.unshift(`[${time}] ${msg}`)
      if (this.logs.length > 5) this.logs.pop()
    }
  }
})
</script>

<style scoped>
.update-card {
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

.update-status {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  background: #333;
  padding: 10px;
  border-radius: 4px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
  background: #7f8c8d;
  transition: background 0.3s;
}

.status-indicator.idle { background: #7f8c8d; }
.status-indicator.checking { background: #f1c40f; box-shadow: 0 0 5px #f1c40f; }
.status-indicator.available { background: #e67e22; box-shadow: 0 0 5px #e67e22; }
.status-indicator.latest { background: #27ae60; }
.status-indicator.error { background: #c0392b; }

.status-text { font-size: 0.9rem; font-weight: bold; }

.action-btn {
  background-color: #3498db;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.action-btn:hover:not(:disabled) { background-color: #2980b9; }
.action-btn:disabled { background-color: #555; cursor: not-allowed; opacity: 0.7; }

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
