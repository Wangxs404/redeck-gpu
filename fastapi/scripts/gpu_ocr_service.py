"""
MinerU GPU 加速 OCR 服务模块

基于 MinerU 2.5+ 的 VLM 后端，使用 vLLM 进行 GPU 加速推理。
支持两种运行模式：
1. vlm-vllm-engine: 直接在进程内使用 vLLM 引擎
2. vlm-http-client: 连接到独立运行的 mineru-openai-server

依赖安装（需要 GPU 环境）：
    pip install "mineru[vlm-vllm-engine]"
    
或使用 Docker:
    docker pull mineruai/mineru:latest
"""

import os
import asyncio
import subprocess
import shutil
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import json

logger = logging.getLogger(__name__)

# GPU OCR 配置
GPU_OCR_BACKEND = os.getenv("GPU_OCR_BACKEND", "vlm-vllm-engine")  # vlm-vllm-engine 或 vlm-http-client
GPU_OCR_SERVER_URL = os.getenv("GPU_OCR_SERVER_URL", "http://127.0.0.1:30000")  # vlm-http-client 模式下的服务器地址
GPU_OCR_MODEL_SOURCE = os.getenv("MINERU_MODEL_SOURCE", "huggingface")  # huggingface 或 modelscope


def check_mineru_installed() -> Dict[str, Any]:
    """
    检查 MinerU 是否已安装及其版本信息
    """
    result = {
        "installed": False,
        "version": None,
        "mineru_path": None,
        "mineru_api_path": None,
        "gpu_available": False,
        "cuda_version": None,
    }
    
    # 检查 mineru 命令
    mineru_path = shutil.which("mineru")
    if mineru_path:
        result["installed"] = True
        result["mineru_path"] = mineru_path
        
        # 获取版本
        try:
            version_output = subprocess.run(
                ["mineru", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if version_output.returncode == 0:
                result["version"] = version_output.stdout.strip()
        except Exception as e:
            logger.warning(f"获取 MinerU 版本失败: {e}")
    
    # 检查 mineru-api 命令
    mineru_api_path = shutil.which("mineru-api")
    if mineru_api_path:
        result["mineru_api_path"] = mineru_api_path
    
    # 检查 GPU
    try:
        nvidia_smi = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,driver_version,memory.total", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if nvidia_smi.returncode == 0:
            result["gpu_available"] = True
            result["gpu_info"] = nvidia_smi.stdout.strip()
    except Exception:
        pass
    
    # 检查 CUDA 版本
    try:
        nvcc = subprocess.run(
            ["nvcc", "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if nvcc.returncode == 0:
            for line in nvcc.stdout.split("\n"):
                if "release" in line.lower():
                    result["cuda_version"] = line.strip()
                    break
    except Exception:
        pass
    
    return result


async def run_gpu_ocr(
    input_path: str,
    output_path: str,
    backend: Optional[str] = None,
    server_url: Optional[str] = None,
    lang: str = "ch",
    enable_table: bool = False,
    enable_formula: bool = False,
) -> Dict[str, Any]:
    """
    使用 GPU 加速运行 MinerU OCR
    
    Args:
        input_path: 输入文件路径（图片或 PDF）
        output_path: 输出目录路径
        backend: OCR 后端，可选 vlm-vllm-engine, vlm-http-client, pipeline
        server_url: vlm-http-client 模式下的服务器 URL
        lang: OCR 语言，默认中文
        enable_table: 是否启用表格解析
        enable_formula: 是否启用公式解析
        
    Returns:
        处理结果字典
    """
    backend = backend or GPU_OCR_BACKEND
    server_url = server_url or GPU_OCR_SERVER_URL
    
    # 检查 mineru 命令
    mineru_path = shutil.which("mineru")
    if not mineru_path:
        raise FileNotFoundError(
            "MinerU 未安装。请运行:\n"
            "  pip install 'mineru[vlm-vllm-engine]'\n"
            "或使用 Docker:\n"
            "  docker pull mineruai/mineru:latest"
        )
    
    # 构建命令
    cmd = [
        mineru_path,
        "-p", input_path,
        "-o", output_path,
        "-b", backend,  # 指定后端
        "-l", lang,
    ]
    
    # vlm-http-client 模式需要指定服务器 URL
    if backend == "vlm-http-client":
        cmd.extend(["-u", server_url])
    
    # 表格和公式选项
    if not enable_table:
        cmd.extend(["-t", "false"])
    if not enable_formula:
        cmd.extend(["-f", "false"])
    
    logger.info(f"[GPU OCR] 执行命令: {' '.join(cmd)}")
    
    try:
        # 异步执行命令
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(Path(output_path).parent)
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=600  # 10 分钟超时
        )
        
        stdout_str = stdout.decode("utf-8", errors="replace")
        stderr_str = stderr.decode("utf-8", errors="replace")
        
        if process.returncode != 0:
            raise RuntimeError(
                f"MinerU GPU OCR 失败 (返回码: {process.returncode})\n"
                f"错误输出: {stderr_str or '无错误输出'}"
            )
        
        # 收集输出文件
        output_path_obj = Path(output_path)
        output_files = []
        if output_path_obj.exists():
            for file in output_path_obj.rglob("*"):
                if file.is_file():
                    output_files.append(str(file.relative_to(output_path_obj)))
        
        return {
            "success": True,
            "return_code": process.returncode,
            "stdout": stdout_str,
            "stderr": stderr_str,
            "output_files": output_files,
            "backend": backend,
        }
        
    except asyncio.TimeoutError:
        raise RuntimeError("MinerU GPU OCR 超时（超过 10 分钟）")
    except Exception as e:
        raise RuntimeError(f"执行 MinerU GPU OCR 时出错: {str(e)}")


async def start_openai_server(
    port: int = 30000,
    host: str = "0.0.0.0",
    engine: str = "vllm",
    gpu_memory_utilization: float = 0.8,
) -> subprocess.Popen:
    """
    启动 MinerU OpenAI 兼容服务器
    
    用于 vlm-http-client 模式，可以提供更高的吞吐量和并发能力。
    
    Args:
        port: 服务端口
        host: 监听地址
        engine: 推理引擎 (vllm 或 lmdeploy)
        gpu_memory_utilization: GPU 显存使用率
        
    Returns:
        服务进程对象
    """
    mineru_openai_server = shutil.which("mineru-openai-server")
    if not mineru_openai_server:
        raise FileNotFoundError(
            "mineru-openai-server 未安装。请运行:\n"
            "  pip install 'mineru[vlm-vllm-engine]'"
        )
    
    cmd = [
        mineru_openai_server,
        "--engine", engine,
        "--port", str(port),
        "--host", host,
        "--gpu-memory-utilization", str(gpu_memory_utilization),
    ]
    
    logger.info(f"[GPU OCR Server] 启动命令: {' '.join(cmd)}")
    
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    
    # 等待服务启动
    await asyncio.sleep(5)
    
    if process.poll() is not None:
        stderr = process.stderr.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI 服务器启动失败: {stderr}")
    
    logger.info(f"[GPU OCR Server] 服务已启动: http://{host}:{port}")
    
    return process


def get_gpu_ocr_status() -> Dict[str, Any]:
    """
    获取 GPU OCR 服务状态
    """
    status = check_mineru_installed()
    status["backend"] = GPU_OCR_BACKEND
    status["server_url"] = GPU_OCR_SERVER_URL if GPU_OCR_BACKEND == "vlm-http-client" else None
    status["model_source"] = GPU_OCR_MODEL_SOURCE
    
    return status
