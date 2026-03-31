<template>
  <div
    class="upload-area"
    :class="{ dragover }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <div class="upload-icon">📤</div>
    <h3>点击或拖拽上传图片</h3>
    <p>支持 JPG、PNG 格式，最多50个文件，单个最大50MB</p>
    <button class="upload-button">选择图片</button>
    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
      @change="handleFileInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

/**
 * 文件输入元素的引用
 */
const fileInput = ref<HTMLInputElement | null>(null);

/**
 * 是否正在拖拽中
 */
const dragover = ref(false);

/**
 * 定义组件事件
 */
const emit = defineEmits<{
  /**
   * 文件选择事件
   * @param e 事件名称
   * @param files 文件列表
   */
  (e: 'files', files: FileList): void;
}>();

/**
 * 定义组件暴露的方法
 */
defineExpose({
  /**
   * 清空文件输入框
   */
  clearFileInput() {
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
});

/**
 * 触发文件输入框点击
 */
function triggerFileInput() {
  fileInput.value?.click();
}

/**
 * 处理文件输入
 * @param event 文件输入事件
 */
function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    emit('files', target.files);
  }
}

/**
 * 处理拖拽进入
 */
function handleDragOver() {
  dragover.value = true;
}

/**
 * 处理拖拽离开
 */
function handleDragLeave() {
  dragover.value = false;
}

/**
 * 处理文件拖放
 * @param event 拖放事件
 */
function handleDrop(event: DragEvent) {
  dragover.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    emit('files', event.dataTransfer.files);
  }
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed #667eea;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9ff;
}

.upload-area:hover {
  border-color: #764ba2;
  background: #f0f2ff;
}

.upload-area.dragover {
  border-color: #764ba2;
  background: #e8ebff;
  transform: scale(1.02);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.upload-area h3 {
  color: #333;
  margin-bottom: 8px;
  font-size: 18px;
}

.upload-area p {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.upload-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.upload-button:active {
  transform: translateY(0);
}

input[type="file"] {
  display: none;
}

@media (max-width: 600px) {
  .upload-area {
    padding: 30px 20px;
  }
}
</style>