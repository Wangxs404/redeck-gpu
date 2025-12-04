# Playwright PPTX 转换修复文档

## 问题描述

在 FastAPI 服务中调用 Playwright 进行 HTML 到 PPTX 转换时，出现以下错误：

```
browserType.launch: Target page, context or browser has been closed
browser.newPage: Target page, context or browser has been closed
```

## 根本原因

Chromium 浏览器需要访问临时目录用于共享内存，但 `--tmp-dir` 指定的目录不存在：

```
Unable to access(W_OK|X_OK) /home/ubuntu/app/redeck-gpu/fastapi/temp: No such file or directory
```

## 修复方案

### 1. main.py 修改

添加 `TEMP_DIR` 常量并确保启动时创建目录：

```python
# 临时目录配置
TEMP_DIR = BASE_DIR / "temp"

# 确保临时目录存在
TEMP_DIR.mkdir(parents=True, exist_ok=True)
```

更新所有 PPTX 转换调用，使用统一的临时目录路径：

```python
subprocess.run([
    "node", str(SCRIPTS_DIR / "convert-html-to-pptx.js"),
    "--html", html_file_path,
    "--output", pptx_path,
    "--tmp-dir", str(TEMP_DIR)  # 使用 TEMP_DIR 常量
], ...)
```

### 2. convert-html-to-pptx.js 修改

增加目录自动创建逻辑：

```javascript
// 确保临时目录存在
tmpDir = path.resolve(tmpDir);
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}
```

### 3. html2pptx.js 修改

添加 headless 模式和沙箱参数：

```javascript
const browser = await chromium.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
    ]
});
```

## 验证步骤

1. 重启 FastAPI 服务
2. 调用 `/ocr/process-gpu-full` 端点测试完整流程
3. 确认 PPTX 文件成功生成

## 相关文件

- `fastapi/main.py` - 主应用，TEMP_DIR 初始化
- `fastapi/scripts/convert-html-to-pptx.js` - PPTX 转换 CLI
- `fastapi/scripts/html2pptx.js` - Playwright 核心模块

## 环境要求

- Node.js v20+
- Playwright chromium 浏览器
- 系统依赖: xvfb, libnss3, libatk1.0-0 等
