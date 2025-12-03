# 图片上传应用

基于 Next.js App Router 的单页面应用，用于上传图片到 FastAPI 服务。

## 功能特性

- 📤 单张图片上传
- 🖼️ 图片预览功能
- 📁 规范的图片存储结构（按日期/UUID 组织）
- ✅ 文件类型和大小验证
- 🎨 现代化的 UI 设计

## 图片存储结构

上传的图片会按照以下规范存储在 `fastapi/input` 目录下：

```
fastapi/input/
  └── YYYY-MM-DD/          # 按日期组织
      └── UUID.扩展名       # 使用 UUID 作为文件名
```

例如：
```
fastapi/input/
  └── 2024-11-18/
      └── 550e8400-e29b-41d4-a716-446655440000.jpg
```

## 安装依赖

```bash
cd nextjs
npm install
```

## 开发

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

## 构建

```bash
npm run build
npm start
```

## 使用说明

1. 打开应用首页
2. 点击上传区域或拖拽图片文件
3. 选择图片后可以预览
4. 点击"上传图片"按钮上传
5. 上传成功后显示保存路径

## 技术栈

- **Next.js 14** - React 框架（App Router）
- **TypeScript** - 类型安全
- **CSS Modules** - 样式管理

## API 接口

### POST /api/upload

上传图片文件。

**请求:**
- Content-Type: `multipart/form-data`
- Body: `file` (File)

**响应:**
```json
{
  "success": true,
  "message": "文件上传成功",
  "filePath": "input/2024-11-18/550e8400-e29b-41d4-a716-446655440000.jpg",
  "fileName": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "originalName": "example.jpg",
  "size": 123456,
  "type": "image/jpeg",
  "uploadDate": "2024-11-18"
}
```

## 文件限制

- **支持格式**: JPG, PNG, GIF, WEBP
- **最大大小**: 10MB


# 模型测试结果
只有Gemini可用，claude其次，bert-nebulon-arpha也可用且免费
优选
google/gemini-2.5-flash
1.05M context
$0.30/M input tokens
$2.50/M output tokens


google/gemini-2.5-pro
1.05M context
$1.25/M input tokens
$10/M output tokens

google/gemini-3-pro-preview
1.05M context
$2/M input tokens
$12/M output tokens

openrouter/bert-nebulon-alpha
256,000 context
$0/M input tokens
$0/M output tokens