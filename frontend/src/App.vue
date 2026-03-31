<template>
  <div class="container">
    <div class="header">
      <h1>🖼️ 图片转WebP</h1>
      <p>将JPG/PNG图片转换为更小的WebP格式</p>
    </div>

    <div class="content">
      <!-- 上传区域 -->
      <ImageUploader @files="handleFiles" ref="fileInputRef" />

      <!-- 设置区域 -->
      <div class="settings">
        <div class="setting-group">
          <label for="quality">转换质量 (0-100)</label>
          <div class="quality-input">
            <input 
              type="range" 
              id="quality" 
              min="0" 
              max="100" 
              v-model.number="quality"
            />
            <span class="quality-value">{{ quality }}</span>
          </div>
        </div>
        <div class="setting-group">
          <div class="quality-guide">
            <div>50-60: 高压缩</div>
            <div>70-80: 推荐 ⭐</div>
            <div>85-100: 高质量</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="files.length > 0">
        <button 
          class="convert-all-btn" 
          @click="convertAll"
          :disabled="!canConvert"
        >
          <span v-if="isConverting" class="loading"></span>
          {{ isConverting ? '转换中...' : '开始转换' }}
        </button>
        <button class="clear-btn" @click="clearFiles">
          清空列表
        </button>
      </div>

      <!-- 统计信息 -->
      <div class="stats" v-if="successCount > 0">
        <div class="stat-card">
          <div class="stat-value">{{ totalFiles }}</div>
          <div class="stat-label">总文件数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ successCount }}</div>
          <div class="stat-label">转换成功</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ savedSpace }}</div>
          <div class="stat-label">平均压缩率</div>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list" v-if="files.length >= 0">
        <h3>📁 文件列表</h3>
        <div v-if="files.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M12 3.75a.75.75 0 01.75.75v16.5a.75.75 0 01-1.5 0V4.5a.75.75 0 01.75-.75zM3.75 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
          </svg>
          <p>暂无文件</p>
        </div>
        <div v-else class="file-items">
          <div 
            v-for="file in files" 
            :key="file.id" 
            class="file-item"
          >
            <div class="file-info">
              <div class="file-name">📷 {{ file.name }}</div>
              <div class="file-size">{{ formatSize(file.size) }}</div>
            </div>
            <div class="file-status">
              <div 
                v-if="file.status !== 'success' && file.status !== 'converting'" 
                class="status-badge" 
                :class="getStatusClass(file.status)"
              >
                {{ getStatusText(file.status) }}
              </div>
              <div v-else-if="file.status === 'converting'" class="progress-bar">
                <div class="progress-fill" :style="{ width: (file.progress || 0) + '%' }"></div>
              </div>
              <div v-else class="success-indicator">
                <div class="success-icon">✓</div>
                <div class="success-text">
                  <div>转换完成</div>
                  <div class="savings">
                    节省: <strong>{{ file.savings }}%</strong> ({{ formatSize(file.size - (file.webpSize || 0)) }})
                  </div>
                </div>
              </div>
              <div v-if="file.error" class="error-message">
                {{ file.error }}
              </div>
            </div>
            <div class="file-actions">
              <button 
                v-if="file.status === 'success'" 
                class="download-btn" 
                :class="{ downloaded: file.downloaded }"
                @click="downloadFile(file)"
              >
                {{ file.downloaded ? '重新下载' : '下载' }}
              </button>
              <button class="remove-btn" @click="removeFile(file.id)">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 打包下载区域 -->
      <div class="download-all-section" v-if="canDownloadAll">
        <h3>✅ 所有文件已转换完成！</h3>
        <button class="download-all-btn" @click="downloadAll" :disabled="isDownloading">
          {{ isDownloading ? '⏳ 打包中...' : '📦 打包下载所有文件' }}
        </button>
        <p class="download-hint">
          或在下方选择单个文件下载
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useImageConverter } from './composables/useImageConverter';
import ImageUploader from './components/ImageUploader.vue';

