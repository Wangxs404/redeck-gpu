# ReDeck FastAPI 后端

图片转 PPTX 服务，支持本地 OCR 和云端 OCR 两种模式。

## 功能特性

- 🖼️ **图片 OCR**：使用 MinerU 进行高精度文字识别
- 🤖 **AI 生成**：调用 LLM 生成标准化 HTML 幻灯片
- 📊 **PPTX 导出**：HTML 转换为可编辑的 PowerPoint 文件
- ☁️ **云端 OCR**：支持 MinerU 云端 API，适合服务器部署
- 🔧 **环境区分**：自动识别开发/生产环境，配置 CORS 和安全策略

## 两种运行模式

| 模式 | 适用场景 | OCR 方式 | 图片来源 |
|------|----------|----------|----------|
| **本地 OCR** | 本地开发、有 GPU 服务器 | 本地 MinerU | 上传到后端 |
| **云端 OCR** | Vercel 部署、无 GPU | MinerU API | R2/CDN 公开 URL |

## 快速开始

### 1. 环境配置

```bash
# 复制环境变量模板
cp env.example .env

# 编辑 .env 文件，填入必要配置
```

**.env 必填项：**

```bash
# OpenRouter API（必须）
OPENROUTER_API_KEY=your_openrouter_api_key

# MinerU 云端 API（使用云端 OCR 时必须）
MINERU_API_KEY=your_mineru_api_key
```

### 2. 启动服务

**Windows：**
```bash
.\start.bat
```

**Linux/Ubuntu：**
```bash
chmod +x start.sh
./start.sh
```

**手动启动：**
```bash
# 激活虚拟环境
source venv/bin/activate  # Linux
.\venv\Scripts\Activate.ps1  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

服务启动后访问：http://localhost:8000

## API 接口

### 核心接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/ocr/process-cloud` | POST | ⭐ **云端 OCR 一键转换**（推荐） |
| `/upload` | POST | 上传图片 |
| `/ocr/process` | POST | 本地 OCR 识别 |
| `/slides/html` | POST | 生成 HTML 幻灯片 |
| `/slides/pptx` | POST | HTML 转 PPTX |
| `/health` | GET | 健康检查 |

### 云端 OCR 接口（推荐）

**一键转换：输入图片 URL，输出 PPTX 下载链接**

```bash
POST /ocr/process-cloud
Content-Type: application/json

{
  "file_url": "https://your-r2-bucket.r2.dev/image.png",
  "model": "google/gemini-2.5-flash"
}
```

**响应：**
```json
{
  "success": true,
  "download_url": "http://localhost:8000/static/output/.../xxx.pptx",
  "file_uuid": "xxx-xxx-xxx"
}
```

**Python 示例：**
```python
import requests

response = requests.post(
    "http://localhost:8000/ocr/process-cloud",
    json={
        "file_url": "https://your-r2-bucket.r2.dev/slide.png",
        "model": "google/gemini-2.5-flash"
    }
)

data = response.json()
print(f"下载链接: {data['download_url']}")
```

### 本地 OCR 流程

```bash
# 1. 上传图片
POST /upload
# 返回: { "file_path": "input/2025-12-02/xxx.png" }

# 2. OCR 识别
POST /ocr/process
{ "file_path": "input/2025-12-02/xxx.png" }

# 3. 生成 HTML
POST /slides/html
{ "image_path": "input/2025-12-02/xxx.png", "model": "google/gemini-2.5-flash" }

# 4. 转换 PPTX
POST /slides/pptx
{ "html_file_path": "output/2025-12-02/xxx/.../xxx.html" }
```

## 目录结构

