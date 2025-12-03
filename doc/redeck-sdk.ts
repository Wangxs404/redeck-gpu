/**
 * ReDeck SDK - 图片转 PPTX
 * 复制此文件到项目，修改 API_BASE 即可使用
 */

const API_BASE = 'http://localhost:8000';

export const MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini Flash', desc: '极速' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini Pro', desc: '高质量' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', desc: 'OpenAI' },
];

/**
 * 图片转 PPTX
 * 流程: 上传 → OCR识别 → 生成HTML → 转换PPTX
 * 
 * @param file 图片文件
 * @param model 模型 ID
 * @param onProgress 进度回调 (message, percent)
 * @returns PPTX 下载地址
 */
export async function imageToPptx(
  file: File,
  model = 'google/gemini-2.5-flash',
  onProgress?: (msg: string, percent: number) => void
): Promise<string> {
  // 1. 上传
  onProgress?.('上传中...', 10);
  const form = new FormData();
  form.append('file', file);
  const uploadRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
  if (!uploadRes.ok) throw new Error('上传失败');
  const { file_path } = await uploadRes.json();

  // 2. OCR 识别（必须步骤）
  onProgress?.('OCR 识别中...', 30);
  const ocrRes = await fetch(`${API_BASE}/ocr/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_path }),
  });
  if (!ocrRes.ok) {
    const err = await ocrRes.json().catch(() => ({}));
    throw new Error(err.detail || 'OCR 识别失败');
  }
  const ocrData = await ocrRes.json();
  if (!ocrData.success) {
    throw new Error(ocrData.detail || 'OCR 识别失败');
  }

  // 3. 生成 HTML
  onProgress?.('AI 生成中...', 60);
  const htmlRes = await fetch(`${API_BASE}/slides/html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_path: file_path, model }),
  });
  if (!htmlRes.ok) {
    const err = await htmlRes.json().catch(() => ({}));
    throw new Error(err.detail || '生成失败');
  }
  const htmlData = await htmlRes.json();
  if (!htmlData.success) throw new Error(htmlData.message || '生成失败');

  // 4. 转换 PPTX
  onProgress?.('转换 PPTX...', 90);
  const pptxRes = await fetch(`${API_BASE}/slides/pptx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html_file_path: htmlData.html_file_path }),
  });
  if (!pptxRes.ok) {
    const err = await pptxRes.json().catch(() => ({}));
    throw new Error(err.detail || '转换失败');
  }
  const pptxData = await pptxRes.json();
  if (!pptxData.success) throw new Error(pptxData.message || '转换失败');

  onProgress?.('完成', 100);
  return pptxData.download_url;
}

/** 触发下载 */
export function download(url: string, filename = 'slide.pptx') {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/** 健康检查 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.ok;
}
