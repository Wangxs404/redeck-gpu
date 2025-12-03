"""
MinerU 云端 OCR API 集成模块

API: https://mineru.net/api/v4/extract/task

流程:
1. 提交 OCR 任务（传入公开图片 URL）
2. 轮询任务状态
3. 下载 ZIP 结果
4. 解压并转换为与本地 MinerU 相同的输出结构
"""

import os
import asyncio
import httpx
import zipfile
import shutil
import ssl
from pathlib import Path
from typing import Optional
import logging
import json

logger = logging.getLogger(__name__)

# SSL 验证控制（生产环境建议设置为 True，调试时可设为 False）
SSL_VERIFY = os.getenv("SSL_VERIFY", "false").lower() != "false"

# 配置
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "")
MINERU_API_BASE = "https://mineru.net/api/v4"


async def run_mineru_cloud(
    file_url: str,
    output_dir: Path,
    file_uuid: str,
    model_version: str = "vlm"
) -> dict:
    """
    使用 MinerU 云端 API 进行 OCR 识别
    
    Args:
        file_url: 图片的公开 URL
        output_dir: 输出目录路径（如 output/2025-12-02/uuid）
        file_uuid: 文件的 UUID（用于命名输出文件）
        model_version: 模型版本，默认 "vlm"
        
    Returns:
        与本地 run_mineru() 相同格式的结果字典
    """
    if not MINERU_API_KEY:
        raise ValueError("未配置 MINERU_API_KEY 环境变量")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MINERU_API_KEY}"
    }
    
    output_dir = Path(output_dir)
    
    # 如果 SSL 验证失败，可以通过环境变量 SSL_VERIFY=false 跳过验证
    logger.info(f"[云端OCR] SSL 验证: {SSL_VERIFY}")
    
    async with httpx.AsyncClient(timeout=300.0, verify=SSL_VERIFY) as client:
        # Step 1: 提交 OCR 任务
        logger.info(f"[云端OCR] 提交任务: {file_url}")
        
        task_payload = {
            "url": file_url,
            "model_version": model_version
        }
        
        task_res = await client.post(
            f"{MINERU_API_BASE}/extract/task",
            headers=headers,
            json=task_payload
        )
        
        if task_res.status_code != 200:
            raise RuntimeError(f"创建任务失败 (HTTP {task_res.status_code}): {task_res.text}")
        
        task_data = task_res.json()
        if task_data.get("code") != 0:
            raise RuntimeError(f"创建任务失败: {task_data.get('msg')}")
        
        task_id = task_data.get("data", {}).get("task_id")
        if not task_id:
            raise RuntimeError(f"响应缺少 task_id: {task_data}")
        
        logger.info(f"[云端OCR] 任务已创建: {task_id}")
        
        # Step 2: 轮询任务状态
        max_wait = 180  # 最长等待 180 秒
        poll_interval = 3  # 每 3 秒查询一次
        elapsed = 0
        zip_url = None
        
        while elapsed < max_wait:
            status_res = await client.get(
                f"{MINERU_API_BASE}/extract/task/{task_id}",
                headers=headers
            )
            
            status_data = status_res.json()
            state = status_data.get("data", {}).get("state")
            
            logger.info(f"[云端OCR] 任务状态: {state} ({elapsed}s)")
            
            if state == "done":
                zip_url = status_data.get("data", {}).get("full_zip_url")
                break
            elif state == "failed":
                error_msg = status_data.get("data", {}).get("err_msg", "未知错误")
                raise RuntimeError(f"OCR 任务失败: {error_msg}")
            
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
        
        if not zip_url:
            raise RuntimeError(f"OCR 任务超时（等待 {max_wait} 秒）")
        
        logger.info(f"[云端OCR] 任务完成，下载结果: {zip_url}")
        
        # Step 3: 下载 ZIP 文件
        zip_res = await client.get(zip_url)
        if zip_res.status_code != 200:
            raise RuntimeError(f"下载 ZIP 失败: {zip_res.status_code}")
        
        # 确保输出目录存在
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存 ZIP 到临时文件
        temp_zip_path = output_dir / "temp_result.zip"
        temp_zip_path.write_bytes(zip_res.content)
        
        logger.info(f"[云端OCR] ZIP 已下载: {temp_zip_path} ({len(zip_res.content)} bytes)")
        
        # Step 4: 解压并转换为本地格式
        temp_extract_dir = output_dir / "temp_extract"
        temp_extract_dir.mkdir(exist_ok=True)
        
        with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_extract_dir)
        
        # 创建与本地 MinerU 相同的目录结构: {uuid}/auto/
        auto_dir = output_dir / file_uuid / "auto"
        auto_dir.mkdir(parents=True, exist_ok=True)
        
        # 复制并重命名文件
        # full.md -> {uuid}.md
        src_md = temp_extract_dir / "full.md"
        if src_md.exists():
            dst_md = auto_dir / f"{file_uuid}.md"
            shutil.copy(src_md, dst_md)
            logger.info(f"[云端OCR] 复制 Markdown: {dst_md.name}")
        
        # layout.json -> {uuid}_middle.json
        src_json = temp_extract_dir / "layout.json"
        if src_json.exists():
            dst_json = auto_dir / f"{file_uuid}_middle.json"
            shutil.copy(src_json, dst_json)
            logger.info(f"[云端OCR] 复制布局 JSON: {dst_json.name}")
        
        # 复制 images 目录
        src_images = temp_extract_dir / "images"
        if src_images.exists() and src_images.is_dir():
            dst_images = auto_dir / "images"
            if dst_images.exists():
                shutil.rmtree(dst_images)
            shutil.copytree(src_images, dst_images)
            logger.info(f"[云端OCR] 复制图片目录: {len(list(dst_images.glob('*')))} 个文件")
        
        # 清理临时文件
        temp_zip_path.unlink()
        shutil.rmtree(temp_extract_dir)
        
        logger.info(f"[云端OCR] 结果已保存到: {auto_dir}")
        
        # 返回与本地 MinerU 相同格式的结果
        output_files = []
        for file in output_dir.rglob("*"):
            if file.is_file():
                output_files.append(str(file.relative_to(output_dir)))
        
        return {
            "return_code": 0,
            "stdout": f"云端 OCR 完成, task_id: {task_id}",
            "stderr": "",
            "output_files": output_files,
            "backend": "cloud",
            "task_id": task_id,
            "zip_url": zip_url
        }


async def check_cloud_api_status() -> dict:
    """
    检查云端 API 配置状态
    """
    return {
        "configured": bool(MINERU_API_KEY),
        "api_key_set": bool(MINERU_API_KEY),
        "api_base": MINERU_API_BASE
    }

