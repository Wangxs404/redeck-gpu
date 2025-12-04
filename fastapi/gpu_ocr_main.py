"""
ReDeck GPU OCR 服务

独立的 GPU 加速 OCR 服务，运行在新端口 (默认 8001)。
使用 MinerU 2.5+ VLM 后端进行高精度文档解析。

启动方式:
    python gpu_ocr_main.py

或使用 uvicorn:
    uvicorn gpu_ocr_main:app --host 0.0.0.0 --port 8001

环境变量:
    GPU_OCR_PORT: 服务端口 (默认 8001)
    GPU_OCR_BACKEND: 后端类型 (vlm-vllm-engine 或 vlm-http-client)
    GPU_OCR_SERVER_URL: vlm-http-client 模式的服务器 URL
    MINERU_MODEL_SOURCE: 模型源 (huggingface 或 modelscope)
"""

import os
import subprocess
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional
from pydantic import BaseModel
import uvicorn
from datetime import datetime
import uuid as uuid_lib
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
import json
import mimetypes

# 加载 .env 文件
load_dotenv()

# ============ 配置 ============
ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"
DEBUG = os.getenv("DEBUG", "false" if IS_PRODUCTION else "true").lower() == "true"

# GPU OCR 专用端口
GPU_OCR_PORT = int(os.getenv("GPU_OCR_PORT", "8001"))
GPU_OCR_HOST = os.getenv("GPU_OCR_HOST", "0.0.0.0")

# GPU OCR 后端配置
GPU_OCR_BACKEND = os.getenv("GPU_OCR_BACKEND", "vlm-vllm-engine")
GPU_OCR_SERVER_URL = os.getenv("GPU_OCR_SERVER_URL", "http://127.0.0.1:30000")
MINERU_MODEL_SOURCE = os.getenv("MINERU_MODEL_SOURCE", "huggingface")

# 创建 FastAPI 应用
app = FastAPI(
    title="ReDeck GPU OCR API",
    description="基于 MinerU VLM 的 GPU 加速 OCR 服务",
    version="1.0.0",
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url="/redoc" if not IS_PRODUCTION else None,
    openapi_url="/openapi.json" if not IS_PRODUCTION else None,
)

