# Coolify 部署 FastAPI 后端指南

## 架构说明

```
┌─────────────────────────────────────────────────────────────────┐
│                         Coolify                                  │
│  ┌─────────────────┐      ┌──────────────────────────────────┐  │
│  │   Traefik       │      │  FastAPI Container               │  │
│  │   反向代理       │ ───▶ │  - 端口: 8000                    │  │
│  │                 │      │  - 静态文件: /static/output/     │  │
│  └─────────────────┘      │  - PPTX 生成: pptxgenjs + 本地图片│  │
│         ▲                 └──────────────────────────────────┘  │
│         │                                                        │
└─────────│────────────────────────────────────────────────────────┘
          │
    HTTPS (443)
          │
    ┌─────┴─────┐
    │  客户端    │
    │ video2ppt │
    │   .com    │
    └───────────┘
```

## 关键配置

### 1. 环境变量

在 Coolify 的服务设置中添加以下环境变量：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `ENV` | `production` | 环境标识 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `PORT` | `8000` | 监听端口 |
| `STATIC_BASE_URL` | `https://api.video2ppt.com` | **关键!** 外部访问 URL |
| `ALLOWED_ORIGINS` | `https://video2ppt.com,http://localhost:3000` | CORS 允许的来源 |
| `HTTP_REFERER` | `https://video2ppt.com` | OpenRouter API 请求头 |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxx` | OpenRouter API Key |
| `MINERU_API_KEY` | `eyJxxx` | MinerU 云端 OCR Key |
| `DEFAULT_MODEL` | `google/gemini-2.5-flash` | 默认 LLM 模型 |

### 2. STATIC_BASE_URL 配置详解

这是最关键的配置，决定了：
- 前端下载 PPTX 文件的 URL
- HTML 中图片路径的生成

**配置原则：**
- 使用 Coolify 分配的外部访问 URL
- 必须是前端可以访问的地址
- 可以是 Coolify 自动分配的域名，也可以是自定义域名

**示例：**
```bash
# Coolify 自动分配的域名
STATIC_BASE_URL=https://fastapi-abc123.your-coolify-domain.com

# 自定义域名
STATIC_BASE_URL=https://api.video2ppt.com
```

### 3. 图片访问流程

```
1. FastAPI 生成 HTML
   └─ 图片 URL: https://api.video2ppt.com/static/output/2025-12-01/uuid/.../images/img_01.jpg

2. convert-html-to-pptx.js 预处理
   └─ 正则替换: https://xxx/static/output/... → images/img_01.jpg (本地相对路径)

3. Playwright 加载 HTML (file://)
   └─ 图片路径: images/img_01.jpg (相对于 HTML 文件)

4. pptxgenjs 生成 PPTX
   └─ 使用本地 file:// 路径读取图片，嵌入 PPTX
```

**重点：** pptxgenjs 不需要通过 HTTP 访问图片，而是使用本地文件路径。

## Dockerfile 示例

```dockerfile
FROM python:3.12-slim

# 安装 Node.js 和依赖
RUN apt-get update && apt-get install -y \
    nodejs npm \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# 设置 Playwright 环境变量
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# 复制项目文件
COPY . .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 安装 Node.js 依赖
WORKDIR /app/scripts
RUN npm install

WORKDIR /app

# 安装 Playwright 浏览器
RUN npx playwright install chromium --with-deps

EXPOSE 8000

CMD ["python", "main.py"]
```

## 常见问题

### Q1: pptxgenjs 报错 "Failed to fetch image"

**原因：** HTML 中的图片 URL 无法被 pptxgenjs 访问

**解决：** 
1. 确认 `convert-html-to-pptx.js` 正确替换了 URL 为本地路径
2. 检查日志中 `[preprocessHtml]` 的输出
3. 确认图片文件存在于 `output/.../images/` 目录

### Q2: CORS 错误

**原因：** `ALLOWED_ORIGINS` 未包含前端域名

**解决：**
```bash
ALLOWED_ORIGINS=https://video2ppt.com,https://www.video2ppt.com,http://localhost:3000
```

### Q3: 下载链接 404

**原因：** `STATIC_BASE_URL` 配置不正确

**解决：**
1. 确认 `STATIC_BASE_URL` 是 Coolify 分配的外部可访问 URL
2. 确认 Coolify 正确代理了 `/static/` 路径

### Q4: Playwright 启动失败

**原因：** 缺少浏览器或依赖

**解决：**
```bash
# 安装 Chromium 及其依赖
npx playwright install chromium --with-deps
```

## 验证部署

```bash
# 1. 健康检查
curl https://api.video2ppt.com/health

# 2. 检查静态文件服务
curl -I https://api.video2ppt.com/static/output/

# 3. 测试完整流程
curl -X POST https://api.video2ppt.com/ocr/process-cloud \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/slide.png"}'
```
