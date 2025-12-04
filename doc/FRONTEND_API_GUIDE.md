# 前端接入指南

## 服务信息

| 配置项 | 值 |
|--------|-----|
| **服务器 IP** | `36.103.199.134` |
| **端口** | `8000` |
| **生产域名** | `https://api.video2ppt.com` |
| **协议** | HTTP / HTTPS |

## Base URL

```javascript
// 开发环境
const API_BASE = 'http://36.103.199.134:8000';

// 生产环境
const API_BASE = 'https://api.video2ppt.com';
```

---

## API 接口列表

### 1. 健康检查

```
GET /health
```

**响应示例**:
```json
{
  "status": "healthy",
  "task_queue": {
    "running": true,
    "max_workers": 3,
    "queue_size": 2,
    "processing_tasks": 3
  }
}
```

---

### 2. 提交异步任务 (推荐)

```
POST /tasks/submit
Content-Type: application/json
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file_url | string | ✅ | 图片公开 URL |
| model | string | ❌ | LLM 模型，默认 `google/gemini-2.5-flash` |
| backend | string | ❌ | OCR 后端，默认 `vlm-transformers` |
| lang | string | ❌ | 语言，默认 `ch` |

**请求示例**:
```javascript
const response = await fetch(`${API_BASE}/tasks/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file_url: 'https://your-bucket.r2.dev/image.png',
    model: 'google/gemini-2.5-flash'
  })
});
```

**响应示例**:
```json
{
  "success": true,
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "任务已提交",
  "queue_position": 3,
  "estimated_wait_seconds": 45
}
```

---

### 3. 查询任务状态

```
GET /tasks/{task_id}
```

**响应 - 排队中**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_type": "gpu_ocr_full",
  "status": "pending",
  "created_at": "2025-12-04T13:00:00"
}
```

**响应 - 处理中**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "created_at": "2025-12-04T13:00:00",
  "started_at": "2025-12-04T13:00:15"
}
```

**响应 - 完成**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "success": true,
    "file_uuid": "abc123",
    "download_url": "https://pub-xxx.r2.dev/pptx/2025-12-04/abc123/abc123.pptx",
    "model": "google/gemini-2.5-flash"
  },
  "created_at": "2025-12-04T13:00:00",
  "started_at": "2025-12-04T13:00:15",
  "completed_at": "2025-12-04T13:00:52",
  "wait_time_seconds": 15.0,
  "process_time_seconds": 37.5
}
```

**响应 - 失败**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "error": "LLM API 错误: rate limit exceeded"
}
```

---

### 4. 查询队列状态

```
GET /tasks/queue/status
```

**响应示例**:
```json
{
  "running": true,
  "max_workers": 3,
  "active_workers": 2,
  "queue_size": 5,
  "max_queue_size": 100,
  "pending_tasks": 5,
  "processing_tasks": 2,
  "stats": {
    "total_submitted": 150,
    "total_completed": 140,
    "total_failed": 5
  }
}
```

---

### 5. 同步处理 (兼容旧接口)

```
POST /ocr/process-gpu-full
Content-Type: application/json
```

**注意**: 此接口会阻塞等待 30-60 秒，建议使用异步接口。

**请求示例**:
```json
{
  "file_url": "https://your-bucket.r2.dev/image.png"
}
```

---

## 前端完整示例

### React/Next.js 示例

```typescript
const API_BASE = 'https://api.video2ppt.com';

interface TaskResult {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    download_url: string;
  };
  error?: string;
  wait_time_seconds?: number;
  process_time_seconds?: number;
}

// 提交任务
async function submitTask(imageUrl: string): Promise<string> {
  const res = await fetch(`${API_BASE}/tasks/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      file_url: imageUrl,
      model: 'google/gemini-2.5-flash'
    })
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.detail);
  return data.task_id;
}

// 轮询任务状态
async function pollTaskStatus(
  taskId: string, 
  onProgress?: (status: string) => void
): Promise<string> {
  const maxAttempts = 150; // 最多等待 5 分钟
  const interval = 2000;   // 每 2 秒轮询
  
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`);
    const task: TaskResult = await res.json();
    
    onProgress?.(task.status);
    
    if (task.status === 'completed') {
      return task.result!.download_url;
    }
    
    if (task.status === 'failed') {
      throw new Error(task.error || '任务处理失败');
    }
    
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error('任务超时');
}

// 完整调用流程
async function convertImageToPPTX(imageUrl: string) {
  try {
    // 1. 提交任务
    const taskId = await submitTask(imageUrl);
    console.log('任务已提交:', taskId);
    
    // 2. 轮询状态
    const downloadUrl = await pollTaskStatus(taskId, (status) => {
      console.log('当前状态:', status);
      // 更新 UI 进度条
    });
    
    // 3. 返回下载链接
    console.log('PPTX 下载链接:', downloadUrl);
    return downloadUrl;
    
  } catch (error) {
    console.error('转换失败:', error);
    throw error;
  }
}

// 使用示例
convertImageToPPTX('https://your-bucket.r2.dev/slide.png')
  .then(url => window.open(url))
  .catch(err => alert(err.message));
```

### 批量提交示例

```typescript
async function batchConvert(imageUrls: string[]) {
  // 1. 并行提交所有任务
  const taskIds = await Promise.all(
    imageUrls.map(url => submitTask(url))
  );
  
  console.log(`已提交 ${taskIds.length} 个任务`);
  
  // 2. 并行轮询所有任务
  const results = await Promise.all(
    taskIds.map(id => pollTaskStatus(id))
  );
  
  return results; // 返回所有下载链接
}
```

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 任务不存在 |
| 503 | 队列已满，稍后重试 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. **图片 URL 必须公开可访问**（支持 R2、S3、CDN 等）
2. **单任务处理时间约 30-50 秒**
3. **最大队列长度 100**，超出返回 503
4. **并发处理数 3**，多余任务排队等待
5. **建议轮询间隔 2 秒**，避免频繁请求
6. **PPTX 下载链接有效期永久**（存储在 R2）

---

## 测试命令

```bash
# 健康检查
curl https://api.video2ppt.com/health

# 提交任务
curl -X POST https://api.video2ppt.com/tasks/submit \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://pub-xxx.r2.dev/image.png"}'

# 查询任务
curl https://api.video2ppt.com/tasks/{task_id}

# 队列状态
curl https://api.video2ppt.com/tasks/queue/status
```
