"""
Cloudflare R2 上传模块
用于将生成的 PPTX 文件上传到 R2 存储
"""

import os
import boto3
from botocore.config import Config
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# R2 配置
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "video2ppt")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")

# R2 endpoint
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else None


def get_r2_client():
    """获取 R2 客户端"""
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
        raise ValueError("R2 配置不完整，请检查环境变量")
    
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"}
        ),
        region_name="auto"
    )


def upload_file_to_r2(
    local_path: str | Path,
    r2_key: str = None,
    content_type: str = None
) -> str:
    """
    上传文件到 R2
    
    Args:
        local_path: 本地文件路径
        r2_key: R2 对象键名（默认使用文件名）
        content_type: 文件 MIME 类型
    
    Returns:
        公开访问 URL
    """
    local_path = Path(local_path)
    
    if not local_path.exists():
        raise FileNotFoundError(f"文件不存在: {local_path}")
    
    if r2_key is None:
        r2_key = local_path.name
    
    # 自动检测 content_type
    if content_type is None:
        suffix = local_path.suffix.lower()
        content_types = {
            ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".html": "text/html",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".pdf": "application/pdf",
        }
        content_type = content_types.get(suffix, "application/octet-stream")
    
    client = get_r2_client()
    
    logger.info(f"[R2] 上传文件: {local_path} -> {r2_key}")
    
    extra_args = {"ContentType": content_type}
    
    client.upload_file(
        str(local_path),
        R2_BUCKET_NAME,
        r2_key,
        ExtraArgs=extra_args
    )
    
    public_url = f"{R2_PUBLIC_URL}/{r2_key}"
    logger.info(f"[R2] 上传成功: {public_url}")
    
    return public_url


def upload_pptx_to_r2(local_path: str | Path, date_str: str, file_uuid: str) -> str:
    """
    上传 PPTX 文件到 R2，使用标准化的路径结构
    
    Args:
        local_path: 本地 PPTX 文件路径
        date_str: 日期字符串 (YYYY-MM-DD)
        file_uuid: 文件唯一标识
    
    Returns:
        公开访问 URL
    """
    local_path = Path(local_path)
    filename = local_path.name
    
    # R2 路径: pptx/{date}/{uuid}/{filename}
    r2_key = f"pptx/{date_str}/{file_uuid}/{filename}"
    
    return upload_file_to_r2(local_path, r2_key)


def check_r2_config() -> dict:
    """检查 R2 配置是否完整"""
    return {
        "configured": all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]),
        "account_id": R2_ACCOUNT_ID[:8] + "..." if R2_ACCOUNT_ID else None,
        "bucket": R2_BUCKET_NAME,
        "public_url": R2_PUBLIC_URL,
    }
