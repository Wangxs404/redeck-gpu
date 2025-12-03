# ReDeck API 接入指南

图片转 PowerPoint 演示文稿 API。

---

## 快速开始

```
1. 上传图片 → 2. OCR 识别（必须）→ 3. 生成 HTML → 4. 转换 PPTX → 5. 下载
```

**API 地址**: `http://your-server:8000`

> ⚠️ **重要**: OCR 识别步骤是**必须**的，跳过会导致生成失败。

---

## 接口说明

### 1. 上传图片

```http
POST /upload
Content-Type: multipart/form-data

file: <图片文件>
```

**响应**:
```json
{
  "status": "success",
  "file_path": "input/2025-12-02/uuid.png",
  "filename": "uuid.png"
}
```

---

### 2. OCR 识别（必须）

> ⚠️ 此步骤**必须调用**，否则生成 HTML 时会报错 "OCR 文件不存在"

```http
POST /ocr/process
Content-Type: application/json

{
  "file_path": "input/2025-12-02/uuid.png"
}
```

**响应**:
```json
{
  "success": true,
  "message": "MinerU 处理成功",
  "outputPath": "output/2025-12-02/uuid"
}
```

**注意**: 此步骤耗时较长（5-30秒），请等待完成后再调用下一步。

---

### 3. 生成 HTML

```http
POST /slides/html
Content-Type: application/json

{
  "image_path": "input/2025-12-02/uuid.png",
  "model": "google/gemini-2.5-flash"
}
```

**可选模型**: `google/gemini-2.5-flash` | `google/gemini-2.5-pro` | `openai/gpt-4o`

**响应**:
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "html_file_path": "output/.../uuid.html"
}
```

---

### 4. 转换 PPTX

```http
POST /slides/pptx
Content-Type: application/json

{
  "html_file_path": "output/.../uuid.html"
}
```

**响应**:
```json
{
  "success": true,
  "download_url": "http://server:8000/static/output/.../uuid.pptx"
}
```

---

## 完整代码示例

### 一键转换函数

```typescript
const API = 'http://localhost:8000';

async function imageToPptx(
  file: File,
  model = 'google/gemini-2.5-flash',
  onProgress?: (msg: string, percent: number) => void
) {
  // 1. 上传
  onProgress?.('上传中...', 10);
  const form = new FormData();
  form.append('file', file);
  const upload = await fetch(`${API}/upload`, { method: 'POST', body: form });
  if (!upload.ok) throw new Error('上传失败');
  const { file_path } = await upload.json();

  // 2. OCR 识别（必须）
  onProgress?.('OCR 识别中...', 30);
  const ocr = await fetch(`${API}/ocr/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_path }),
  });
  if (!ocr.ok) throw new Error('OCR 识别失败');
  const ocrData = await ocr.json();
  if (!ocrData.success) throw new Error(ocrData.detail || 'OCR 失败');

  // 3. 生成 HTML
  onProgress?.('AI 生成中...', 60);
  const html = await fetch(`${API}/slides/html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_path: file_path, model }),
  });
  if (!html.ok) throw new Error('生成失败');
  const htmlData = await html.json();
  if (!htmlData.success) throw new Error(htmlData.message || '生成失败');

  // 4. 转换 PPTX
  onProgress?.('转换 PPTX...', 90);
  const pptx = await fetch(`${API}/slides/pptx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html_file_path: htmlData.html_file_path }),
  });
  if (!pptx.ok) throw new Error('转换失败');
  const pptxData = await pptx.json();
  if (!pptxData.success) throw new Error(pptxData.message || '转换失败');

  onProgress?.('完成', 100);
  return pptxData.download_url;
}

// 触发下载
function download(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'slide.pptx';
  a.click();
}
```

### 使用示例

```typescript
// 简单使用
const url = await imageToPptx(file);
download(url);

// 带进度
const url = await imageToPptx(file, 'google/gemini-2.5-flash', (msg, pct) => {
  progressBar.style.width = pct + '%';
  statusText.innerText = msg;
});
download(url);
```

---

## React 组件示例

```tsx
function UploadButton() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await imageToPptx(file, 'google/gemini-2.5-flash', (msg, pct) => {
        setProgress(pct);
        setStatus(msg);
      });
      download(url);
    } catch (err) {
      alert('转换失败: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} disabled={loading} />
      {loading && (
        <div>
          <progress value={progress} max={100} />
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 常见错误

### ❌ OCR 文件不存在

```
OCR 文件不存在: Markdown 文件不存在...请先完成 OCR 识别。
```

**原因**: 跳过了 OCR 步骤，直接调用了 `/slides/html`

**解决**: 在调用 `/slides/html` 之前，必须先调用 `/ocr/process` 并等待完成

```typescript
// ❌ 错误：跳过 OCR
const html = await fetch(`${API}/slides/html`, { ... });

// ✅ 正确：先 OCR 再生成
await fetch(`${API}/ocr/process`, { ... });  // 等待完成
const html = await fetch(`${API}/slides/html`, { ... });
```

### ❌ 生成超时

**原因**: LLM 响应慢

**解决**: 增加 fetch 超时时间，或换用更快的模型 `google/gemini-2.5-flash`

### ❌ 网络连接失败

**原因**: 后端无法访问 OpenRouter API（可能需要代理）

**解决**: 联系后端管理员配置网络代理

---

## 调用流程图

```
┌─────────────┐
│  选择图片   │
└──────┬──────┘
       ▼
┌─────────────┐     POST /upload
│   上传图片   │ ──────────────────► file_path
└──────┬──────┘
       ▼
┌─────────────┐     POST /ocr/process
│  OCR 识别   │ ──────────────────► 等待完成 (5-30s)
└──────┬──────┘
       ▼
┌─────────────┐     POST /slides/html
│  生成 HTML  │ ──────────────────► html_file_path (10-60s)
└──────┬──────┘
       ▼
┌─────────────┐     POST /slides/pptx
│  转换 PPTX  │ ──────────────────► download_url (2-10s)
└──────┬──────┘
       ▼
┌─────────────┐
│   下载文件   │
└─────────────┘
```

---

## 耗时参考

| 步骤 | 耗时 |
|------|------|
| 上传 | < 1s |
| **OCR 识别** | **5-30s** |
| 生成 HTML | 10-60s |
| 转换 PPTX | 2-10s |

**总计约 20-100 秒**，取决于图片复杂度和模型选择。
