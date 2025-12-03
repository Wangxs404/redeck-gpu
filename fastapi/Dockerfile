# ReDeck FastAPI Backend
# Coolify 部署用 Dockerfile

FROM python:3.12-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .
COPY scripts/package.json ./scripts/

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 安装 Node.js 依赖
WORKDIR /app/scripts
RUN npm install --omit=dev

# 安装 Playwright 和 Chromium
RUN npx playwright install chromium --with-deps

# 回到应用目录
WORKDIR /app

# 复制应用代码
COPY . .

# 创建数据目录（会被 volume 覆盖）
RUN mkdir -p input output logs temp

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["python", "main.py"]