```
fastapi/
├── main.py                    # 主程序
├── system_prompt.md           # LLM 系统提示词
├── requirements.txt           # Python 依赖
├── .env                       # 环境变量配置（从模板复制）
├── env.example                # 开发环境配置模板
├── env.production             # 生产环境配置模板
├── start.bat                  # Windows 启动脚本
├── start.sh                   # Linux 启动脚本
├── redeck-fastapi.service     # Systemd 服务文件
├── input/                     # 上传图片目录
├── output/                    # 输出文件目录
├── logs/                      # 日志目录
├── scripts/                   # 转换脚本
│   ├── mineru_cloud.py        # 云端 OCR 模块
│   ├── convert-html-to-pptx.js
│   └── package.json           # Node.js 依赖
└── venv/                      # Python 虚拟环境
```

## 支持的 LLM 模型

| 模型 | 说明 |
|------|------|
| `google/gemini-2.5-flash` | 默认，速度快 |
| `google/gemini-2.5-pro` | 高质量 |
| `anthropic/claude-sonnet-4` | Claude |
| `openai/gpt-4o` | GPT-4o |

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `ENV` | ❌ | 环境标识：`development` / `production`，默认 `development` |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API 密钥 |
| `MINERU_API_KEY` | 云端 OCR | MinerU 云端 API 密钥 |
| `DEFAULT_MODEL` | ❌ | 默认 LLM 模型 |
| `HOST` | ❌ | 服务地址，默认 `0.0.0.0` |
| `PORT` | ❌ | 服务端口，默认 `8000` |
| `STATIC_BASE_URL` | ❌ | 静态资源基础 URL |
| `ALLOWED_ORIGINS` | 生产环境 | CORS 允许的来源，逗号分隔 |
| `HTTP_REFERER` | ❌ | OpenRouter 请求的 Referer 头 |

### 开发环境 vs 生产环境

| 特性 | 开发环境 | 生产环境 |
|------|----------|----------|
| API 文档 (`/docs`) | ✅ 开启 | ❌ 关闭 |
| CORS | 允许所有来源 | 仅允许配置的来源 |
| 调试日志 | 详细 | 精简 |

## 日志

- 主日志：`logs/vlm.log`（自动轮转，最大 10MB）
- HTML 生成日志：`logs/html_*.log`

## 依赖

- Python 3.10+
- MinerU（本地 OCR 模式）
- Node.js 18+（PPTX 转换）
- pptxgenjs（Node.js 包）

## 生产部署

### 服务器信息

- **IP**: 72.60.226.25
- **前端域名**: video2ppt.com

### 部署步骤

```bash
# 1. 克隆代码
cd /root/apps/video2ppt
git clone https://github.com/your-repo/redeck.git
cd redeck/fastapi

# 2. 使用生产环境配置
cp env.production .env
# 编辑 .env 填入实际的 API Keys

# 3. 创建虚拟环境并安装依赖
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. 安装 Node.js 依赖
cd scripts && npm install && cd ..

# 5. 启动服务（测试）
./start.sh

# 6. 配置 systemd 服务（生产）
sudo cp redeck-fastapi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable redeck-fastapi
sudo systemctl start redeck-fastapi

# 7. 查看状态
sudo systemctl status redeck-fastapi
```

### 生产环境配置示例

```bash
# .env (生产环境)
ENV=production
HOST=0.0.0.0
PORT=8000
STATIC_BASE_URL=http://72.60.226.25:8000
ALLOWED_ORIGINS=https://video2ppt.com,https://www.video2ppt.com
HTTP_REFERER=https://video2ppt.com
OPENROUTER_API_KEY=your_key
MINERU_API_KEY=your_key
DEFAULT_MODEL=google/gemini-2.5-flash
```

### 常用命令

```bash
# 查看服务状态
sudo systemctl status redeck-fastapi

# 重启服务
sudo systemctl restart redeck-fastapi

# 查看日志
sudo journalctl -u redeck-fastapi -f

# 健康检查
curl http://localhost:8000/health
```

## 相关文档

- [云端 OCR API 文档](../doc/CLOUD_OCR_API.md)
- [前端 SDK](../doc/redeck-sdk.ts)