/**
 * ImageUploader组件的引用
 */
const fileInputRef = ref<InstanceType<typeof ImageUploader> | null>(null);

const {
  files,
  quality,
  isConverting,
  isDownloading,
  totalFiles,
  successCount,
  savedSpace,
  canConvert,
  canDownloadAll,
  handleFiles,
  removeFile: originalRemoveFile,
  clearFiles: originalClearFiles,
  convertAll,
  downloadFile,
  downloadAll,
  formatSize,
  getStatusClass,
  getStatusText
} = useImageConverter();

/**
 * 清空所有文件，同时清空文件输入框
 */
function clearFiles() {
  originalClearFiles();
  // 清空ImageUploader组件中的文件输入框
  fileInputRef.value?.clearFileInput();
}

/**
 * 删除指定文件
 * @param fileId 文件ID
 */
function removeFile(fileId: string) {
  originalRemoveFile(fileId);
  if(files.value.length === 0) {
    fileInputRef.value?.clearFileInput();
  }
}
</script>

<style scoped>
.container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  overflow: hidden;
  margin: 20px auto;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.header p {
  opacity: 0.9;
  font-size: 14px;
}

.content {
  padding: 40px 30px;
}

.settings {
  margin-top: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: end;
}

.setting-group {
  display: flex;
  flex-direction: column;
}

.setting-group label {
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.quality-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: none;
}

.quality-value {
  min-width: 50px;
  text-align: right;
  color: #667eea;
  font-weight: 600;
}

.quality-guide {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
  margin-bottom: 10px;
}

.convert-all-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.convert-all-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.convert-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  background: #f0f0f0;
  color: #666;
  border: none;
  padding: 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.clear-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-list {
  margin-top: 30px;
}

.file-list h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 16px;
}

.file-item {
  background: #f8f9ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 6px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.file-item:hover {
  background: #f0f2ff;
}

.file-info {
  width: 40%;
}

.file-name {
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.file-status {
  text-align: left;
  flex: 1;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-converting {
  background: #d1ecf1;
  color: #0c5460;
}

.status-success {
  background: #d4edda;
  color: #155724;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.file-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  min-width: 120px;
}

.download-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background: #764ba2;
}

.download-btn.downloaded {
  background: #28a745;
  color: #fff;
}

.download-btn.downloaded:hover {
  background: #218838;
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn {
  background: #ccc;
  color: #666;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #bbb;
}

.progress-bar {
  position: relative;
  width: 100px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  width: 0%;
  transition: width 0.3s ease;
}

.success-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  flex-wrap: wrap;
}

.success-icon {
  width: 16px;
  height: 16px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.success-text {
  color: #28a745;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.savings {
  color: #666;
  font-size: 12px;
}

.error-message {
  color: #721c24;
  font-size: 12px;
  margin-bottom: 6px;
}

.download-all-section {
  margin-top: 25px;
  padding: 10px 20px;
  background: #f8f9ff;
  border-radius: 6px;
}

.download-all-section h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 16px;
}

.download-all-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
}

.download-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3);
}

.download-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.download-hint {
  margin-top: 15px;
  font-size: 12px;
  color: #999;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #999;
}

.empty-state svg {
  width: 60px;
  height: 60px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
}

.loading::after {
  content: " ";
  display: block;
  width: 16px;
  height: 16px;
  margin: 2px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-color: currentColor transparent currentColor transparent;
  animation: spinner 1.2s linear infinite;
}

@keyframes spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .header {
    padding: 30px 20px;
  }

  .header h1 {
    font-size: 24px;
  }

  .content {
    padding: 20px;
  }

  .settings {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }

  .file-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .file-status {
    text-align: center;
    width: 100%;
  }

  .file-actions {
    margin-top: 10px;
    width: 100%;
    justify-content: flex-start;
  }

  .progress-bar {
    width: 100%;
    margin: 10px 0;
  }
}
</style>