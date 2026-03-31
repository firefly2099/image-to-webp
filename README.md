# Image to WebP Converter

一个基于 Vue 3 + TypeScript + Vite + Node.js 的图片转 WebP 工具，支持批量上传、转换和下载。

## 功能特性

- 批量图片上传（支持拖拽和点击上传）
- 支持 JPG、PNG 格式转换
- 可调整转换质量（0-100）
- 实时显示转换进度
- 批量打包下载
- 单个文件下载
- 文件大小压缩比例显示
- 24小时自动清理临时文件

## 技术栈

### 前端
- Vue 3
- TypeScript
- Vite
- Composition API

### 后端
- Node.js
- Express
- Multer（文件上传）
- Sharp（图像处理）
- Archiver（文件打包）

## 项目结构

```
image-to-webp-v2/
├── frontend/          # 前端项目
│   ├── src/           # 源代码
│   │   ├── components/   # 组件
│   │   ├── composables/  # 组合式函数
│   │   ├── types/        # TypeScript 类型定义
│   │   └── App.vue       # 主组件
│   ├── dist/          # 构建产物
│   └── package.json
├── backend/           # 后端项目
│   ├── server.js      # 服务器代码
│   ├── temp/          # 临时文件目录
│   └── package.json
└── README.md
```

## 安装与运行

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/image-to-webp-v2.git
cd image-to-webp-v2
```

### 2. 安装后端依赖

```bash
cd backend
npm install
```

### 3. 安装前端依赖

```bash
cd ../frontend
npm install
```

### 4. 构建前端

```bash
npm run build
```

### 5. 启动服务器

```bash
cd ../backend
npm start
```

服务器将在 http://localhost:3000 运行

## 开发模式

### 前端开发服务器

```bash
cd frontend
npm run dev
```

前端开发服务器将在 http://localhost:5173 运行

### 后端开发服务器

```bash
cd backend
npm start
```

## 使用说明

1. 打开浏览器访问 http://localhost:3000
2. 点击上传区域或拖拽图片到上传区域
3. 调整转换质量（可选，默认80）
4. 点击"开始转换"按钮
5. 等待转换完成
6. 下载单个文件或打包下载所有文件

## API 接口

### 上传并转换图片
```
POST /api/convert
Content-Type: multipart/form-data

参数：
- images: 图片文件数组
- quality: 转换质量（0-100，默认80）
```

### 下载单个文件
```
GET /api/download/:sessionId/:filename
```

### 打包下载所有文件
```
POST /api/download-all
Content-Type: application/json

参数：
- filesBySession: 按会话ID分组的文件列表
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3000 |

## 文件清理策略

- 上传文件：转换成功后立即删除
- 转换后文件：24小时后自动清理
- 清理频率：每小时检查一次

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request

## 作者

firefly

---

Made with ❤️ using Vue 3 + Node.js
