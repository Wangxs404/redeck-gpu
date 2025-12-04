#!/bin/bash
# ========================================
#    MinerU GPU 版本安装脚本
#    安装 MinerU 2.5+ 及 vLLM 加速支持
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================"
echo -e "${CYAN}   MinerU GPU 版本安装${NC}"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Python 版本
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

echo ""
echo "Python 版本: $PYTHON_VERSION"

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
    echo -e "${RED}[错误] MinerU 需要 Python 3.10+${NC}"
    exit 1
fi

# 检查 GPU
echo ""
echo "检查 GPU..."
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}NVIDIA GPU 检测到:${NC}"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
else
    echo -e "${RED}[错误] 未检测到 NVIDIA GPU${NC}"
    echo "GPU 加速需要 NVIDIA GPU"
    exit 1
fi

# 检查 CUDA
echo ""
if command -v nvcc &> /dev/null; then
    CUDA_VERSION=$(nvcc --version | grep release | awk '{print $6}' | cut -d, -f1)
    echo -e "${GREEN}CUDA 版本: $CUDA_VERSION${NC}"
else
    echo -e "${YELLOW}[警告] nvcc 未找到，将使用驱动程序提供的 CUDA${NC}"
fi

# 创建或激活虚拟环境
echo ""
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
echo -e "${GREEN}已激活虚拟环境${NC}"

# 升级 pip
echo ""
echo "升级 pip..."
pip install --upgrade pip

# 安装 PyTorch（GPU 版本）
echo ""
echo "安装 PyTorch (GPU)..."
# 根据 CUDA 版本选择合适的 PyTorch
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# 安装 MinerU（包含 vLLM 加速）
echo ""
echo "安装 MinerU (vlm-vllm-engine)..."
pip install 'mineru[vlm-vllm-engine]'

# 验证安装
echo ""
echo "验证安装..."
if command -v mineru &> /dev/null; then
    echo -e "${GREEN}MinerU 安装成功!${NC}"
    echo "版本: $(mineru --version)"
    echo "路径: $(which mineru)"
else
    echo -e "${RED}[错误] MinerU 安装失败${NC}"
    exit 1
fi

if command -v mineru-api &> /dev/null; then
    echo -e "${GREEN}mineru-api: $(which mineru-api)${NC}"
fi

if command -v mineru-openai-server &> /dev/null; then
    echo -e "${GREEN}mineru-openai-server: $(which mineru-openai-server)${NC}"
fi

# 下载模型
echo ""
echo "========================================"
echo "   下载模型"
echo "========================================"
echo ""
echo "模型将从 HuggingFace 下载（约 2GB）"
echo "中国用户可设置: export MINERU_MODEL_SOURCE=modelscope"
echo ""

read -p "是否现在下载模型? (y/n): " DOWNLOAD_MODELS
if [ "$DOWNLOAD_MODELS" = "y" ] || [ "$DOWNLOAD_MODELS" = "Y" ]; then
    echo ""
    echo "下载模型中..."
    mineru-models-download
    echo -e "${GREEN}模型下载完成!${NC}"
else
    echo ""
    echo "稍后可运行以下命令下载模型:"
    echo "  source venv/bin/activate && mineru-models-download"
fi

echo ""
echo "========================================"
echo -e "${GREEN}   安装完成!${NC}"
echo "========================================"
echo ""
echo "使用方法:"
echo ""
echo "  1. 启动 GPU OCR 服务:"
echo "     ./start_gpu_ocr.sh"
echo ""
echo "  2. 或使用 MinerU OpenAI Server (高吞吐量):"
echo "     ./start_mineru_server.sh"
echo "     然后在另一个终端:"
echo "     ./start_gpu_ocr.sh  # 设置 GPU_OCR_BACKEND=vlm-http-client"
echo ""
echo "  3. 命令行使用:"
echo "     source venv/bin/activate"
echo "     mineru -p input.pdf -o output/ -b vlm-vllm-engine"
echo ""
echo "API 端点:"
echo "  主 API 服务: http://localhost:8000"
echo "  GPU OCR 服务: http://localhost:8001"
echo ""
