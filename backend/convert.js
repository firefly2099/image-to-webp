import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * 将jpg或png图片转换为webp格式
 * @param {string} inputPath - 输入图片路径
 * @param {string} outputPath - 输出webp图片路径（可选，默认替换扩展名）
 * @param {object} options - sharp webp转换选项
 */
async function convertToWebp(inputPath, outputPath = null, options = {}) {
  try {
    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`);
    }

    // 检查文件类型
    const ext = path.extname(inputPath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      throw new Error(`不支持的文件格式: ${ext}，仅支持jpg/jpeg/png`);
    }

    // 如果没有指定输出路径，自动生成
    if (!outputPath) {
      const dir = path.dirname(inputPath);
      const name = path.basename(inputPath, ext);
      outputPath = path.join(dir, `${name}.webp`);
    }

    // 默认webp选项
    const defaultOptions = {
      quality: 80  // 0-100，推荐80为较好的质量和大小平衡
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // 使用sharp进行转换
    await sharp(inputPath)
      .webp(mergedOptions)
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(outputPath).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(2);

    console.log(`✓ 转换成功！`);
    console.log(`  原文件: ${inputPath} (${formatSize(originalSize)})`);
    console.log(`  输出文件: ${outputPath} (${formatSize(webpSize)})`);
    console.log(`  节省空间: ${savings}%`);

    return outputPath;
  } catch (error) {
    console.error(`✗ 转换失败: ${error.message}`);
    throw error;
  }
}

/**
 * 批量转换文件夹中的所有jpg/png文件
 * @param {string} inputDir - 输入文件夹路径
 * @param {string} outputDir - 输出文件夹路径（可选，默认为输入文件夹）
 * @param {object} options - sharp webp转换选项
 */
async function convertDir(inputDir, outputDir = null, options = {}) {
  try {
    if (!fs.existsSync(inputDir)) {
      throw new Error(`输入文件夹不存在: ${inputDir}`);
    }

    outputDir = outputDir || inputDir;

    // 创建输出文件夹
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 读取文件夹中的所有文件
    const files = fs.readdirSync(inputDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('该文件夹中没有jpg/png文件');
      return;
    }

    console.log(`找到 ${imageFiles.length} 个图片文件，开始转换...\n`);

    let successCount = 0;
    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      const outputPath = path.join(outputDir, `${name}.webp`);

      try {
        await convertToWebp(inputPath, outputPath, options);
        successCount++;
      } catch (error) {
        console.error(`  跳过: ${file}`);
      }
      console.log();
    }

    console.log(`\n转换完成! 成功: ${successCount}/${imageFiles.length}`);
  } catch (error) {
    console.error(`✗ 批量转换失败: ${error.message}`);
    throw error;
  }
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// 导出函数供其他模块使用
export { convertToWebp, convertDir };

// 命令行使用示例
if (process.argv.length < 3) {
  console.log('使用方法:');
  console.log('  单个文件: node convert.js <输入文件路径> [输出文件路径] [质量 0-100]');
  console.log('  批量转换: node convert.js --dir <文件夹路径> [输出文件夹] [质量 0-100]');
  console.log('\n示例:');
  console.log('  node convert.js image.png');
  console.log('  node convert.js image.jpg output.webp 90');
  console.log('  node convert.js --dir ./images ./output 80');
  process.exit(0);
}

// 解析命令行参数
const args = process.argv.slice(2);

if (args[0] === '--dir') {
  // 批量转换
  const inputDir = args[1];
  const outputDir = args[2] || inputDir;
  const quality = parseInt(args[3]) || 80;
  convertDir(inputDir, outputDir, { quality: Math.max(0, Math.min(100, quality)) });
} else {
  // 转换单个文件
  const inputPath = args[0];
  const outputPath = args[1] || null;
  const quality = parseInt(args[2]) || 80;
  convertToWebp(inputPath, outputPath, { quality: Math.max(0, Math.min(100, quality)) });
}
