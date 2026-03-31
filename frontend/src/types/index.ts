// 文件状态类型：待转换、转换中、成功、失败
export type FileStatus = 'pending' | 'converting' | 'success' | 'error';

/**
 * 文件信息接口
 */
export interface FileInfo {
  // 文件唯一ID
  id: string;
  // 原始文件对象
  file: File;
  // 文件名
  name: string;
  // 文件大小（字节）
  size: number;
  // 文件状态
  status: FileStatus;
  // WebP文件名
  webpName?: string;
  // WebP文件大小（字节）
  webpSize?: number;
  // 压缩比例（百分比）
  savings?: string;
  // 错误信息
  error?: string;
  // 是否已下载
  downloaded: boolean;
  // 会话ID
  sessionId?: string;
  // WebP文件下载URL
  webpUrl?: string;
  // 转换进度（0-100）
  progress?: number;
  // 进度动画间隔ID
  progressInterval?: number;
}

/**
 * 转换结果接口
 */
export interface ConversionResult {
  // 原始文件名
  original: string;
  // WebP文件名
  webp: string;
  // 原始文件大小（字节）
  originalSize: number;
  // WebP文件大小（字节）
  webpSize: number;
  // 压缩比例（百分比）
  savings: string;
  // 是否转换成功
  success: boolean;
  // 错误信息
  error?: string;
}

/**
 * API响应接口
 */
export interface ApiResponse {
  // 会话ID
  sessionId: string;
  // 转换结果数组
  results: ConversionResult[];
  // 转换质量
  quality: number;
}