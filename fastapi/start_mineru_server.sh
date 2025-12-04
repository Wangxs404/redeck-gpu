#!/bin/bash
# ========================================
#    MinerU OpenAI Server Startup
#    用于 vlm-http-client 模式的高吞吐量服务
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================"
echo -e "${CYAN}   MinerU OpenAI Server${NC}"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 加载环境变量
source .env 2>/dev/null || true

# 配置
MINERU_SERVER_PORT=${MINERU_SERVER_PORT:-30000}
MINERU_SERVER_HOST=${MINERU_SERVER_HOST:-0.0.0.0}
MINERU_ENGINE=${MINERU_ENGINE:-vllm}
GPU_MEMORY_UTILIZATION=${GPU_MEMORY_UTILIZATION:-0.8}

# 激活虚拟环境
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 检查 mineru-openai-server
if ! command -v mineru-openai-server &> /dev/null; then
    echo -e "${RED}[错误] mineru-openai-server 未安装${NC}"
    echo ""
    echo "请安装:"
    echo "  pip install 'mineru[vlm-vllm-engine]'"
    exit 1
fi

# 检查 GPU
echo ""
echo "GPU 状态:"
nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader

echo ""
echo "========================================"
echo "   配置"
echo "========================================"
echo "  端口: ${MINERU_SERVER_PORT}"
echo "  引擎: ${MINERU_ENGINE}"
echo "  GPU 显存使用率: ${GPU_MEMORY_UTILIZATION}"
echo "========================================"

echo ""
echo "========================================"
echo -e "${CYAN}   启动 MinerU OpenAI Server...${NC}"
echo "   URL: http://${MINERU_SERVER_HOST}:${MINERU_SERVER_PORT}"
echo ""
echo "   使用方法:"
echo "   mineru -p <input> -o <output> -b vlm-http-client -u http://127.0.0.1:${MINERU_SERVER_PORT}"
echo ""
echo "   按 Ctrl+C 停止"
echo "========================================"
echo ""

# 启动服务器
mineru-openai-server \
    --engine ${MINERU_ENGINE} \
    --port ${MINERU_SERVER_PORT} \
    --host ${MINERU_SERVER_HOST} \
    --gpu-memory-utilization ${GPU_MEMORY_UTILIZATION}
