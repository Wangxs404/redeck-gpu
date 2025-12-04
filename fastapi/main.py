import os
import subprocess
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional
from pydantic import BaseModel
import uvicorn
from datetime import datetime
import uuid as uuid_lib
import httpx
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
import base64
import json
import mimetypes
import re

# 加载 .env 文件
load_dotenv()

# R2 上传模块
from scripts.r2_upload import upload_pptx_to_r2, check_r2_config

# ============ 环境配置 ============
# 环境标识：development / production
ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"

# 调试模式（开发环境默认开启）
DEBUG = os.getenv("DEBUG", "false" if IS_PRODUCTION else "true").lower() == "true"

# 创建 FastAPI 应用
# 生产环境关闭交互式文档
app = FastAPI(
    title="ReDeck API",
    description="图片转 PPTX 服务 - 使用 MinerU OCR + LLM 生成",
    version="1.0.0",
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url="/redoc" if not IS_PRODUCTION else None,
    openapi_url="/openapi.json" if not IS_PRODUCTION else None,
)

# ============ CORS 配置 ============
# 允许的来源列表（生产环境从环境变量读取，开发环境允许所有）
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if IS_PRODUCTION else ["*"]
# 清理空字符串
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]
# 如果生产环境没有配置，使用默认值
if IS_PRODUCTION and not ALLOWED_ORIGINS:
    ALLOWED_ORIGINS = [
        "https://video2ppt.com",
        "https://www.video2ppt.com",
        "http://localhost:3000",  # 保留本地开发访问
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
TEMP_DIR = BASE_DIR / "temp"
VENV_SCRIPTS = BASE_DIR / "venv" / "Scripts"
# 使用 mineru 命令（通过 venv 激活后可用，或直接指定路径）
MINERU_CMD = "mineru"  # 使用命令名，依赖 PATH 或 venv 激活

# 确保输出目录存在
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
INPUT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# 配置静态文件服务，让前端可以通过 HTTP 访问 output 目录下的文件
app.mount("/static/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

# 配置日志
log_file = LOG_DIR / "vlm.log"
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 避免重复添加处理器
if not logger.handlers:
    file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(console_handler)

# OpenRouter 配置
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# 默认模型配置：用于 HTML 生成
# 可通过环境变量 DEFAULT_MODEL 覆盖，或在请求时通过 model 参数指定
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "openrouter/bert-nebulon-alpha")

# 静态资源基础 URL（用于在 HTML 中生成可被前端访问的绝对图片地址）
_host_env = os.getenv("HOST", "0.0.0.0")
_port_env = os.getenv("PORT", "8000")
_base_host = "localhost" if _host_env in ("0.0.0.0", "127.0.0.1") else _host_env
DEFAULT_BASE_URL = f"http://{_base_host}:{_port_env}"
STATIC_BASE_URL = os.getenv("STATIC_BASE_URL", DEFAULT_BASE_URL)

# MinerU 云端 OCR API 配置
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "")

# HTTP Referer（用于 OpenRouter API 请求）
# 生产环境使用实际域名，开发环境使用 localhost
HTTP_REFERER = os.getenv("HTTP_REFERER", "https://video2ppt.com" if IS_PRODUCTION else "http://localhost:3000")

# 打印启动配置
print(f"=" * 50)
print(f"  ReDeck API Server Starting...")
print(f"=" * 50)
print(f"  Environment: {ENV}")
print(f"  Debug: {DEBUG}")
print(f"  Host: {os.getenv('HOST', '0.0.0.0')}")
print(f"  Port: {os.getenv('PORT', '8000')}")
print(f"  CORS Origins: {ALLOWED_ORIGINS}")
print(f"  Static Base URL: {STATIC_BASE_URL}")
print(f"  HTTP Referer: {HTTP_REFERER}")
print(f"=" * 50)


class ProcessRequest(BaseModel):
    file_path: str


class CloudOcrRequest(BaseModel):
    """请求体：云端 OCR（输入公开图片 URL）"""
    file_url: str  # 图片的公开 URL（如 R2 URL）
    model: Optional[str] = "google/gemini-2.5-flash"  # LLM 模型（用于后续 HTML 生成）


class SlideHtmlRequest(BaseModel):
    image_path: str
    model: Optional[str] = None  # 不传则使用 DEFAULT_MODEL


class SlidePptxRequest(BaseModel):
    """请求体：HTML 转换为 PPTX"""
    html_file_path: str  # HTML 文件相对路径，如 output/2025-11-24/uuid/uuid/auto/uuid.html
    output_filename: Optional[str] = None  # 可选的输出文件名


class SlidePromptPreviewRequest(BaseModel):
    """请求体：预览 Prompt"""
    image_path: str  # 图片路径，格式: input/YYYY-MM-DD/UUID.ext


class GpuOcrRequest(BaseModel):
    """请求体：GPU OCR 处理"""
    file_path: str  # 图片路径，格式: input/YYYY-MM-DD/UUID.ext
    backend: Optional[str] = "vlm-transformers"  # 后端类型：vlm-transformers, vlm-vllm-engine, pipeline
    lang: Optional[str] = "ch"  # OCR 语言
    enable_table: Optional[bool] = False  # 是否启用表格解析
    enable_formula: Optional[bool] = False  # 是否启用公式解析


class GpuOcrFullRequest(BaseModel):
    """请求体：GPU OCR 一键处理（OCR + HTML + PPTX）"""
    file_path: Optional[str] = None  # 图片路径，格式: input/YYYY-MM-DD/UUID.ext
    file_url: Optional[str] = None  # 或者：图片的公开 URL（如 R2 URL）
    backend: Optional[str] = "vlm-transformers"  # 后端类型
    lang: Optional[str] = "ch"  # OCR 语言
    model: Optional[str] = None  # LLM 模型（用于 HTML 生成）
    enable_table: Optional[bool] = False
    enable_formula: Optional[bool] = False


# GPU OCR 配置
GPU_OCR_BACKEND = os.getenv("GPU_OCR_BACKEND", "vlm-transformers")
MINERU_MODEL_SOURCE = os.getenv("MINERU_MODEL_SOURCE", "local")


@app.get("/")
async def root():
    """根路径，返回 API 信息"""
    return {
        "message": "ReDeck API - 图片转 PPTX 服务",
        "endpoints": {
            "POST /upload": "上传图片",
            "POST /ocr/process": "处理已上传的图片（pipeline 后端）",
            "POST /ocr/process-cloud": "云端 OCR 一键处理",
            "POST /ocr/process-gpu": "GPU OCR 处理（VLM 后端，高精度）",
            "POST /ocr/process-gpu-full": "GPU OCR 一键处理（OCR + HTML + PPTX）",
            "POST /slides/html": "生成 HTML Slides",
            "POST /slides/pptx": "将 HTML 转换为 PPTX",
            "POST /slides/preview-prompt": "预览 LLM Prompt",
            "GET /health": "健康检查"
        }
    }