# CORS 配置
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if IS_PRODUCTION else ["*"]
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]
if IS_PRODUCTION and not ALLOWED_ORIGINS:
    ALLOWED_ORIGINS = [
        "https://video2ppt.com",
        "https://www.video2ppt.com",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if IS_PRODUCTION else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置路径
BASE_DIR = Path(__file__).parent
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
LOG_DIR = BASE_DIR / "logs"

# 确保目录存在
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
INPUT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# 静态文件服务
app.mount("/static/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

# 配置日志
log_file = LOG_DIR / "gpu_ocr.log"
logger = logging.getLogger("gpu_ocr")
logger.setLevel(logging.INFO)

if not logger.handlers:
    file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(console_handler)

# 静态资源 URL
_host_env = os.getenv("HOST", "0.0.0.0")
_port_env = str(GPU_OCR_PORT)
_base_host = "localhost" if _host_env in ("0.0.0.0", "127.0.0.1") else _host_env
DEFAULT_BASE_URL = f"http://{_base_host}:{_port_env}"
STATIC_BASE_URL = os.getenv("GPU_OCR_STATIC_BASE_URL", os.getenv("STATIC_BASE_URL", DEFAULT_BASE_URL))


class GpuOcrRequest(BaseModel):
    """GPU OCR 请求体"""
    file_path: str  # 图片路径，格式: input/YYYY-MM-DD/UUID.ext
    backend: Optional[str] = None  # 后端类型：vlm-vllm-engine, vlm-http-client, pipeline
    lang: Optional[str] = "ch"  # OCR 语言
    enable_table: Optional[bool] = False  # 是否启用表格解析
    enable_formula: Optional[bool] = False  # 是否启用公式解析


class GpuOcrUrlRequest(BaseModel):
    """通过 URL 进行 GPU OCR"""
    file_url: str  # 图片的公开 URL
    backend: Optional[str] = None
    lang: Optional[str] = "ch"
    enable_table: Optional[bool] = False
    enable_formula: Optional[bool] = False


def check_mineru_installation() -> dict:
    """检查 MinerU 安装状态"""
    result = {
        "installed": False,
        "version": None,
        "mineru_path": None,
        "mineru_api_path": None,
        "gpu_available": False,
        "gpu_info": None,
    }
    
    # 检查 mineru 命令
    mineru_path = shutil.which("mineru")
    if mineru_path:
        result["installed"] = True
        result["mineru_path"] = mineru_path
        
        try:
            version_output = subprocess.run(
                ["mineru", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if version_output.returncode == 0:
                result["version"] = version_output.stdout.strip()
        except Exception:
            pass
    
    # 检查 mineru-api
    mineru_api_path = shutil.which("mineru-api")
    if mineru_api_path:
        result["mineru_api_path"] = mineru_api_path
    
    # 检查 GPU
    try:
        nvidia_smi = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.free", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if nvidia_smi.returncode == 0:
            result["gpu_available"] = True
            result["gpu_info"] = nvidia_smi.stdout.strip()
    except Exception:
        pass
    
    return result


async def run_mineru_gpu(
    input_path: str,
    output_path: str,
    backend: str = None,
    lang: str = "ch",
    enable_table: bool = False,
    enable_formula: bool = False,
) -> dict:
    """
    运行 MinerU GPU OCR
    """
    import asyncio
    
    backend = backend or GPU_OCR_BACKEND
    mineru_path = shutil.which("mineru")
    
    if not mineru_path:
        raise FileNotFoundError(
            "MinerU 未安装。请运行:\n"
            "  pip install 'mineru[vlm-vllm-engine]'\n"
            "或参考文档: https://opendatalab.github.io/MinerU/"
        )
    
    # 构建命令
    cmd = [
        mineru_path,
        "-p", input_path,
        "-o", output_path,
        "-b", backend,
        "-l", lang,
    ]
    
    # vlm-http-client 模式需要服务器 URL
    if backend == "vlm-http-client":
        cmd.extend(["-u", GPU_OCR_SERVER_URL])
    
    # 表格和公式选项
    if not enable_table:
        cmd.extend(["-t", "false"])
    if not enable_formula:
        cmd.extend(["-f", "false"])
    
    logger.info(f"[GPU OCR] 执行: {' '.join(cmd)}")
    
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=600
        )
        
        stdout_str = stdout.decode("utf-8", errors="replace")
        stderr_str = stderr.decode("utf-8", errors="replace")
        
        if process.returncode != 0:
            raise RuntimeError(
                f"MinerU 执行失败 (返回码: {process.returncode})\n"
                f"错误: {stderr_str or stdout_str or '无输出'}"
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


def simplify_ocr_output(output_dir: Path) -> dict:
    """
    简化 OCR 输出文件命名（与 main.py 中的函数相同）
    """
    auto_dirs = list(output_dir.rglob("auto"))
    if not auto_dirs:
        return {}
    
    auto_dir = auto_dirs[0]
    images_dir = auto_dir / "images"
    
    if not images_dir.exists():
        return {}
    
    mapping = {}
    image_files = sorted(images_dir.glob("*.jpg")) + sorted(images_dir.glob("*.png"))
    
    for i, img_file in enumerate(image_files, 1):
        old_name = img_file.name
        if old_name.startswith("img_"):
            continue
        
        new_name = f"img_{i:02d}{img_file.suffix}"
        new_path = images_dir / new_name
        
        if new_path.exists() and new_path != img_file:
            continue
        
        try:
            img_file.rename(new_path)
            mapping[old_name] = new_name
        except Exception as e:
            logger.warning(f"重命名失败: {old_name}, 错误: {e}")
    
    if not mapping:
        return {}
    
    # 更新 Markdown 和 JSON 引用
    for md_file in auto_dir.glob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            for old_name, new_name in mapping.items():
                content = content.replace(old_name, new_name)
            md_file.write_text(content, encoding="utf-8")
        except Exception:
            pass
    
    for json_file in auto_dir.glob("*.json"):
        try:
            content = json_file.read_text(encoding="utf-8")
            for old_name, new_name in mapping.items():
                content = content.replace(old_name, new_name)
            json_file.write_text(content, encoding="utf-8")
        except Exception:
            pass
    
    return mapping


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "ReDeck GPU OCR API",
        "version": "1.0.0",
        "backend": GPU_OCR_BACKEND,
        "port": GPU_OCR_PORT,
        "endpoints": {
            "GET /health": "健康检查和 GPU 状态",
            "GET /status": "MinerU 安装状态",
            "POST /upload": "上传图片",
            "POST /ocr/process": "处理已上传的图片 (GPU OCR)",
        }
    }


@app.get("/health")
async def health():
    """健康检查"""
    installation = check_mineru_installation()
    return {
        "status": "healthy",
        "service": "gpu_ocr",
        "port": GPU_OCR_PORT,
        "backend": GPU_OCR_BACKEND,
        "mineru_installed": installation["installed"],
        "mineru_version": installation["version"],
        "gpu_available": installation["gpu_available"],
        "gpu_info": installation["gpu_info"],
    }


@app.get("/status")
async def status():
    """详细状态信息"""
    installation = check_mineru_installation()
    return {
        "mineru": installation,
        "config": {
            "backend": GPU_OCR_BACKEND,
            "server_url": GPU_OCR_SERVER_URL if GPU_OCR_BACKEND == "vlm-http-client" else None,
            "model_source": MINERU_MODEL_SOURCE,
            "port": GPU_OCR_PORT,
            "static_base_url": STATIC_BASE_URL,
        },
        "directories": {
            "base": str(BASE_DIR),
            "input": str(INPUT_DIR),
            "output": str(OUTPUT_DIR),
            "logs": str(LOG_DIR),
        }
    }


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="文件必须是图片格式")
    
    date_str = datetime.now().strftime("%Y-%m-%d")
    file_uuid = str(uuid_lib.uuid4())
    
    ext = Path(file.filename).suffix
    if not ext:
        ext = mimetypes.guess_extension(file.content_type) or ".jpg"
    
    save_dir = INPUT_DIR / date_str
    save_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"{file_uuid}{ext}"
    file_path = save_dir / filename
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        relative_path = f"input/{date_str}/{filename}"
        
        return {
            "status": "success",
            "message": "文件上传成功",
            "file_path": relative_path,
            "filename": filename,
            "uuid": file_uuid,
            "date": date_str
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")


@app.post("/ocr/process")
async def process_gpu_ocr(request: GpuOcrRequest):
    """
    使用 GPU 加速进行 OCR 处理
    
    使用 MinerU VLM 后端进行高精度文档解析。
    支持 vlm-vllm-engine（本地 GPU）和 vlm-http-client（远程服务器）两种模式。
    """
    input_file_path = BASE_DIR / request.file_path
    
    if not input_file_path.exists():
        raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")
    
    if not input_file_path.is_file():
        raise HTTPException(status_code=400, detail=f"路径不是文件: {request.file_path}")
    
    try:
        # 从路径提取日期和 UUID
        path_parts = Path(request.file_path).parts
        if len(path_parts) >= 3:
            date_str = path_parts[1]
            file_name = path_parts[2]
            file_uuid = file_name.split('.')[0]
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")
            file_uuid = str(uuid_lib.uuid4())
        
        # 构建输出路径
        output_dir = OUTPUT_DIR / date_str / file_uuid
        output_dir.mkdir(parents=True, exist_ok=True)
        
        backend = request.backend or GPU_OCR_BACKEND
        
        logger.info(f"[GPU OCR] 开始处理: {request.file_path}")
        logger.info(f"[GPU OCR] 后端: {backend}")
        
        # 运行 GPU OCR
        result = await run_mineru_gpu(
            str(input_file_path),
            str(output_dir),
            backend=backend,
            lang=request.lang,
            enable_table=request.enable_table,
            enable_formula=request.enable_formula,
        )
        
        # 简化文件命名
        rename_mapping = simplify_ocr_output(output_dir)
        
        logger.info(f"[GPU OCR] 处理完成，重命名 {len(rename_mapping)} 个图片")
        
        return JSONResponse(content={
            "success": True,
            "message": "GPU OCR 处理成功",
            "backend": backend,
            "outputPath": str(output_dir.relative_to(BASE_DIR)).replace("\\", "/"),
            "input_file": str(input_file_path.relative_to(BASE_DIR)).replace("\\", "/"),
            "result": result,
            "renamed_images": len(rename_mapping),
        })
        
    except FileNotFoundError as e:
        logger.error(f"[GPU OCR] MinerU 未安装: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"[GPU OCR] 处理失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"GPU OCR 处理失败: {str(e)}")


# 启动配置打印
print(f"=" * 50)
print(f"  ReDeck GPU OCR Service")
print(f"=" * 50)
print(f"  Port: {GPU_OCR_PORT}")
print(f"  Backend: {GPU_OCR_BACKEND}")
print(f"  Model Source: {MINERU_MODEL_SOURCE}")
if GPU_OCR_BACKEND == "vlm-http-client":
    print(f"  Server URL: {GPU_OCR_SERVER_URL}")
print(f"=" * 50)


if __name__ == "__main__":
    uvicorn.run(app, host=GPU_OCR_HOST, port=GPU_OCR_PORT)
