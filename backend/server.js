/**
 * 图片转WebP后端服务器
 * 提供图片上传、转换、下载等API接口
 */
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

/**
 * 当前文件的绝对路径
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * 当前文件所在目录的绝对路径
 */
const __dirname = path.dirname(__filename);

/**
 * Express应用实例
 */
const app = express();

/**
 * 服务器端口，默认3000
 */
const PORT = process.env.PORT || 3000;

// 创建临时文件夹
/**
 * 临时文件夹路径
 */
const tempDir = path.join(__dirname, 'temp');

/**
 * 上传文件目录路径
 */
const uploadsDir = path.join(tempDir, 'uploads');

/**
 * 转换后文件目录路径
 */
const convertDir = path.join(tempDir, 'converted');

// 确保目录存在
[tempDir, uploadsDir, convertDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置multer
/**
 * multer存储配置
 */
const storage = multer.diskStorage({
  /**
   * 设置文件存储目录
   * @param {Object} req 请求对象
   * @param {Object} file 文件对象
   * @param {Function} cb 回调函数
   */
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  /**
   * 设置文件名
   * @param {Object} req 请求对象
   * @param {Object} file 文件对象
   * @param {Function} cb 回调函数
   */
  filename: (req, file, cb) => {
    // 生成唯一的文件名
    const uniqueSuffix = Date.now() + '-' + randomBytes(6).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * multer上传实例
 */
const upload = multer({
  storage: storage,
  /**
   * 文件过滤器
   * @param {Object} req 请求对象
   * @param {Object} file 文件对象
   * @param {Function} cb 回调函数
   */
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持JPG和PNG格式'));
    }
  },
  /**
   * 文件大小限制
   */
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.json());

/**
 * 上传并转换图片API
 * @route POST /api/convert
 * @param {Array} images 上传的图片文件
 * @param {number} quality 转换质量（0-100）
 * @returns {Object} 转换结果
 */
app.post('/api/convert', upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const quality = Math.max(0, Math.min(100, parseInt(req.body.quality) || 80));
    const sessionId = randomBytes(8).toString('hex');
    const sessionDir = path.join(convertDir, sessionId);

    // 创建会话目录
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const results = [];

    // 逐个转换文件
    for (const file of req.files) {
      try {
        const webpName = path.basename(file.filename, path.extname(file.filename)) + '.webp';
        const outputPath = path.join(sessionDir, webpName);

        // 获取原文件大小
        const originalSize = file.size;

        // 使用sharp进行转换
        await sharp(file.path)
          .webp({ quality })
          .toFile(outputPath);

        // 获取转换后文件大小
        const webpSize = fs.statSync(outputPath).size;
        const savings = ((1 - webpSize / originalSize) * 100).toFixed(2);

        results.push({
          original: file.originalname,
          webp: webpName,
          originalSize: originalSize,
          webpSize: webpSize,
          savings: savings,
          success: true
        });

        console.log(`[convert] 转换完成，文件路径: ${file.path}`);

        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`[convert] 删除文件成功，文件路径: ${file.path}`);
          }
        } catch (error) {
          console.error(`[convert] 删除文件失败: ${file.path}`, error.message);
        }

      } catch (error) {
        results.push({
          original: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      sessionId: sessionId,
      results: results,
      quality: quality
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 下载单个文件API
 * @route GET /api/download/:sessionId/:filename
 * @param {string} sessionId 会话ID
 * @param {string} filename 文件名
 * @returns {File} 下载的文件
 */
app.get('/api/download/:sessionId/:filename', (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(convertDir, sessionId, filename);

    // 安全检查：防止路径穿越
    if (!filePath.startsWith(path.join(convertDir, sessionId))) {
      return res.status(403).json({ error: '访问被拒绝' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 设置正确的响应头
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // 使用流式传输
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('文件流错误:', error);
      res.status(500).json({ error: '文件读取失败' });
    });
  } catch (error) {
    console.error('下载错误:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 打包下载所有转换后的文件API
 * @route POST /api/download-all
 * @param {Object} filesBySession 按会话ID分组的文件列表
 * @returns {File} 压缩包文件
 */
app.post('/api/download-all', (req, res) => {
  try {
    const { filesBySession } = req.body;

    if (!filesBySession || typeof filesBySession !== 'object') {
      return res.status(400).json({ error: '无效的文件列表' });
    }

    let hasFiles = false;

    // 检查是否有任何有效的文件
    for (const sessionId in filesBySession) {
      if (Array.isArray(filesBySession[sessionId]) && filesBySession[sessionId].length > 0) {
        hasFiles = true;
        break;
      }
    }

    if (!hasFiles) {
      return res.status(400).json({ error: '会话不存在或无可用文件' });
    }

    // 设置响应头
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="images.zip"');

    // 创建zip存档
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });

    archive.pipe(res);

    // 添加指定的文件
    for (const sessionId in filesBySession) {
      const sessionDir = path.join(convertDir, sessionId);
      if (fs.existsSync(sessionDir)) {
        const files = filesBySession[sessionId];
        if (Array.isArray(files)) {
          files.forEach(file => {
            const filePath = path.join(sessionDir, file);
            if (fs.existsSync(filePath)) {
              archive.file(filePath, { name: file });
            }
          });
        }
      }
    }

    archive.finalize();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 清理过期会话（24小时后删除）
 */
function cleanupOldSessions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24小时

  fs.readdirSync(convertDir).forEach(sessionId => {
    const sessionPath = path.join(convertDir, sessionId);
    const stat = fs.statSync(sessionPath);

    if (now - stat.mtimeMs > maxAge) {
      fs.rmSync(sessionPath, { recursive: true });
    }
  });
}

// 每小时清理一次过期会话
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 临时文件夹: ${tempDir}\n`);
});
