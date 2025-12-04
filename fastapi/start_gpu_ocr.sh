#!/bin/bash
# ========================================
#    ReDeck GPU OCR Service Startup
#    基于 MinerU VLM 的 GPU 加速 OCR
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================"
echo -e "${CYAN}   ReDeck GPU OCR Service${NC}"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo -e "${GREEN}工作目录: $SCRIPT_DIR${NC}"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[警告] .env 文件不存在${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${YELLOW}已从 env.example 复制，请编辑 .env 配置 API Keys${NC}"
    fi
fi

# 加载环境变量
source .env 2>/dev/null || true

# GPU OCR 配置
GPU_OCR_PORT=${GPU_OCR_PORT:-8001}
GPU_OCR_BACKEND=${GPU_OCR_BACKEND:-vlm-vllm-engine}
GPU_OCR_SERVER_URL=${GPU_OCR_SERVER_URL:-http://127.0.0.1:30000}

# 检查 GPU
echo ""
echo "检查 GPU 状态..."
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}GPU 可用:${NC}"
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader
else
    echo -e "${RED}[错误] 未检测到 NVIDIA GPU${NC}"
    echo "GPU OCR 需要 NVIDIA GPU 支持"
    exit 1
fi

# 检查 CUDA
echo ""
if command -v nvcc &> /dev/null; then
    echo -e "${GREEN}CUDA 版本: $(nvcc --version | grep release | awk '{print $6}')${NC}"
else
    echo -e "${YELLOW}[警告] nvcc 未找到，但 GPU 驱动可能仍支持 CUDA${NC}"
fi

# 检查 Python 和 MinerU
echo ""
echo "检查 MinerU 安装..."

# 优先使用 venv
if [ -d "venv" ]; then
    source venv/bin/activate
    echo -e "${GREEN}已激活虚拟环境: venv${NC}"
fi

# 检查 mineru 命令
if command -v mineru &> /dev/null; then
    MINERU_VERSION=$(mineru --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}MinerU 已安装: $MINERU_VERSION${NC}"
    echo -e "${GREEN}路径: $(which mineru)${NC}"
else
    echo -e "${RED}[错误] MinerU 未安装${NC}"
    echo ""
    echo "请安装 MinerU (GPU 版本):"
    echo ""
    echo "  # 方式 1: pip 安装 (推荐)"
    echo "  pip install 'mineru[vlm-vllm-engine]'"
    echo ""
    echo "  # 方式 2: 使用 Docker"
    echo "  docker pull mineruai/mineru:latest"
    echo ""
    echo "文档: https://opendatalab.github.io/MinerU/"
    exit 1
fi

# 下载模型（如果需要）
echo ""
echo "检查模型..."
if command -v mineru-models-download &> /dev/null; then
    # 检查模型是否已下载（通过检查配置文件）
    MINERU_CONFIG=~/.mineru/mineru.json
    if [ ! -f "$MINERU_CONFIG" ]; then
        echo -e "${YELLOW}首次运行，正在下载模型...${NC}"
        echo "这可能需要几分钟时间..."
        
        # 设置模型源（中国用户可使用 modelscope）
        export MINERU_MODEL_SOURCE=${MINERU_MODEL_SOURCE:-huggingface}
        
        mineru-models-download
        echo -e "${GREEN}模型下载完成${NC}"
    else
        echo -e "${GREEN}模型配置已存在${NC}"
    fi
fi

# 显示配置
echo ""
echo "========================================"
echo "   配置信息"
echo "========================================"
echo "  服务端口: ${GPU_OCR_PORT}"
echo "  OCR 后端: ${GPU_OCR_BACKEND}"
if [ "$GPU_OCR_BACKEND" = "vlm-http-client" ]; then
    echo "  服务器 URL: ${GPU_OCR_SERVER_URL}"
fi
echo "  模型源: ${MINERU_MODEL_SOURCE:-huggingface}"
echo "========================================"

# 启动服务
echo ""
echo "========================================"
echo -e "${CYAN}   启动 GPU OCR 服务...${NC}"
echo "   URL: http://0.0.0.0:${GPU_OCR_PORT}"
echo "   API 文档: http://localhost:${GPU_OCR_PORT}/docs"
echo "   按 Ctrl+C 停止"
echo "========================================"
echo ""

# 设置环境变量
export GPU_OCR_PORT
export GPU_OCR_BACKEND
export GPU_OCR_SERVER_URL

# 启动服务
python gpu_ocr_main.py
