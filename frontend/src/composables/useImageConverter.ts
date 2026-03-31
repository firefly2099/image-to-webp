/**
 * 图片转换工具组合式函数
 * 提供图片上传、转换、下载等核心功能
 */
import { ref, computed } from 'vue';
import type { FileInfo, ApiResponse, FileStatus } from '../types';

/**
 * 图片转换工具组合式函数
 * @returns 图片转换相关的状态和方法
 */
export function useImageConverter() {

  /**
   * 文件列表，存储所有上传的文件信息
   */
  const files = ref<FileInfo[]>([]);
  
  /**
   * 当前会话ID，用于标识一组转换操作
   */
  const sessionId = ref<string | null>(null);
  
  /**
   * 转换质量，范围0-100
   */
  const quality = ref<number>(80);
  
  /**
   * 是否正在转换中
   */
  const isConverting = ref<boolean>(false);
  
  /**
   * 是否正在下载中
   */
  const isDownloading = ref<boolean>(false);

  /**
   * 总文件数
   */
  const totalFiles = computed(() => files.value.length);
  
  /**
   * 成功转换的文件数
   */
  const successCount = computed(() => files.value.filter(f => f.status === 'success').length);
  
  /**
   * 平均节省空间百分比
   */
  const savedSpace = computed(() => {
    const successFiles = files.value.filter(f => f.status === 'success');
    if (successFiles.length === 0) return '0%';
    const totalSavings = successFiles.reduce((sum, f) => sum + parseFloat(f.savings || '0'), 0);
    return (totalSavings / successFiles.length).toFixed(1) + '%';
  });

  /**
   * 是否有待转换的文件
   */
  const hasPendingFiles = computed(() => files.value.some(f => f.status === 'pending'));
  
  /**
   * 是否可以开始转换
   */
  const canConvert = computed(() => hasPendingFiles.value && !isConverting.value);
  
  /**
   * 是否可以打包下载所有文件
   */
  const canDownloadAll = computed(() => {
    const successFiles = files.value.filter(f => f.status === 'success');
    return successFiles.length > 1 && !isConverting.value;
  });

  /**
   * 处理文件上传
   * @param fileList 上传的文件列表
   */
  function handleFiles(fileList: FileList) {
    if (fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert(`不支持的格式: ${file.name}`);
        continue;
      }

      files.value.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
        downloaded: false
      });
    }
  }

  /**
   * 移除文件
   * @param id 文件ID
   */
  function removeFile(id: string) {
    const index = files.value.findIndex(f => f.id === id);
    if (index !== -1) {
      files.value.splice(index, 1);
    }
  }

  /**
   * 清空所有文件
   */
  function clearFiles() {
    if (confirm('确定要清空所有文件吗？')) {
      files.value = [];
      sessionId.value = null;
    }
  }

  /**
   * 启动进度条动画
   * @param indices 需要启动动画的文件索引数组
   */
  function startProgressAnimation(indices: number[]) {
    indices.forEach(index => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90; // 不要超过90%，留给完成
        files.value[index].progress = progress;
      }, 200);

      // 存储interval ID以便清理
      files.value[index].progressInterval = interval;
    });
  }

  /**
   * 停止进度条动画
   * @param index 文件索引
   */
  function stopProgressAnimation(index: number) {
    const file = files.value[index];
    if (file && file.progressInterval) {
      clearInterval(file.progressInterval);
      files.value[index].progress = 100;
      delete files.value[index].progressInterval;
    }
  }

  /**
   * 转换所有待转换的文件
   */
  async function convertAll() {
    const pendingFiles = files.value.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      alert('没有待转换的文件');
      return;
    }

    isConverting.value = true;
    
    // 记录待转换文件的索引
    const pendingIndices: number[] = [];
    for (let i = 0; i < files.value.length; i++) {
      if (files.value[i].status === 'pending') {
        pendingIndices.push(i);
        files.value[i].status = 'converting';
        files.value[i].progress = 0;
      }
    }

    // 启动进度条动画
    startProgressAnimation(pendingIndices);

    const formData = new FormData();
    pendingFiles.forEach(f => formData.append('images', f.file));
    formData.append('quality', quality.value.toString());

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('转换失败: ' + response.statusText);
      }

      const data: ApiResponse = await response.json();
      sessionId.value = data.sessionId;

      if (data.results && Array.isArray(data.results)) {
        let pendingIndex = 0;
        for (let i = 0; i < files.value.length; i++) {
          if (files.value[i].status === 'converting') {
            // 停止进度条动画
            stopProgressAnimation(i);
            
            const result = data.results[pendingIndex];
            if (result) {
              if (result.success) {
                files.value[i].status = 'success';
                files.value[i].webpName = result.webp;
                files.value[i].webpSize = result.webpSize;
                files.value[i].savings = result.savings;
                files.value[i].sessionId = sessionId.value;
                files.value[i].webpUrl = `/api/download/${sessionId.value}/${encodeURIComponent(result.webp)}`;
              } else {
                files.value[i].status = 'error';
                files.value[i].error = result.error;
              }
              pendingIndex++;
            }
          }
        }
      }
    } catch (error) {
      console.error('转换出错:', error);
      alert('转换出错: ' + (error as Error).message);
      
      // 停止所有进度条动画
      pendingIndices.forEach(index => {
        stopProgressAnimation(index);
        files.value[index].status = 'pending';
      });
    } finally {
      isConverting.value = false;
    }
  }

  /**
   * 下载单个文件
   * @param file 文件信息对象
   */
  async function downloadFile(file: FileInfo) {
    if (file.status !== 'success' || !sessionId.value || !file.webpUrl) {
      console.error('下载失败：文件状态不正确');
      return;
    }

    try {
      const response = await fetch(file.webpUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = file.webpName || 'image.webp';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      file.downloaded = true;
    } catch (error) {
      console.error('下载失败:', error);
      alert(`下载失败: ${(error as Error).message}`);
    }
  }

  /**
   * 打包下载所有成功转换的文件
   */
  async function downloadAll() {
    const successFiles = files.value.filter(f => f.status === 'success');
    if (successFiles.length === 0) return;

    // 按会话ID分组文件
    const filesBySession: Record<string, string[]> = {};
    successFiles.forEach(f => {
      if (f.sessionId && f.webpName) {
        if (!filesBySession[f.sessionId]) {
          filesBySession[f.sessionId] = [];
        }
        filesBySession[f.sessionId].push(f.webpName);
      }
    });

    // 检查是否有可用文件
    const hasFiles = Object.keys(filesBySession).length > 0;
    if (!hasFiles) {
      alert('会话不存在或无可用文件，请先转换后再打包下载。');
      return;
    }

    try {
      isDownloading.value = true;
      const response = await fetch('/api/download-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filesBySession })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || '下载失败');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      alert('下载出错: ' + (error as Error).message);
    } finally {
      isDownloading.value = false;
    }
  }

  /**
   * 格式化文件大小
   * @param bytes 文件大小（字节）
   * @returns 格式化后的文件大小字符串
   */
  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  /**
   * 获取状态对应的CSS类名
   * @param status 文件状态
   * @returns CSS类名
   */
  function getStatusClass(status: FileStatus): string {
    const classes = {
      'pending': 'status-pending',
      'converting': 'status-converting',
      'success': 'status-success',
      'error': 'status-error'
    };
    return classes[status] || '';
  }

  /**
   * 获取状态对应的显示文本
   * @param status 文件状态
   * @returns 显示文本
   */
  function getStatusText(status: FileStatus): string {
    const texts = {
      'pending': '⏳ 待转换',
      'converting': '⏳ 转换中',
      'success': '✅ 成功',
      'error': '❌ 失败'
    };
    return texts[status] || '';
  }

  /**
   * 生成唯一ID
   * @returns 唯一ID字符串
   */
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * 返回图片转换相关的状态和方法
   */
  return {
    files,
    sessionId,
    quality,
    isConverting,
    isDownloading,
    totalFiles,
    successCount,
    savedSpace,
    hasPendingFiles,
    canConvert,
    canDownloadAll,
    handleFiles,
    removeFile,
    clearFiles,
    convertAll,
    downloadFile,
    downloadAll,
    formatSize,
    getStatusClass,
    getStatusText
  };
}