@app.get("/health")
async def health():
    """健康检查"""
    import shutil
    mineru_path = shutil.which(MINERU_CMD)
    return {
        "status": "healthy",
        "env": ENV,
        "debug": DEBUG,
        "mineru_installed": mineru_path is not None,
        "mineru_path": mineru_path,
        "static_base_url": STATIC_BASE_URL,
    }


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片并按规范保存，不进行 OCR
    路径格式: input/YYYY-MM-DD/UUID.ext
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="文件必须是图片格式")

    # 生成日期和 UUID
    date_str = datetime.now().strftime("%Y-%m-%d")
    file_uuid = str(uuid_lib.uuid4())
    
    # 获取扩展名
    ext = Path(file.filename).suffix
    if not ext:
        ext = mimetypes.guess_extension(file.content_type) or ".jpg"
        
    # 构建保存路径
    save_dir = INPUT_DIR / date_str
    save_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"{file_uuid}{ext}"
    file_path = save_dir / filename
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # 返回相对路径，供后续接口使用
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
async def process_image(request: ProcessRequest):
    """
    处理已上传的图片，启动 MinerU 进行 OCR 识别
    
    Args:
        request: 包含文件路径的请求体
        
    Returns:
        OCR 识别结果信息
    """
    # 构建完整的输入文件路径
    # file_path 格式: input/YYYY-MM-DD/UUID.扩展名
    input_file_path = BASE_DIR / request.file_path
    
    # 验证输入文件是否存在
    if not input_file_path.exists():
        raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")
    
    if not input_file_path.is_file():
        raise HTTPException(status_code=400, detail=f"路径不是文件: {request.file_path}")
    
    try:
        # 从文件路径中提取日期和 UUID
        # 路径格式: input/YYYY-MM-DD/UUID.扩展名
        path_parts = Path(request.file_path).parts
        if len(path_parts) >= 3:
            date_str = path_parts[1]  # YYYY-MM-DD
            file_name = path_parts[2]  # UUID.扩展名
            file_uuid = file_name.split('.')[0]  # 提取 UUID
        else:
            # 如果路径格式不符合预期，使用当前日期和新的 UUID
            date_str = datetime.now().strftime("%Y-%m-%d")
            file_uuid = str(uuid_lib.uuid4())
        
        # 构建输出路径: output/YYYY-MM-DD/UUID
        output_dir = OUTPUT_DIR / date_str / file_uuid
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 调用 mineru 进行 OCR
        result = await run_mineru(str(input_file_path), str(output_dir))
        
        # 简化文件命名：将 64 字符 hash 文件名改为 img_01.jpg 格式
        # 这可以显著减少 LLM 的 token 消耗和出错概率
        rename_mapping = simplify_ocr_output(output_dir)
        
        return JSONResponse(content={
            "success": True,
            "message": "MinerU 处理成功",
            "outputPath": str(output_dir.relative_to(BASE_DIR)).replace("\\", "/"),
            "input_file": str(input_file_path.relative_to(BASE_DIR)).replace("\\", "/"),
            "result": result,
            "renamed_images": len(rename_mapping)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 处理失败: {str(e)}")


@app.post("/ocr/process-cloud")
async def process_cloud_ocr(request: CloudOcrRequest):
    """
    云端 OCR 一键处理：输入图片 URL，输出 PPTX 下载链接
    
    完整流程：
    1. 调用 MinerU 云端 API 进行 OCR
    2. 下载 ZIP 结果并解压
    3. 简化图片文件命名
    4. 调用 LLM 生成 HTML
    5. 转换为 PPTX
    6. 返回下载链接
    
    Args:
        request: 包含图片公开 URL 和模型选择的请求体
        
    Returns:
        包含 PPTX 下载链接的响应
    """
    if not MINERU_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="未配置 MINERU_API_KEY 环境变量，无法使用云端 OCR"
        )
    
    try:
        from scripts.mineru_cloud import run_mineru_cloud
        
        # 生成 UUID 和日期
        file_uuid = str(uuid_lib.uuid4())
        date_str = datetime.now().strftime("%Y-%m-%d")
        
        # 构建输出路径: output/YYYY-MM-DD/UUID
        output_dir = OUTPUT_DIR / date_str / file_uuid
        output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"[云端OCR] 开始处理: {request.file_url}")
        logger.info(f"[云端OCR] 输出目录: {output_dir}")
        
        # Step 1: 调用云端 OCR
        ocr_result = await run_mineru_cloud(
            file_url=request.file_url,
            output_dir=output_dir,
            file_uuid=file_uuid
        )
        
        logger.info(f"[云端OCR] OCR 完成: {ocr_result.get('task_id')}")
        
        # Step 2: 简化文件命名
        rename_mapping = simplify_ocr_output(output_dir)
        logger.info(f"[云端OCR] 重命名 {len(rename_mapping)} 个图片")
        
        # Step 3: 生成 HTML
        logger.info(f"[云端OCR] 开始生成 HTML...")
        
        # 直接查找 OCR 输出文件（云端 OCR 没有本地原图，不使用 find_ocr_files）
        # 云端 OCR 输出结构: output/{date}/{uuid}/{uuid}/auto/{uuid}.md
        auto_dir = output_dir / file_uuid / "auto"
        md_path = auto_dir / f"{file_uuid}.md"
        json_path = auto_dir / f"{file_uuid}_middle.json"
        
        if not md_path.exists():
            raise FileNotFoundError(f"OCR Markdown 文件不存在: {md_path}")
        if not json_path.exists():
            raise FileNotFoundError(f"OCR JSON 文件不存在: {json_path}")
        
        # 读取系统提示词
        system_prompt_path = BASE_DIR / "system_prompt.md"
        if system_prompt_path.exists():
            system_prompt = system_prompt_path.read_text(encoding="utf-8").strip()
        else:
            system_prompt = "You are an AI assistant that generates HTML slides."
        
        # 读取 Markdown 和 JSON
        md_text = md_path.read_text(encoding="utf-8")
        layout_json = json.load(open(json_path, "r", encoding="utf-8"))
        
        # 直接使用公开 URL，LLM API 会自动获取图片
        data_url = request.file_url
        
        # 构建消息
        messages = build_slide_messages(system_prompt, md_text, layout_json, data_url)
        
        # 调用 OpenRouter API
        model = request.model or DEFAULT_MODEL
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 16000,
        }
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": HTTP_REFERER,
            "X-Title": "ReDeck Cloud OCR",
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"LLM API 错误: {response.text}")
            
            result = response.json()
            html_content = result["choices"][0]["message"]["content"]
            usage = result.get("usage", {})
        
        # 清理和处理 HTML
        cleaned_html = clean_html_from_markdown_code_block(html_content)
        final_html = replace_html_image_paths(cleaned_html, date_str, file_uuid)
        
        # 保存 HTML 文件
        html_file_path = md_path.parent / f"{file_uuid}.html"
        html_file_path.write_text(final_html, encoding="utf-8")
        html_relative_path = str(html_file_path.relative_to(BASE_DIR)).replace("\\", "/")
        
        logger.info(f"[云端OCR] HTML 生成完成: {html_relative_path}")
        
        # Step 4: 转换为 PPTX
        logger.info(f"[云端OCR] 开始转换 PPTX...")
        
        output_pptx_path = html_file_path.parent / f"{file_uuid}.pptx"
        scripts_dir = BASE_DIR / "scripts"
        converter_script = scripts_dir / "convert-html-to-pptx.js"
        
        if not converter_script.exists():
            raise HTTPException(status_code=500, detail="PPTX 转换脚本不存在")
        
        cmd = [
            "node",
            str(converter_script),
            str(html_file_path),
            str(output_pptx_path),
            "--tmp-dir", str(TEMP_DIR)
        ]
        
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            cwd=str(scripts_dir),
            timeout=120
        )
        
        if process.returncode != 0:
            stderr = process.stderr or process.stdout or "转换失败"
            logger.error(f"[云端OCR] PPTX 转换失败: {stderr}")
            raise HTTPException(status_code=500, detail=f"PPTX 转换失败: {stderr[:500]}")
        
        if not output_pptx_path.exists():
            raise HTTPException(status_code=500, detail="PPTX 文件生成失败")
        
        # 上传到 R2 并获取公开链接
        pptx_relative_path = str(output_pptx_path.relative_to(BASE_DIR)).replace("\\", "/")
        try:
            download_url = upload_pptx_to_r2(output_pptx_path, date_str, file_uuid)
            logger.info(f"[云端OCR] PPTX 已上传到 R2: {download_url}")
        except Exception as e:
            logger.warning(f"[云端OCR] R2 上传失败，使用本地链接: {e}")
            download_url = f"{STATIC_BASE_URL.rstrip('/')}/static/{pptx_relative_path}"
        
        logger.info(f"[云端OCR] PPTX 生成完成: {download_url}")
        
        return JSONResponse(content={
            "success": True,
            "message": "云端 OCR 处理完成",
            "file_uuid": file_uuid,
            "date": date_str,
            "ocr_task_id": ocr_result.get("task_id"),
            "html_file_path": html_relative_path,
            "pptx_file_path": pptx_relative_path,
            "download_url": download_url,
            "model": model,
            "usage": usage,
            "renamed_images": len(rename_mapping)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[云端OCR] 处理失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"云端 OCR 处理失败: {str(e)}")


@app.post("/ocr/process-gpu")
async def process_gpu_ocr(request: GpuOcrRequest):
    """
    使用 GPU 加速进行 OCR 处理（VLM 后端）
    
    使用 MinerU VLM 后端进行高精度文档解析，支持：
    - vlm-transformers: 使用 HuggingFace Transformers（推荐）
    - vlm-vllm-engine: 使用 vLLM 加速（需安装 vllm）
    - pipeline: 传统多模型 pipeline
    
    Args:
        request: 包含文件路径和配置的请求体
        
    Returns:
        OCR 处理结果
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
        logger.info(f"[GPU OCR] 后端: {backend}, 语言: {request.lang}")
        
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


@app.post("/ocr/process-gpu-full")
async def process_gpu_ocr_full(request: GpuOcrFullRequest):
    """
    GPU OCR 一键处理：输入图片路径或公开 URL，输出 PPTX 下载链接
    
    支持两种输入方式：
    - file_path: 已上传的本地文件路径（如 input/2025-12-04/uuid.png）
    - file_url: 图片的公开 URL（如 R2 URL）
    
    完整流程：
    1. 如果是 URL，先下载图片到本地
    2. 使用 GPU VLM 后端进行高精度 OCR
    3. 简化图片文件命名
    4. 调用 LLM 生成 HTML
    5. 转换为 PPTX
    6. 返回下载链接
    
    Args:
        request: 包含图片路径/URL 和配置的请求体
        
    Returns:
        包含 PPTX 下载链接的响应
    """
    # 验证输入：必须提供 file_path 或 file_url 之一
    if not request.file_path and not request.file_url:
        raise HTTPException(
            status_code=400, 
            detail="必须提供 file_path 或 file_url 参数"
        )
    
    try:
        date_str = datetime.now().strftime("%Y-%m-%d")
        file_uuid = str(uuid_lib.uuid4())
        
        # 如果提供的是 URL，先下载图片
        if request.file_url:
            logger.info(f"[GPU OCR Full] 从 URL 下载图片: {request.file_url}")
            
            # 下载图片
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(request.file_url)
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"下载图片失败: HTTP {response.status_code}"
                    )
                image_data = response.content
            
            # 确定文件扩展名
            content_type = response.headers.get("content-type", "image/png")
            ext = mimetypes.guess_extension(content_type) or ".png"
            if ext == ".jpe":
                ext = ".jpg"
            
            # 保存到本地
            save_dir = INPUT_DIR / date_str
            save_dir.mkdir(parents=True, exist_ok=True)
            filename = f"{file_uuid}{ext}"
            input_file_path = save_dir / filename
            
            with open(input_file_path, "wb") as f:
                f.write(image_data)
            
            logger.info(f"[GPU OCR Full] 图片已保存: {input_file_path}")
            
            # 保存原始 URL 用于 LLM（可直接使用公开 URL）
            original_image_url = request.file_url
        else:
            # 使用本地文件路径
            input_file_path = BASE_DIR / request.file_path
            original_image_url = None
            
            if not input_file_path.exists():
                raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")
            
            if not input_file_path.is_file():
                raise HTTPException(status_code=400, detail=f"路径不是文件: {request.file_path}")
            
            # 从路径提取日期和 UUID
            path_parts = Path(request.file_path).parts
            if len(path_parts) >= 3:
                date_str = path_parts[1]
                file_name = path_parts[2]
                file_uuid = file_name.split('.')[0]
        
        # 构建输出路径
        output_dir = OUTPUT_DIR / date_str / file_uuid
        output_dir.mkdir(parents=True, exist_ok=True)
        
        backend = request.backend or GPU_OCR_BACKEND
        
        logger.info(f"[GPU OCR Full] 开始处理: {input_file_path}")
        logger.info(f"[GPU OCR Full] 后端: {backend}")
        
        # Step 1: GPU OCR
        ocr_result = await run_mineru_gpu(
            str(input_file_path),
            str(output_dir),
            backend=backend,
            lang=request.lang,
            enable_table=request.enable_table,
            enable_formula=request.enable_formula,
        )
        
        logger.info(f"[GPU OCR Full] OCR 完成")
        
        # Step 2: 简化文件命名
        rename_mapping = simplify_ocr_output(output_dir)
        logger.info(f"[GPU OCR Full] 重命名 {len(rename_mapping)} 个图片")
        
        # Step 3: 查找 OCR 输出文件
        # VLM 后端输出结构: output/{date}/{uuid}/{filename}/vlm/{filename}.md
        input_filename = input_file_path.stem
        vlm_dir = output_dir / input_filename / "vlm"
        md_path = vlm_dir / f"{input_filename}.md"
        json_path = vlm_dir / f"{input_filename}_middle.json"
        
        if not md_path.exists():
            # 尝试其他可能的路径结构
            possible_dirs = list(output_dir.rglob("*.md"))
            if possible_dirs:
                md_path = possible_dirs[0]
                vlm_dir = md_path.parent
                json_path = vlm_dir / md_path.name.replace(".md", "_middle.json")
            else:
                raise FileNotFoundError(f"OCR Markdown 文件不存在")
        
        if not json_path.exists():
            raise FileNotFoundError(f"OCR JSON 文件不存在: {json_path}")
        
        # 读取系统提示词
        system_prompt_path = BASE_DIR / "system_prompt.md"
        if system_prompt_path.exists():
            system_prompt = system_prompt_path.read_text(encoding="utf-8").strip()
        else:
            system_prompt = "You are an AI assistant that generates HTML slides."
        
        # 读取 Markdown 和 JSON
        md_text = md_path.read_text(encoding="utf-8")
        layout_json = json.load(open(json_path, "r", encoding="utf-8"))
        
        # 准备图片 URL 给 LLM
        # 如果有原始公开 URL，直接使用（更快，节省 token）
        # 否则读取本地文件并编码为 base64
        if original_image_url:
            image_url_for_llm = original_image_url
            logger.info(f"[GPU OCR Full] 使用公开 URL 发送给 LLM")
        else:
            with open(input_file_path, "rb") as img_file:
                image_data = img_file.read()
                base64_image = base64.b64encode(image_data).decode('utf-8')
            
            content_type, _ = mimetypes.guess_type(str(input_file_path))
            if not content_type:
                content_type = "image/png"
            image_url_for_llm = f"data:{content_type};base64,{base64_image}"
        
        # 构建消息
        messages = build_slide_messages(system_prompt, md_text, layout_json, image_url_for_llm)
        
        # Step 4: 调用 LLM 生成 HTML
        logger.info(f"[GPU OCR Full] 开始生成 HTML...")
        
        model = request.model or DEFAULT_MODEL
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 16000,
        }
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": HTTP_REFERER,
            "X-Title": "ReDeck GPU OCR",
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"LLM API 错误: {response.text}")
            
            result = response.json()
            html_content = result["choices"][0]["message"]["content"]
            usage = result.get("usage", {})
        
        # 清理和处理 HTML
        cleaned_html = clean_html_from_markdown_code_block(html_content)
        final_html = replace_html_image_paths(cleaned_html, date_str, file_uuid)
        
        # 保存 HTML 文件
        html_file_path = vlm_dir / f"{file_uuid}.html"
        html_file_path.write_text(final_html, encoding="utf-8")
        html_relative_path = str(html_file_path.relative_to(BASE_DIR)).replace("\\", "/")
        
        logger.info(f"[GPU OCR Full] HTML 生成完成: {html_relative_path}")
        
        # Step 5: 转换为 PPTX
        logger.info(f"[GPU OCR Full] 开始转换 PPTX...")
        
        output_pptx_path = vlm_dir / f"{file_uuid}.pptx"
        scripts_dir = BASE_DIR / "scripts"
        converter_script = scripts_dir / "convert-html-to-pptx.js"
        
        if not converter_script.exists():
            raise HTTPException(status_code=500, detail="PPTX 转换脚本不存在")
        
        cmd = [
            "node",
            str(converter_script),
            str(html_file_path),
            str(output_pptx_path),
            "--tmp-dir", str(TEMP_DIR)
        ]
        
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            cwd=str(scripts_dir),
            timeout=120
        )
        
        if process.returncode != 0:
            stderr = process.stderr or process.stdout or "转换失败"
            logger.error(f"[GPU OCR Full] PPTX 转换失败: {stderr}")
            raise HTTPException(status_code=500, detail=f"PPTX 转换失败: {stderr[:500]}")
        
        if not output_pptx_path.exists():
            raise HTTPException(status_code=500, detail="PPTX 文件生成失败")
        
        # 上传到 R2 并获取公开链接
        pptx_relative_path = str(output_pptx_path.relative_to(BASE_DIR)).replace("\\", "/")
        try:
            download_url = upload_pptx_to_r2(output_pptx_path, date_str, file_uuid)
            logger.info(f"[GPU OCR Full] PPTX 已上传到 R2: {download_url}")
        except Exception as e:
            logger.warning(f"[GPU OCR Full] R2 上传失败，使用本地链接: {e}")
            download_url = f"{STATIC_BASE_URL.rstrip('/')}/static/{pptx_relative_path}"
        
        logger.info(f"[GPU OCR Full] PPTX 生成完成: {download_url}")
        
        response_data = {
            "success": True,
            "message": "GPU OCR 一键处理完成",
            "file_uuid": file_uuid,
            "date": date_str,
            "backend": backend,
            "html_file_path": html_relative_path,
            "pptx_file_path": pptx_relative_path,
            "download_url": download_url,
            "model": model,
            "usage": usage,
            "renamed_images": len(rename_mapping)
        }
        
        # 如果是通过 URL 输入的，返回保存的本地路径
        if request.file_url:
            response_data["source_url"] = request.file_url
            response_data["saved_file_path"] = str(input_file_path.relative_to(BASE_DIR)).replace("\\", "/")
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GPU OCR Full] 处理失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"GPU OCR 处理失败: {str(e)}")


async def run_mineru_gpu(
    input_path: str,
    output_path: str,
    backend: str = "vlm-transformers",
    lang: str = "ch",
    enable_table: bool = False,
    enable_formula: bool = False,
) -> dict:
    """
    使用 GPU 加速运行 MinerU OCR（VLM 后端）
    
    Args:
        input_path: 输入文件路径
        output_path: 输出目录路径
        backend: OCR 后端类型
        lang: OCR 语言
        enable_table: 是否启用表格解析
        enable_formula: 是否启用公式解析
        
    Returns:
        处理结果字典
    """
    import asyncio
    
    mineru_path = shutil.which(MINERU_CMD)
    if not mineru_path:
        raise FileNotFoundError(
            "MinerU 未安装。请运行:\n"
            "  pip install 'mineru[vlm-vllm-engine]'\n"
            "或参考文档: https://opendatalab.github.io/MinerU/"
        )
    
    # 设置环境变量使用本地模型
    env = os.environ.copy()
    env["MINERU_MODEL_SOURCE"] = MINERU_MODEL_SOURCE
    
    # 构建命令
    cmd = [
        mineru_path,
        "-p", input_path,
        "-o", output_path,
        "-b", backend,
        "-l", lang,
    ]
    
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
            env=env,
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=600  # 10 分钟超时
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


async def run_mineru(input_path: str, output_path: str) -> dict:
    """
    运行 mineru 命令进行 OCR 识别
    
    Args:
        input_path: 输入文件或目录路径
        output_path: 输出目录路径
        
    Returns:
        处理结果信息
    """
    import shutil
    mineru_path = shutil.which(MINERU_CMD)
    if not mineru_path:
        raise FileNotFoundError(f"MinerU 命令未找到，请确保已安装并在 PATH 中: {MINERU_CMD}")
    
    # 构建命令
    # 关闭表格和公式解析，因为：
    # 1. html2pptx.js 暂不支持 <table> 元素转换
    # 2. 公式解析会生成额外的图片文件，增加 LLM 处理复杂度
    cmd = [
        mineru_path,
        "-p", input_path,
        "-o", output_path,
        "-t", "false",  # 关闭表格解析
        "-f", "false",  # 关闭公式解析
        "-l", "ch",     # l, --lang [ch|ch_server|ch_lite|en|korean|japan|chinese_cht|ta|te|ka|th|el|latin|arabic|east_slavic|cyrillic|devanagari]
    ]
    
    try:
        # 执行命令（指定 UTF-8 编码避免 Windows GBK 编码问题）
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',  # 遇到无法解码的字符时替换而不是报错
            cwd=str(BASE_DIR),
            timeout=300  # 5分钟超时
        )
        
        if process.returncode != 0:
            raise RuntimeError(
                f"MinerU 执行失败 (返回码: {process.returncode})\n"
                f"错误输出: {process.stderr or '无错误输出'}"
            )
        
        # 检查输出目录中的文件
        output_path_obj = Path(output_path)
        output_files = []
        if output_path_obj.exists():
            for file in output_path_obj.rglob("*"):
                if file.is_file():
                    output_files.append(str(file.relative_to(output_path_obj)))
        
        return {
            "return_code": process.returncode,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "output_files": output_files
        }
    
    except subprocess.TimeoutExpired:
        raise RuntimeError("MinerU 处理超时（超过5分钟）")
    except Exception as e:
        raise RuntimeError(f"执行 MinerU 时出错: {str(e)}")


def simplify_ocr_output(output_dir: Path) -> dict:
    """
    简化 MinerU OCR 输出的文件命名
    将 64 字符 hash 文件名重命名为简洁的序号格式（img_01.jpg）
    
    这样做的好处：
    1. 减少 LLM 的 token 消耗（从 ~80 tokens 降到 ~15 tokens）
    2. 降低 LLM 复制文件名时出错的概率
    3. 提高可读性和可维护性
    
    Args:
        output_dir: OCR 输出目录，如 output/2025-12-02/uuid
        
    Returns:
        重命名映射表 {old_name: new_name}
    """
    # 查找 auto 目录（MinerU 输出结构：uuid/uuid/auto/）
    auto_dirs = list(output_dir.rglob("auto"))
    if not auto_dirs:
        logger.info(f"未找到 auto 目录: {output_dir}")
        return {}
    
    auto_dir = auto_dirs[0]
    images_dir = auto_dir / "images"
    
    if not images_dir.exists():
        logger.info(f"未找到 images 目录: {auto_dir}")
        return {}
    
    # 1. 重命名图片文件
    mapping = {}
    image_files = sorted(images_dir.glob("*.jpg")) + sorted(images_dir.glob("*.png"))
    
    for i, img_file in enumerate(image_files, 1):
        old_name = img_file.name
        # 跳过已经是简化命名的文件
        if old_name.startswith("img_"):
            continue
        
        new_name = f"img_{i:02d}{img_file.suffix}"  # img_01.jpg, img_02.png
        new_path = images_dir / new_name
        
        # 避免覆盖已存在的文件
        if new_path.exists() and new_path != img_file:
            continue
        
        try:
            img_file.rename(new_path)
            mapping[old_name] = new_name
            logger.info(f"重命名图片: {old_name[:16]}...{old_name[-8:]} → {new_name}")
        except Exception as e:
            logger.warning(f"重命名失败: {old_name}, 错误: {e}")
    
    if not mapping:
        return {}
    
    # 2. 更新 Markdown 文件中的引用
    for md_file in auto_dir.glob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            original_content = content
            for old_name, new_name in mapping.items():
                content = content.replace(old_name, new_name)
            if content != original_content:
                md_file.write_text(content, encoding="utf-8")
                logger.info(f"更新 Markdown 引用: {md_file.name}")
        except Exception as e:
            logger.warning(f"更新 Markdown 失败: {md_file.name}, 错误: {e}")
    
    # 3. 更新 JSON 文件中的引用（_middle.json, _content_list.json 等）
    for json_file in auto_dir.glob("*.json"):
        try:
            content = json_file.read_text(encoding="utf-8")
            original_content = content
            for old_name, new_name in mapping.items():
                content = content.replace(old_name, new_name)
            if content != original_content:
                json_file.write_text(content, encoding="utf-8")
                logger.info(f"更新 JSON 引用: {json_file.name}")
        except Exception as e:
            logger.warning(f"更新 JSON 失败: {json_file.name}, 错误: {e}")
    
    logger.info(f"文件命名简化完成，共重命名 {len(mapping)} 个图片")
    return mapping


def parse_image_path(image_path: str) -> dict:
    """
    从 image_path 提取日期和 UUID
    
    Args:
        image_path: 图片路径，格式: input/YYYY-MM-DD/UUID.ext
        
    Returns:
        包含 date_str 和 uuid 的字典
    """
    path_parts = Path(image_path).parts
    if len(path_parts) >= 3:
        date_str = path_parts[1]  # YYYY-MM-DD
        file_name = path_parts[2]  # UUID.ext
        file_uuid = file_name.split('.')[0]  # 提取 UUID
        return {"date_str": date_str, "uuid": file_uuid}
    else:
        raise ValueError(f"图片路径格式不正确: {image_path}，期望格式: input/YYYY-MM-DD/UUID.ext")


def find_ocr_files(base_dir: Path, date_str: str, uuid: str) -> dict:
    """
    查找对应的 markdown 和 JSON 文件
    
    支持两种路径结构:
    1. output/{date}/{uuid}/auto/{uuid}.md (用户说的)
    2. output/{date}/{uuid}/{uuid}/auto/{uuid}.md (实际 mineru 输出)
    
    Args:
        base_dir: 基础目录 (BASE_DIR)
        date_str: 日期字符串 (YYYY-MM-DD)
        uuid: UUID 字符串
        
    Returns:
        包含 md_path, json_path, image_path 的字典
        
    Raises:
        FileNotFoundError: 如果必需文件不存在
    """
    output_dir = base_dir / "output" / date_str / uuid
    
    # 尝试两种路径结构
    possible_md_paths = [
        output_dir / "auto" / f"{uuid}.md",  # 用户说的结构
        output_dir / uuid / "auto" / f"{uuid}.md",  # 实际 mineru 输出结构
    ]
    
    possible_json_paths = [
        output_dir / "auto" / f"{uuid}_middle.json",  # 用户说的结构
        output_dir / uuid / "auto" / f"{uuid}_middle.json",  # 实际 mineru 输出结构
    ]
    
    md_path = None
    json_path = None
    
    # 查找 markdown 文件
    for path in possible_md_paths:
        if path.exists() and path.is_file():
            md_path = path
            break
    
    # 查找 JSON 文件
    for path in possible_json_paths:
        if path.exists() and path.is_file():
            json_path = path
            break
    
    # 验证必需文件是否存在
    if not md_path:
        raise FileNotFoundError(
            f"Markdown 文件不存在。尝试的路径: {[str(p) for p in possible_md_paths]}"
        )
    
    if not json_path:
        raise FileNotFoundError(
            f"JSON 文件不存在。尝试的路径: {[str(p) for p in possible_json_paths]}"
        )
    
    # 查找原始图片
    image_path = base_dir / "input" / date_str / f"{uuid}.png"
    if not image_path.exists():
        # 尝试其他扩展名
        for ext in [".jpg", ".jpeg", ".png", ".webp"]:
            test_path = base_dir / "input" / date_str / f"{uuid}{ext}"
            if test_path.exists():
                image_path = test_path
                break
        else:
            raise FileNotFoundError(f"原始图片文件不存在: {image_path}")
    
    return {
        "md_path": md_path,
        "json_path": json_path,
        "image_path": image_path
    }


def clean_html_from_markdown_code_block(html_content: str) -> str:
    """
    从 markdown 代码块中提取纯 HTML 内容，并移除 LLM 生成的前置/后置解释文字
    
    Args:
        html_content: 可能包含 markdown 代码块标记和 LLM 解释文字的 HTML 内容
        
    Returns:
        清理后的纯 HTML 内容
    """
    # 移除开头的 ```html 或 ``` 标记
    html_content = re.sub(r'^```html\s*\n?', '', html_content, flags=re.MULTILINE)
    html_content = re.sub(r'^```\s*\n?', '', html_content, flags=re.MULTILINE)
    
    # 移除结尾的 ``` 标记
    html_content = re.sub(r'\n?```\s*$', '', html_content, flags=re.MULTILINE)
    
    # 查找 HTML 文档的真正开始位置（<!DOCTYPE 或 <html）
    # 这会移除 LLM 在 HTML 前添加的解释性文字
    doctype_match = re.search(r'<!DOCTYPE\s+html[^>]*>', html_content, re.IGNORECASE)
    html_tag_match = re.search(r'<html[^>]*>', html_content, re.IGNORECASE)
    
    start_pos = 0
    if doctype_match:
        start_pos = doctype_match.start()
    elif html_tag_match:
        start_pos = html_tag_match.start()
    
    # 查找 HTML 文档的结束位置（</html>）
    html_end_match = re.search(r'</html\s*>', html_content, re.IGNORECASE)
    end_pos = len(html_content)
    if html_end_match:
        end_pos = html_end_match.end()
    
    # 提取纯 HTML 内容
    if start_pos > 0 or end_pos < len(html_content):
        html_content = html_content[start_pos:end_pos]
    
    return html_content.strip()


def replace_html_image_paths(html_content: str, date_str: str, uuid: str) -> str:
    """
    将 HTML 中的图片路径替换为可通过 HTTP 访问的路径
    
    处理三种情况：
    1. 相对路径：images/xxx.jpg -> {STATIC_BASE_URL}/static/output/date/uuid/uuid/auto/images/xxx.jpg
    2. 绝对路径：F:\\...\\images\\xxx.jpg -> {STATIC_BASE_URL}/static/output/date/uuid/uuid/auto/images/xxx.jpg
    3. 直接文件名：img_01.jpg -> {STATIC_BASE_URL}/static/output/date/uuid/uuid/auto/images/img_01.jpg
    
    Args:
        html_content: HTML 内容
        date_str: 日期字符串 (YYYY-MM-DD)
        uuid: UUID 字符串
        
    Returns:
        替换后的 HTML 内容
    """
    # 匹配 HTML 中的图片路径
    # 情况1: src="images/xxx.jpg" 或 src='images/xxx.jpg'
    pattern1 = r'src=["\']images/([^"\']+)["\']'
    
    # 情况2: src="F:\...\images\xxx.jpg" 或 src="output/.../images/xxx.jpg" (绝对路径或完整相对路径)
    pattern2 = r'src=["\']([^"\']*[/\\])images/([^"\']+)["\']'
    
    # 情况3: src="img_01.jpg" 或 src="img_02.png" (直接文件名，无 images/ 前缀)
    # 匹配 img_XX.ext 格式，避免匹配已经是完整 URL 的情况
    pattern3 = r'src=["\'](?!http|/|images/)(img_\d+\.(jpg|jpeg|png|webp|gif))["\']'
    
    def replace_relative_image(match):
        image_filename = match.group(1)
        # 构建 HTTP 可访问的绝对路径（带协议和主机）
        http_path = f"{STATIC_BASE_URL.rstrip('/')}/static/output/{date_str}/{uuid}/{uuid}/auto/images/{image_filename}"
        logger.info(f"替换相对图片路径: images/{image_filename} -> {http_path}")
        return f'src="{http_path}"'
    
    def replace_absolute_image(match):
        image_filename = match.group(2)
        # 构建 HTTP 可访问的绝对路径（带协议和主机）
        http_path = f"{STATIC_BASE_URL.rstrip('/')}/static/output/{date_str}/{uuid}/{uuid}/auto/images/{image_filename}"
        logger.info(f"替换绝对/完整图片路径: {match.group(0)} -> {http_path}")
        return f'src="{http_path}"'
    
    def replace_direct_image(match):
        image_filename = match.group(1)
        # 构建 HTTP 可访问的绝对路径（带协议和主机）
        http_path = f"{STATIC_BASE_URL.rstrip('/')}/static/output/{date_str}/{uuid}/{uuid}/auto/images/{image_filename}"
        logger.info(f"替换直接图片引用: {image_filename} -> {http_path}")
        return f'src="{http_path}"'
    
    # 先处理绝对路径或完整路径（包含 images/ 的路径）
    result = re.sub(pattern2, replace_absolute_image, html_content)
    # 再处理简单的相对路径
    result = re.sub(pattern1, replace_relative_image, result)
    # 最后处理直接文件名（img_XX.ext 格式）
    result = re.sub(pattern3, replace_direct_image, result)
    
    return result


def build_slide_messages(
    system_prompt: str,
    md_text: str,
    layout_json: dict,
    image_data_url: str
) -> list:
    """
    构建 OpenRouter API 的 messages
    
    Args:
        system_prompt: 系统提示词
        md_text: Markdown 文本内容
        layout_json: 布局 JSON 数据
        image_data_url: base64 编码的图片 data URL
        
    Returns:
        messages 列表
    """
    # 将 JSON 格式化为字符串
    layout_json_str = json.dumps(layout_json, ensure_ascii=False, indent=2)
    
    # 构建用户消息内容（按照 OpenRouter 文档建议：文本在前，图片在后）
    user_content = [
        {
            "type": "text",
            "text": (
                "Please analyze this slide image and, using the markdown content and layout JSON (positioning), "
                "generate a single HTML slide that follows the system instructions.\n\n"
                "The HTML should be a complete, standalone HTML document that can be displayed in a browser."
            )
        },
        {
            "type": "text",
            "text": f"Content markdown:\n\n```markdown\n{md_text}\n```"
        },
        {
            "type": "text",
            "text": f"Layout JSON:\n\n```json\n{layout_json_str}\n```"
        },
        {
            "type": "image_url",
            "image_url": {
                "url": image_data_url
            }
        }
    ]
    
    return [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": user_content
        }
    ]


@app.post("/slides/preview-prompt")
async def preview_slide_prompt(request: SlidePromptPreviewRequest):
    """
    预览生成 Slides 的完整 Prompt
    
    返回拼接后的提示词，包括系统提示词、Markdown、Layout JSON 和用户消息。
    用于在前端预览，不会调用 LLM。
    
    Args:
        request: 包含图片路径的请求
        
    Returns:
        拼接后的各部分提示词内容
    """
    # 解析图片路径，提取日期和 UUID
    try:
        path_info = parse_image_path(request.image_path)
        date_str = path_info["date_str"]
        file_uuid = path_info["uuid"]
    except ValueError as e:
        error_msg = f"图片路径解析失败: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    logger.info(f"预览 Prompt - 图片路径: {request.image_path}, 日期: {date_str}, UUID: {file_uuid}")
    
    try:
        # 查找 OCR 文件
        try:
            ocr_files = find_ocr_files(BASE_DIR, date_str, file_uuid)
            md_path = ocr_files["md_path"]
            json_path = ocr_files["json_path"]
        except FileNotFoundError as e:
            error_msg = f"OCR 文件不存在: {str(e)}。请先完成 OCR 识别。"
            logger.error(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        # 读取系统提示词
        system_prompt_path = BASE_DIR / "system_prompt.md"
        if system_prompt_path.exists():
            with open(system_prompt_path, "r", encoding="utf-8") as f:
                system_prompt = f.read().strip()
        else:
            system_prompt = (
                "You are an AI assistant that generates HTML slides from images, markdown content, and layout information. "
                "Create beautiful, responsive HTML slides that accurately represent the content and layout of the input."
            )
        
        # 读取 Markdown 文件
        try:
            with open(md_path, "r", encoding="utf-8") as f:
                md_text = f.read()
        except Exception as e:
            error_msg = f"读取 Markdown 文件失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        
        # 读取 JSON 文件
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                layout_json = json.load(f)
        except json.JSONDecodeError as e:
            error_msg = f"JSON 文件解析失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
        except Exception as e:
            error_msg = f"读取 JSON 文件失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        
        # 格式化 JSON
        layout_json_str = json.dumps(layout_json, ensure_ascii=False, indent=2)
        
        # 用户消息模板
        user_instruction = (
            "Please analyze this slide image and, using the markdown content and layout JSON (positioning), "
            "generate a single HTML slide that follows the system instructions.\n\n"
            "The HTML should be a complete, standalone HTML document that can be displayed in a browser."
        )
        
        # 返回各部分内容
        return JSONResponse(content={
            "success": True,
            "prompt_parts": {
                "system_prompt": {
                    "title": "系统提示词 (System Prompt)",
                    "content": system_prompt,
                    "char_count": len(system_prompt)
                },
                "user_instruction": {
                    "title": "用户指令 (User Instruction)",
                    "content": user_instruction,
                    "char_count": len(user_instruction)
                },
                "markdown_content": {
                    "title": "Markdown 内容 (OCR 识别结果)",
                    "content": md_text,
                    "char_count": len(md_text),
                    "source_file": str(md_path.relative_to(BASE_DIR))
                },
                "layout_json": {
                    "title": "布局 JSON (位置信息)",
                    "content": layout_json_str,
                    "char_count": len(layout_json_str),
                    "source_file": str(json_path.relative_to(BASE_DIR))
                },
                "image_note": {
                    "title": "图片 (Base64 编码)",
                    "content": "[图片将以 Base64 格式发送给模型]",
                    "char_count": 0,
                    "note": "实际调用时图片会被编码为 Base64 并作为 image_url 发送"
                }
            },
            "total_text_chars": len(system_prompt) + len(user_instruction) + len(md_text) + len(layout_json_str),
            "image_path": request.image_path
        })
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"预览 Prompt 失败: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/slides/html")
async def generate_slide_html(request: SlideHtmlRequest):
    """
    生成 HTML Slides
    
    根据上传的图片路径，查找对应的 OCR 结果（markdown 和 JSON），
    结合系统提示词和图片，调用 OpenRouter API 生成 HTML Slides。
    
    Args:
        request: 包含图片路径和模型名称的请求
        
    Returns:
        生成的 HTML 代码和相关信息
    """
    if not OPENROUTER_API_KEY:
        error_msg = "OpenRouter API Key 未配置，请设置环境变量 OPENROUTER_API_KEY"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    
    # 解析图片路径，提取日期和 UUID
    try:
        path_info = parse_image_path(request.image_path)
        date_str = path_info["date_str"]
        file_uuid = path_info["uuid"]
    except ValueError as e:
        error_msg = f"图片路径解析失败: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    logger.info(f"生成 Slides HTML - 图片路径: {request.image_path}, 日期: {date_str}, UUID: {file_uuid}")
    
    try:
        # 查找 OCR 文件（markdown 和 JSON）
        try:
            ocr_files = find_ocr_files(BASE_DIR, date_str, file_uuid)
            md_path = ocr_files["md_path"]
            json_path = ocr_files["json_path"]
            image_path = ocr_files["image_path"]
        except FileNotFoundError as e:
            error_msg = f"OCR 文件不存在: {str(e)}。请先完成 OCR 识别。"
            logger.error(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        logger.info(f"找到 OCR 文件 - Markdown: {md_path.relative_to(BASE_DIR)}, JSON: {json_path.relative_to(BASE_DIR)}")
        
        # 读取系统提示词
        system_prompt_path = BASE_DIR / "system_prompt.md"
        if system_prompt_path.exists():
            with open(system_prompt_path, "r", encoding="utf-8") as f:
                system_prompt = f.read().strip()
        else:
            system_prompt = (
                "You are an AI assistant that generates HTML slides from images, markdown content, and layout information. "
                "Create beautiful, responsive HTML slides that accurately represent the content and layout of the input."
            )
            logger.warning("system_prompt.md 不存在，使用默认系统提示词")
        
        # 读取 Markdown 文件
        try:
            with open(md_path, "r", encoding="utf-8") as f:
                md_text = f.read()
        except Exception as e:
            error_msg = f"读取 Markdown 文件失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        
        # 读取 JSON 文件
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                layout_json = json.load(f)
        except json.JSONDecodeError as e:
            error_msg = f"JSON 文件解析失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
        except Exception as e:
            error_msg = f"读取 JSON 文件失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        
        # 读取并编码图片为 base64
        try:
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                base64_image = base64.b64encode(image_data).decode('utf-8')
            
            content_type, _ = mimetypes.guess_type(str(image_path))
            if not content_type:
                content_type = "image/png"
            data_url = f"data:{content_type};base64,{base64_image}"
        except Exception as e:
            error_msg = f"读取或编码图片失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        
        # 构建 OpenRouter API 请求消息
        messages = build_slide_messages(system_prompt, md_text, layout_json, data_url)
        
        # 使用环境变量配置的默认模型，也可通过请求参数覆盖
        model = request.model or DEFAULT_MODEL
        
        logger.info(f"准备调用 OpenRouter API - 模型: {model}")
        logger.info(f"系统提示词长度: {len(system_prompt)} 字符")
        logger.info(f"Markdown 长度: {len(md_text)} 字符")
        logger.info(f"JSON 大小: {len(json.dumps(layout_json))} 字符")
        
        # 准备请求数据
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 16000,  # 大幅增加到 16K，匹配大模型的输出能力
        }
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": HTTP_REFERER,
            "X-Title": "ReDeck API",
        }
        
        # 调用 OpenRouter API
        logger.info(f"正在调用 OpenRouter API 生成 HTML: {OPENROUTER_API_URL}")
        async with httpx.AsyncClient(timeout=120.0) as client:  # 增加超时时间到 120 秒
            response = await client.post(
                OPENROUTER_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code != 200:
                error_text = response.text
                error_msg = f"OpenRouter API 错误 (状态码: {response.status_code}): {error_text}"
                logger.error(error_msg)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_msg
                )
            
            result = response.json()
            
            # 提取响应内容（HTML）
            assistant_message = result["choices"][0]["message"]["content"]
            usage = result.get("usage", {})
            
            # 检查是否因 token 限制而截断
            completion_tokens = usage.get("completion_tokens", 0)
            if completion_tokens >= 15000:  # 接近 16K 限制
                logger.warning(f"⚠️ 警告：输出 tokens ({completion_tokens}) 接近上限，可能被截断！")
                logger.warning(f"建议：1) 使用更大输出能力的模型，2) 简化系统提示词")
            
            # 清理 markdown 代码块标记（如果存在）
            cleaned_html = clean_html_from_markdown_code_block(assistant_message)
            
            # 替换图片路径为完整路径
            final_html = replace_html_image_paths(cleaned_html, date_str, file_uuid)
            
            # 保存 HTML 文件到输出目录
            html_file_path = md_path.parent / f"{file_uuid}.html"
            try:
                with open(html_file_path, "w", encoding="utf-8") as f:
                    f.write(final_html)
                html_file_relative_path = str(html_file_path.relative_to(BASE_DIR)).replace("\\", "/")
                logger.info(f"HTML 文件已保存: {html_file_relative_path}")
            except Exception as e:
                logger.warning(f"保存 HTML 文件失败: {str(e)}")
                html_file_relative_path = None
            
            # 将完整的 HTML 内容写入单独的日志文件，避免主日志被截断
            html_log_file = LOG_DIR / f"html_{file_uuid}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
            html_log_file_name = None
            try:
                with open(html_log_file, "w", encoding="utf-8") as f:
                    f.write(f"=== HTML 生成日志 ===\n")
                    f.write(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write(f"模型: {model}\n")
                    f.write(f"图片路径: {request.image_path}\n")
                    f.write(f"HTML 长度: {len(final_html)} 字符\n")
                    f.write(f"Token 使用情况: {usage}\n")
                    f.write(f"HTML 文件路径: {html_file_relative_path}\n")
                    f.write(f"\n=== 生成的 HTML 内容 ===\n")
                    f.write(final_html)
                    f.write(f"\n=== HTML 内容结束 ===\n")
                html_log_file_name = html_log_file.name
                logger.info(f"完整 HTML 内容已保存到日志文件: {html_log_file_name}")
            except Exception as e:
                logger.warning(f"保存 HTML 日志文件失败: {str(e)}")
            
            logger.info(f"HTML 生成成功 - 模型: {model}, HTML 长度: {len(final_html)} 字符")
            logger.info(f"Token 使用情况: {usage}")
            if html_log_file_name:
                logger.info(f"HTML 内容已保存到文件: {html_file_relative_path}，完整内容见日志文件: {html_log_file_name}")
            else:
                logger.info(f"HTML 内容已保存到文件: {html_file_relative_path}")
            
            response_data = {
                "success": True,
                "message": "HTML Slides 生成成功",
                "html": final_html,
                "model": model,
                "image_path": str(request.image_path),
                "usage": usage
            }
            
            if html_file_relative_path:
                response_data["html_file_path"] = html_file_relative_path
            
            return JSONResponse(content=response_data)
    
    except httpx.TimeoutException:
        error_msg = "OpenRouter API 请求超时（超过120秒）"
        logger.error(error_msg)
        raise HTTPException(status_code=504, detail=error_msg)
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"生成 HTML Slides 失败: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/slides/pptx")
async def convert_html_to_pptx(request: SlidePptxRequest):
    """
    将 HTML 文件转换为 PPTX
    
    使用 html2pptx.js 脚本进行高质量转换，确保：
    - 精确的位置和尺寸
    - 支持形状、边框、阴影
    - 支持列表和富文本
    - 验证 HTML 规范
    
    Args:
        request: 包含 HTML 文件路径的请求体
        
    Returns:
        生成的 PPTX 文件路径和下载链接
    """
    # 构建完整的 HTML 文件路径
    html_file_path = BASE_DIR / request.html_file_path
    
    # 验证 HTML 文件是否存在
    if not html_file_path.exists():
        raise HTTPException(status_code=404, detail=f"HTML 文件不存在: {request.html_file_path}")
    
    if not html_file_path.is_file():
        raise HTTPException(status_code=400, detail=f"路径不是文件: {request.html_file_path}")
    
    if not str(html_file_path).endswith('.html'):
        raise HTTPException(status_code=400, detail=f"文件不是 HTML 格式: {request.html_file_path}")
    
    try:
        # 确定输出文件路径
        if request.output_filename:
            output_filename = request.output_filename
            if not output_filename.endswith('.pptx'):
                output_filename += '.pptx'
        else:
            output_filename = html_file_path.stem + '.pptx'
        
        output_file_path = html_file_path.parent / output_filename
        
        # Node.js 脚本路径
        scripts_dir = BASE_DIR / "scripts"
        converter_script = scripts_dir / "convert-html-to-pptx.js"
        
        if not converter_script.exists():
            raise HTTPException(
                status_code=500, 
                detail="转换脚本不存在。请确保 scripts/convert-html-to-pptx.js 已安装。"
            )
        
        # 构建命令
        cmd = [
            "node",
            str(converter_script),
            str(html_file_path),
            str(output_file_path),
            "--tmp-dir", str(TEMP_DIR)
        ]
        
        logger.info(f"执行 HTML → PPTX 转换: {' '.join(cmd)}")
        
        # 执行 Node.js 脚本（指定 UTF-8 编码避免 Windows GBK 编码问题）
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',  # 遇到无法解码的字符时替换而不是报错
            cwd=str(scripts_dir),
            timeout=120  # 2分钟超时
        )
        
        # 解析输出（添加空值检查）
        stdout = (process.stdout or '').strip()
        stderr = (process.stderr or '').strip()
        
        if process.returncode != 0:
            # 尝试解析错误信息
            error_detail = stderr or stdout or "转换失败"
            try:
                error_json = json.loads(stderr or stdout)
                error_detail = error_json.get('error', error_detail)
            except json.JSONDecodeError:
                pass
            
            logger.error(f"HTML → PPTX 转换失败: {error_detail}")
            raise HTTPException(
                status_code=500,
                detail=f"PPTX 转换失败: {error_detail}"
            )
        
        # 解析成功结果
        try:
            result = json.loads(stdout)
        except json.JSONDecodeError:
            result = {"success": True}
        
        # 验证输出文件存在
        if not output_file_path.exists():
            raise HTTPException(
                status_code=500,
                detail="PPTX 文件生成失败：输出文件不存在"
            )
        
        # 构建相对路径
        relative_path = str(output_file_path.relative_to(BASE_DIR)).replace("\\", "/")
        
        # 从路径中提取 date 和 uuid (格式: output/YYYY-MM-DD/uuid/...)
        path_parts = relative_path.split("/")
        if len(path_parts) >= 3 and path_parts[0] == "output":
            date_str = path_parts[1]
            file_uuid = path_parts[2]
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")
            file_uuid = str(uuid_lib.uuid4())
        
        # 上传到 R2 并获取公开链接
        try:
            download_url = upload_pptx_to_r2(output_file_path, date_str, file_uuid)
            logger.info(f"PPTX 已上传到 R2: {download_url}")
        except Exception as e:
            logger.warning(f"R2 上传失败，使用本地链接: {e}")
            download_url = f"{STATIC_BASE_URL.rstrip('/')}/static/{relative_path}"
        
        logger.info(f"PPTX 生成成功: {relative_path}")
        
        return JSONResponse(content={
            "success": True,
            "message": "PPTX 文件生成成功",
            "pptx_file_path": relative_path,
            "download_url": download_url,
            "placeholders": result.get("placeholders", [])
        })
        
    except subprocess.TimeoutExpired:
        error_msg = "PPTX 转换超时（超过2分钟）"
        logger.error(error_msg)
        raise HTTPException(status_code=504, detail=error_msg)
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"PPTX 转换失败: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)

