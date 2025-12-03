# ReDeck - 图片转 PowerPoint 演示文稿工具

利用大模型的能力，将图片（幻灯片截图）转换为可编辑的 PowerPoint 演示文稿。通过 OCR 识别、LLM 生成标准化 HTML，最终转换为 PPTX 格式，实现高精度还原，无需复杂的工程化建设。

## ✨ 功能特性

- 📸 **图片上传** - 支持 JPG、PNG 等常见图片格式
- 🔍 **OCR 识别** - 使用 MinerU 进行高精度 OCR，提取文本和布局信息
- 🤖 **AI 生成** - 通过 OpenRouter API 调用多种 LLM（GPT-4o、Claude、Gemini）生成标准化 HTML
- 📊 **HTML 预览** - 实时预览生成的 HTML，支持代码查看和渲染效果对比
- 📄 **PPTX 转换** - 将标准化 HTML 转换为可编辑的 PowerPoint 文件
- 🎨 **可视化工作流** - 导航式多步骤工作流，从上传到下载全程可视化

## 🛠️ 技术栈

### 后端
- **FastAPI** - Python 异步 Web 框架
- **MinerU** - 高精度 OCR 工具，提取文档布局和文本
- **OpenRouter API** - 统一的 LLM API 接口，支持多种模型
- **Playwright** - 无头浏览器，用于 HTML 渲染和样式提取
- **PptxGenJS** - JavaScript 库，用于生成 PowerPoint 文件

### 前端
- **Next.js 14** - React 框架（App Router）
- **TypeScript** - 类型安全
- **React** - UI 框架

## 📁 项目结构

```
redeck/
├── fastapi/                 # 后端服务
│   ├── main.py             # FastAPI 主应用
│   ├── system_prompt.md    # LLM 系统提示词（HTML 规范）
│   ├── scripts/            # Node.js 转换脚本
│   │   ├── html2pptx.js   # HTML 转 PPTX 核心逻辑
│   │   └── convert-html-to-pptx.js  # 转换 CLI 工具
│   ├── input/              # 图片输入目录（按日期/UUID 组织）
│   ├── output/             # OCR 和 PPTX 输出目录
│   ├── logs/               # 日志文件
│   ├── venv/               # Python 虚拟环境
│   ├── start.bat           # Windows 启动脚本
│   └── env.example         # 环境变量示例
│
├── nextjs/                 # 前端应用
│   ├── app/                # Next.js App Router
│   │   ├── workflow/       # 工作流页面
│   │   ├── dom-editor/     # DOM 编辑器
│   │   └── api/            # API 代理路由
│   ├── components/         # React 组件
│   └── package.json        # Node.js 依赖
│
├── document/               # 项目文档
│   └── pptx/              # PPTX 工具集文档
│       ├── html2pptx.md   # HTML 规范说明
│       └── SKILL.md       # PPTX 工具集使用指南
│
└── README.md               # 项目说明文档
```

## 🚀 快速开始

### 前置要求

