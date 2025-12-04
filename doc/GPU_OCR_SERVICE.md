# ReDeck GPU OCR 服务

基于 MinerU 2.5+ VLM 后端的 GPU 加速 OCR 服务。

## 架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                    ReDeck 服务架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Port 8000                      Port 8001                  │
│   ┌─────────────────┐           ┌─────────────────┐        │
│   │  Main API       │           │  GPU OCR API    │        │
│   │  (main.py)      │           │  (gpu_ocr_main) │        │
│   │                 │           │                 │        │
│   │  • 云端 OCR     │           │  • 本地 GPU OCR │        │
│   │  • HTML 生成    │           │  • VLM 后端     │        │
│   │  • PPTX 转换    │           │  • 高精度解析   │        │
│   └─────────────────┘           └────────┬────────┘        │
│                                          │                  │
│                                          ▼                  │
│                                 ┌─────────────────┐        │
│                                 │  MinerU VLM     │        │
│                                 │  (vLLM Engine)  │        │
│                                 │                 │        │
│                                 │  RTX 4090 GPU   │        │
│                                 └─────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 安装 MinerU GPU 版本

```bash
cd /home/ubuntu/app/redeck-gpu/fastapi

# 运行安装脚本
./install_mineru_gpu.sh

# 或手动安装
source venv/bin/activate
pip install 'mineru[vlm-vllm-engine]'
mineru-models-download
```

### 2. 启动 GPU OCR 服务

```bash
# 方式 1: 直接启动（推荐）
./start_gpu_ocr.sh

# 方式 2: 手动启动
source venv/bin/activate
python gpu_ocr_main.py
```

### 3. 使用 API

```bash
# 上传图片
curl -X POST http://localhost:8001/upload \
  -F "file=@slide.png"

# 返回: {"file_path": "input/2025-12-04/uuid.png", ...}

# 执行 GPU OCR
curl -X POST http://localhost:8001/ocr/process \
  -H "Content-Type: application/json" \
  -d '{"file_path": "input/2025-12-04/uuid.png"}'
```

## 后端模式

### vlm-vllm-engine（推荐）

使用 vLLM 框架在本地 GPU 上运行 MinerU 2.5 模型。

- **优点**: 简单、低延迟
- **显存需求**: 8GB+
- **适用场景**: 单用户、低并发

```bash
export GPU_OCR_BACKEND=vlm-vllm-engine
./start_gpu_ocr.sh
```

### vlm-http-client

连接到独立运行的 MinerU OpenAI Server，适合高吞吐量场景。

- **优点**: 高并发、可扩展
- **适用场景**: 多用户、高并发

```bash
# 终端 1: 启动 OpenAI Server
./start_mineru_server.sh

# 终端 2: 启动 GPU OCR 服务
export GPU_OCR_BACKEND=vlm-http-client
export GPU_OCR_SERVER_URL=http://127.0.0.1:30000
./start_gpu_ocr.sh
```

### pipeline

传统 pipeline 后端，使用多个独立模型（布局检测、OCR、公式识别等）。

- **优点**: 兼容性好、可定制
- **适用场景**: 需要细粒度控制

```bash
export GPU_OCR_BACKEND=pipeline
./start_gpu_ocr.sh
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GPU_OCR_PORT` | `8001` | GPU OCR 服务端口 |
| `GPU_OCR_BACKEND` | `vlm-vllm-engine` | OCR 后端类型 |
| `GPU_OCR_SERVER_URL` | `http://127.0.0.1:30000` | HTTP 客户端模式的服务器 URL |
| `MINERU_MODEL_SOURCE` | `huggingface` | 模型源 (huggingface/modelscope) |
| `MINERU_SERVER_PORT` | `30000` | OpenAI Server 端口 |
| `GPU_MEMORY_UTILIZATION` | `0.8` | GPU 显存使用率 |

## API 端点

### GET /health
健康检查和 GPU 状态

```json
{
  "status": "healthy",
  "gpu_available": true,
  "gpu_info": "NVIDIA GeForce RTX 4090, 24564MiB, 23000MiB",
  "mineru_installed": true,
  "mineru_version": "2.6.6"
}
```

### GET /status
详细状态信息

### POST /upload
上传图片文件

### POST /ocr/process
执行 GPU OCR 处理

**请求体**:
```json
{
  "file_path": "input/2025-12-04/uuid.png",
  "backend": "vlm-vllm-engine",
  "lang": "ch",
  "enable_table": false,
  "enable_formula": false
}
```

**响应**:
```json
{
  "success": true,
  "message": "GPU OCR 处理成功",
  "backend": "vlm-vllm-engine",
  "outputPath": "output/2025-12-04/uuid",
  "result": {
    "output_files": ["uuid/auto/uuid.md", "uuid/auto/uuid_middle.json", ...]
  }
}
```

## 性能参考

在 RTX 4090 上的典型性能：

| 文档类型 | vlm-vllm-engine | pipeline |
|----------|-----------------|----------|
| 单张 PPT 幻灯片 | ~2s | ~5s |
| 10 页 PDF | ~15s | ~40s |
| 复杂表格 | ~3s | ~8s |

## 故障排除

### MinerU 未安装

```bash
# 运行安装脚本
./install_mineru_gpu.sh

# 或手动安装
pip install 'mineru[vlm-vllm-engine]'
```

### GPU 显存不足

```bash
# 降低显存使用率
export GPU_MEMORY_UTILIZATION=0.5

# 或使用 pipeline 后端（显存需求更低）
export GPU_OCR_BACKEND=pipeline
```

### 模型下载失败

```bash
# 使用 ModelScope（中国用户）
export MINERU_MODEL_SOURCE=modelscope
mineru-models-download
```

### 服务连接失败

```bash
# 检查服务状态
curl http://localhost:8001/health

# 检查端口占用
lsof -i :8001
```

## 与主 API 服务集成

GPU OCR 服务可与主 API 服务配合使用：

1. 主服务 (8000) 负责云端 OCR、LLM 调用和 PPTX 生成
2. GPU OCR 服务 (8001) 负责本地 GPU 加速的高精度 OCR

前端可根据需求选择调用不同的服务端点。