- **Python 3.11+** - 后端运行环境
- **Node.js 18+** - 前端和转换脚本运行环境
- **OpenRouter API Key** - 用于调用 LLM（[注册地址](https://openrouter.ai/)）

### 1. 克隆项目

```bash
git clone <repository-url>
cd redeck
```

### 2. 后端设置

#### 2.1 创建 Python 虚拟环境

```bash
cd fastapi
python -m venv venv
```

#### 2.2 激活虚拟环境

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

#### 2.3 安装 Python 依赖

```bash
# 升级 pip
pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple

# 安装 uv（快速包管理器）
pip install uv -i https://mirrors.aliyun.com/pypi/simple

# 安装 MinerU（OCR 工具）
uv pip install -U "mineru[core]" -i https://mirrors.aliyun.com/pypi/simple

# 安装其他依赖
pip install fastapi uvicorn python-multipart python-dotenv httpx
```

#### 2.4 配置环境变量

复制 `env.example` 为 `.env` 并填写配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：

```env
# OpenRouter API 配置
OPENROUTER_API_KEY=your_api_key_here

# 模型 Provider（推荐：openai/gpt-4o）
PROVIDER=openai/gpt-4o

# 服务器配置
HOST=0.0.0.0
PORT=8000
```

#### 2.5 安装 Node.js 依赖（转换脚本）

```bash
cd scripts
npm install
cd ..
```

#### 2.6 启动后端服务

**方式一：使用启动脚本（Windows）**
```bash
.\start.bat
```

**方式二：手动启动**
```bash
python main.py
```

后端服务将在 `http://localhost:8000` 启动。

### 3. 前端设置

#### 3.1 安装依赖

```bash
cd nextjs
npm install
# 或使用 pnpm
pnpm install
```

#### 3.2 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

前端应用将在 `http://localhost:3000` 启动。

## 📖 使用指南

### 工作流页面

访问 `http://localhost:3000/workflow` 进入导航式工作流：

1. **上传图片** - 选择或拖拽图片文件
2. **OCR 识别** - 自动调用 MinerU 进行 OCR，提取文本和布局
3. **配置模型** - 选择 LLM 模型（GPT-4o、Claude、Gemini 等）
4. **显示 Prompt** - 预览发送给 LLM 的完整提示词
5. **生成 HTML** - 调用 LLM 生成标准化 HTML，支持代码和渲染预览
6. **转换 PPTX** - 将 HTML 转换为 PowerPoint 文件并下载

### API 接口

#### 健康检查
```http
GET /health
```

#### 上传图片
```http
POST /upload
Content-Type: multipart/form-data

file: <图片文件>
```

#### OCR 识别
```http
POST /ocr
Content-Type: multipart/form-data

file: <图片文件>
```

#### 生成 HTML
```http
POST /slides/html
Content-Type: application/json

{
  "file_path": "input/2025-11-26/xxx.png",
  "provider": "openai/gpt-4o"
}
```

#### 转换 PPTX
```http
POST /slides/pptx
Content-Type: application/json

{
  "html_file_path": "output/2025-11-26/xxx/xxx.html"
}
```

#### 预览 Prompt
```http
POST /slides/preview-prompt
Content-Type: application/json

{
  "file_path": "input/2025-11-26/xxx.png"
}
```

## 🎯 HTML 规范

生成的 HTML 必须遵循特定规范以确保准确转换为 PPTX。详细规范请参考：

- [`document/pptx/html2pptx.md`](document/pptx/html2pptx.md) - HTML 规范详细说明
- [`fastapi/system_prompt.md`](fastapi/system_prompt.md) - LLM 系统提示词

### 关键规则

1. **尺寸要求**：`body` 必须设置 `width: 720pt; height: 405pt`（16:9）
2. **文本标签**：所有文本必须在 `<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>` 标签内
3. **字体限制**：仅使用 Web 安全字体（Arial、Times New Roman 等）
4. **样式限制**：背景、边框、阴影仅适用于 `<div>` 元素
5. **禁止渐变**：不支持 CSS 渐变，需使用 PNG 图片

## 🔧 开发指南

### 后端开发

```bash
cd fastapi
.\venv\Scripts\Activate.ps1
python main.py
```

### 前端开发

```bash
cd nextjs
npm run dev
```

### 调试

- 后端日志：`fastapi/logs/`
- 前端控制台：浏览器开发者工具
- HTML 生成日志：`fastapi/logs/html_*.log`

## ⚠️ 常见问题

### MinerU 未找到

确保已正确安装 MinerU：
```bash
uv pip install -U "mineru[core]" -i https://mirrors.aliyun.com/pypi/simple
```

### PPTX 转换超时

- 检查图片路径是否正确
- 确保 Playwright 已正确安装：`cd fastapi/scripts && npm install`
- 查看后端日志了解详细错误信息

### 图片在前端不显示

- 确保后端服务正在运行
- 检查图片 URL 是否正确
- 查看浏览器控制台的 CORS 错误

### 编码错误（Windows）

已修复 Windows 下的 UTF-8 编码问题，如仍遇到：
- 确保使用最新版本的 `main.py`
- 检查系统区域设置

## 📝 推荐模型

根据测试结果，以下模型表现最佳：

- **openai/gpt-4o** ✅ 首选（最大 16K tokens 输出）
- **anthropic/claude-3.5-sonnet** ✅ 推荐（最大 8K tokens 输出）
- **google/gemini-pro-1.5** - 备选（最大 8K tokens 输出）

⚠️ 注意：确保选择的模型支持长输出（> 8K tokens），否则生成的 HTML 可能被截断。

## 📄 许可证

本项目遵循相应的开源许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📚 相关文档

- [MinerU 官方文档](https://github.com/opendatalab/MinerU)
- [OpenRouter API 文档](https://openrouter.ai/docs)
- [PptxGenJS 文档](https://gitbrent.github.io/PptxGenJS/)
- [Next.js 文档](https://nextjs.org/docs)
