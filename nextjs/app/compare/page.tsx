'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Loader2, Check, X, Eye, Copy, RefreshCw,
  FileCode, Image, Plus, Trash2, Play, Pause, Settings,
  ChevronDown, Maximize2, Minimize2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

// ============ 工具函数 ============
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

// ============ 类型定义 ============
interface UploadResult {
  success: boolean;
  file_path?: string;
  filename?: string;
  message?: string;
}

interface ModelResult {
  id: string;
  model: string;
  label: string;
  provider: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  html?: string;
  html_file_path?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface ModelConfig {
  value: string;
  label: string;
  description: string;
  provider: string;
  recommended?: boolean;
}

// ============ 常量 ============
const API_BASE = 'http://localhost:8000';

const proxyImageUrls = (html: string): string => {
  return html.replace(/http:\/\/localhost:8000\/static\//g, '/api/proxy/');
};

const AVAILABLE_MODELS: ModelConfig[] = [
  { value: 'openai/gpt-4o', label: 'GPT-4o', description: '最强多模态能力', provider: 'OpenAI', recommended: true },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', description: '快速且经济', provider: 'OpenAI' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', description: '精准的代码生成', provider: 'Anthropic' },
  { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', description: '顶级推理能力', provider: 'Anthropic' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', description: '实验性新功能', provider: 'Google' },
  { value: 'x-ai/grok-4.1-fast', label: 'Grok 4.1 Fast', description: '实时数据能力', provider: 'X-AI' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '极速响应', provider: 'Google' },
  { value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5', description: '最新版本', provider: 'Anthropic' },
];

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OpenAI: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Anthropic: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Google: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'X-AI': { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  Custom: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  Openai: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Openrouter: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  Deepseek: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Mistral: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

// ============ 组件：Button ============
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 focus-visible:ring-primary-500',
      secondary: 'bg-[#18181f] hover:bg-[#1f1f27] text-zinc-100 border border-zinc-800 hover:border-zinc-700 focus-visible:ring-zinc-500',
      ghost: 'hover:bg-white/5 text-zinc-400 hover:text-zinc-100 focus-visible:ring-zinc-500',
      outline: 'border-2 border-primary-500/50 hover:border-primary-500 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 focus-visible:ring-primary-500',
      danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 focus-visible:ring-red-500',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ============ 主组件 ============
export default function ComparePage() {
  // 文件状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR 状态
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);

  // 模型配置和结果
  const [selectedModels, setSelectedModels] = useState<string[]>(['openai/gpt-4o', 'anthropic/claude-3.5-sonnet']);
  const [customModels, setCustomModels] = useState<ModelConfig[]>([]);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 自定义模型输入
  const [customModelInput, setCustomModelInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // UI 状态
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  // 所有可用模型（预设 + 自定义）
  const allModels = [...AVAILABLE_MODELS, ...customModels];

  // ============ 文件选择 ============
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
      setOcrComplete(false);
      setModelResults([]);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setUploadResult(null);
      setOcrComplete(false);
      setModelResults([]);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  // ============ 上传和 OCR ============
  const handleUploadAndOcr = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // 上传
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || uploadData.status !== 'success') {
        throw new Error(uploadData.detail || '上传失败');
      }

      setUploadResult({ success: true, file_path: uploadData.file_path, filename: uploadData.filename });

      // OCR
      setOcrProcessing(true);
      const ocrResponse = await fetch(`${API_BASE}/ocr/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: uploadData.file_path }),
      });

      const ocrData = await ocrResponse.json();

      if (!ocrData.success) {
        throw new Error(ocrData.detail || 'OCR 识别失败');
      }

      setOcrComplete(true);
    } catch (error) {
      setUploadResult({ success: false, message: error instanceof Error ? error.message : '处理失败' });
    } finally {
      setUploading(false);
      setOcrProcessing(false);
    }
  };

  // ============ 模型选择 ============
  const toggleModel = (modelValue: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelValue)) {
        return prev.filter(m => m !== modelValue);
      }
      return [...prev, modelValue];
    });
  };

  // ============ 添加自定义模型 ============
  const addCustomModel = () => {
    const input = customModelInput.trim();
    if (!input) return;

    // 解析输入格式：provider/model-name 或直接 model-name
    let provider = 'Custom';
    let modelValue = input;
    let label = input;

    if (input.includes('/')) {
      const parts = input.split('/');
      provider = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      label = parts.slice(1).join('/');
      modelValue = input;
    }

    // 检查是否已存在
    if (allModels.some(m => m.value === modelValue)) {
      alert('该模型已存在');
      return;
    }

    const newModel: ModelConfig = {
      value: modelValue,
      label: label,
      description: '自定义模型',
      provider: provider,
    };

    setCustomModels(prev => [...prev, newModel]);
    setSelectedModels(prev => [...prev, modelValue]);
    setCustomModelInput('');
    setShowCustomInput(false);
  };

  // ============ 删除自定义模型 ============
  const removeCustomModel = (modelValue: string) => {
    setCustomModels(prev => prev.filter(m => m.value !== modelValue));
    setSelectedModels(prev => prev.filter(m => m !== modelValue));
  };

  // ============ 生成 HTML ============
  const generateForModel = async (model: string): Promise<ModelResult> => {
    const modelConfig = allModels.find(m => m.value === model);
    const result: ModelResult = {
      id: model,
      model: model,
      label: modelConfig?.label || model,
      provider: modelConfig?.provider || 'Unknown',
      status: 'loading',
      startTime: Date.now(),
    };

    try {
      const response = await fetch(`${API_BASE}/slides/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_path: uploadResult?.file_path, model }),
      });

      const data = await response.json();

      if (data.success && data.html) {
        return {
          ...result,
          status: 'success',
          html: data.html,
          html_file_path: data.html_file_path,
          usage: data.usage,
          endTime: Date.now(),
        };
      } else {
        return {
          ...result,
          status: 'error',
          error: data.detail || data.message || 'HTML 生成失败',
          endTime: Date.now(),
        };
      }
    } catch (error) {
      return {
        ...result,
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误',
        endTime: Date.now(),
      };
    }
  };

  const handleGenerateAll = async () => {
    if (!uploadResult?.file_path || selectedModels.length === 0) return;

    setIsGenerating(true);
    
    // 初始化结果
    const initialResults: ModelResult[] = selectedModels.map(model => {
      const modelConfig = allModels.find(m => m.value === model);
      return {
        id: model,
        model: model,
        label: modelConfig?.label || model,
        provider: modelConfig?.provider || 'Custom',
        status: 'loading',
        startTime: Date.now(),
      };
    });
    setModelResults(initialResults);

    // 并行生成
    const results = await Promise.all(
      selectedModels.map(model => generateForModel(model))
    );

    setModelResults(results);
    setIsGenerating(false);
  };

  const handleRegenerateModel = async (model: string) => {
    // 更新该模型状态为 loading
    setModelResults(prev => prev.map(r => 
      r.model === model ? { ...r, status: 'loading' as const, startTime: Date.now(), html: undefined, error: undefined } : r
    ));

    const result = await generateForModel(model);
    
    setModelResults(prev => prev.map(r => 
      r.model === model ? result : r
    ));
  };

  // ============ 重置 ============
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadResult(null);
    setOcrComplete(false);
    setModelResults([]);
    setIsGenerating(false);
    setExpandedModel(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============ 复制 HTML ============
  const copyHtml = (html: string) => {
    navigator.clipboard.writeText(html);
  };

  // ============ 获取布局列数 ============
  const getGridCols = () => {
    const count = modelResults.length + 1; // +1 for original image
    if (expandedModel) return 1;
    if (count <= 2) return 2;
    if (count <= 3) return 3;
    return 2;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* 背景效果 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      {/* 头部 */}
      <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl bg-[#0a0a0f]/80">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Repix.ai</h1>
              <p className="text-xs text-zinc-500">Model Comparison</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/workflow" className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">
              工作流模式
            </Link>
            <Link href="/agent" className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">
              Agent 模式
            </Link>
            <Button variant="ghost" size="sm" onClick={handleReset} icon={<RefreshCw className="w-4 h-4" />}>
              重置
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1920px] mx-auto px-6 py-6">
        {/* 上传和配置区域 */}
        {!ocrComplete && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">AI 模型对比</h2>
              <p className="text-zinc-400">上传图片，对比不同 AI 模型的生成效果</p>
            </div>

            {/* 上传区域 */}
            <div
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer group',
                isDragOver && 'border-primary-500 bg-primary-500/5',
                preview ? 'border-primary-500/50 bg-primary-500/5' : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50'
              )}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="预览" className="max-h-72 mx-auto rounded-xl shadow-2xl" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white font-medium px-4 py-2 bg-white/20 rounded-lg">点击更换图片</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      <Upload className={cn('w-10 h-10 transition-colors', isDragOver ? 'text-primary-400' : 'text-zinc-500')} />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">拖拽图片到此处</p>
                    <p className="text-zinc-500">或点击选择文件</p>
                  </div>
                )}
              </label>
            </div>

            {/* 模型选择 */}
            {selectedFile && (
              <div className="bg-[#111118] border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">选择对比模型</h3>
                  <span className="text-sm text-zinc-500">已选择 {selectedModels.length} 个</span>
                </div>
                
                {/* 预设模型 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {AVAILABLE_MODELS.map((model) => {
                    const isSelected = selectedModels.includes(model.value);
                    const colors = PROVIDER_COLORS[model.provider] || PROVIDER_COLORS['X-AI'];
                    
                    return (
                      <button
                        key={model.value}
                        onClick={() => toggleModel(model.value)}
                        className={cn(
                          'p-3 rounded-xl border-2 text-left transition-all',
                          isSelected
                            ? `${colors.bg} ${colors.border} ${colors.text}`
                            : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{model.label}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <span className="text-xs opacity-70">{model.provider}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 自定义模型列表 */}
                {customModels.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-zinc-500 mb-2">自定义模型</p>
                    <div className="flex flex-wrap gap-2">
                      {customModels.map((model) => {
                        const isSelected = selectedModels.includes(model.value);
                        return (
                          <div
                            key={model.value}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
                              isSelected
                                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                                : 'border-zinc-800 text-zinc-400'
                            )}
                          >
                            <button
                              onClick={() => toggleModel(model.value)}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm font-medium">{model.value}</span>
                              {isSelected && <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => removeCustomModel(model.value)}
                              className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-colors"
                              title="删除"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 添加自定义模型 */}
                <div className="border-t border-zinc-800 pt-4">
                  {showCustomInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customModelInput}
                        onChange={(e) => setCustomModelInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomModel()}
                        placeholder="输入模型名称，如 openai/gpt-4-turbo"
                        className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500"
                        autoFocus
                      />
                      <Button
                        onClick={addCustomModel}
                        disabled={!customModelInput.trim()}
                        size="md"
                        icon={<Plus className="w-4 h-4" />}
                      >
                        添加
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomModelInput('');
                        }}
                        icon={<X className="w-4 h-4" />}
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加自定义模型</span>
                    </button>
                  )}
                  <p className="text-xs text-zinc-600 mt-2">
                    支持格式：provider/model-name（如 openai/gpt-4-turbo、anthropic/claude-3-haiku）
                  </p>
                </div>
              </div>
            )}

            {/* 状态和操作 */}
            {uploadResult && !uploadResult.success && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-red-300">
                {uploadResult.message}
              </div>
            )}

            {(uploading || ocrProcessing) && (
              <div className="bg-[#111118] border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  <span className="text-white">
                    {uploading ? '正在上传图片...' : '正在进行 OCR 识别...'}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleUploadAndOcr}
              disabled={!selectedFile || uploading || ocrProcessing || selectedModels.length === 0}
              loading={uploading || ocrProcessing}
              icon={<Play className="w-4 h-4" />}
              size="lg"
              className="w-full"
            >
              上传并准备对比 ({selectedModels.length} 个模型)
            </Button>
          </div>
        )}

        {/* 对比区域 */}
        {ocrComplete && (
          <div className="space-y-6">
            {/* 工具栏 */}
            <div className="flex items-center justify-between bg-[#111118] border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">对比 {selectedModels.length} 个模型</span>
                {modelResults.some(r => r.status === 'success') && (
                  <span className="text-sm text-zinc-500">
                    {modelResults.filter(r => r.status === 'success').length} / {selectedModels.length} 完成
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">缩放</span>
                  <input
                    type="range"
                    min="0.3"
                    max="0.8"
                    step="0.05"
                    value={previewScale}
                    onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs text-zinc-400 font-mono w-10">{Math.round(previewScale * 100)}%</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  重新选择
                </Button>
                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  loading={isGenerating}
                  icon={<Play className="w-4 h-4" />}
                  size="sm"
                >
                  {modelResults.length > 0 ? '重新生成全部' : '开始生成'}
                </Button>
              </div>
            </div>

            {/* 对比网格 */}
            <div 
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${getGridCols()}, 1fr)` }}
            >
              {/* 原图 */}
              {(!expandedModel || expandedModel === 'original') && (
                <div className={cn(
                  'bg-[#111118] border border-zinc-800 rounded-2xl overflow-hidden',
                  expandedModel === 'original' && 'col-span-full'
                )}>
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-zinc-400" />
                      <span className="font-medium text-white">原始图片</span>
                    </div>
                    <button
                      onClick={() => setExpandedModel(expandedModel === 'original' ? null : 'original')}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      {expandedModel === 'original' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-zinc-900" style={{ minHeight: expandedModel ? '500px' : '300px' }}>
                    {preview && (
                      <img
                        src={preview}
                        alt="原始图片"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                        style={{ maxHeight: expandedModel ? '480px' : '280px' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 模型结果 */}
              {modelResults.map((result) => {
                if (expandedModel && expandedModel !== result.model) return null;
                
                const colors = PROVIDER_COLORS[result.provider] || PROVIDER_COLORS['X-AI'];
                const duration = result.endTime && result.startTime 
                  ? ((result.endTime - result.startTime) / 1000).toFixed(1)
                  : null;

                return (
                  <div
                    key={result.id}
                    className={cn(
                      'bg-[#111118] border rounded-2xl overflow-hidden',
                      result.status === 'success' && colors.border,
                      result.status === 'error' && 'border-red-500/30',
                      result.status === 'loading' && 'border-zinc-800',
                      result.status === 'idle' && 'border-zinc-800',
                      expandedModel === result.model && 'col-span-full'
                    )}
                  >
                    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-0.5 text-xs rounded-full', colors.bg, colors.text)}>
                          {result.provider}
                        </span>
                        <span className="font-medium text-white">{result.label}</span>
                        {result.status === 'loading' && (
                          <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                        )}
                        {result.status === 'success' && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                        {result.status === 'error' && (
                          <X className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {duration && (
                          <span className="text-xs text-zinc-500">{duration}s</span>
                        )}
                        {result.usage && (
                          <span className="text-xs text-zinc-500">
                            {result.usage.total_tokens} tokens
                          </span>
                        )}
                        {result.status === 'success' && result.html && (
                          <button
                            onClick={() => copyHtml(result.html!)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            title="复制 HTML"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRegenerateModel(result.model)}
                          disabled={result.status === 'loading'}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                          title="重新生成"
                        >
                          <RefreshCw className={cn('w-4 h-4', result.status === 'loading' && 'animate-spin')} />
                        </button>
                        <button
                          onClick={() => setExpandedModel(expandedModel === result.model ? null : result.model)}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                          {expandedModel === result.model ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      className="flex items-center justify-center bg-zinc-900 overflow-hidden"
                      style={{ minHeight: expandedModel ? '500px' : '300px' }}
                    >
                      {result.status === 'loading' && (
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                          <p className="text-zinc-400">正在生成...</p>
                        </div>
                      )}
                      
                      {result.status === 'error' && (
                        <div className="text-center p-4">
                          <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
                          <p className="text-red-400 text-sm">{result.error}</p>
                        </div>
                      )}
                      
                      {result.status === 'success' && result.html && (
                        <div
                          className="bg-white shadow-xl rounded-sm"
                          style={{
                            width: '960px',
                            height: '540px',
                            transform: `scale(${expandedModel ? 0.7 : previewScale})`,
                            transformOrigin: 'center center'
                          }}
                        >
                          <iframe
                            srcDoc={proxyImageUrls(result.html)}
                            className="border-0"
                            style={{ width: '960px', height: '540px' }}
                            title={`${result.label} Preview`}
                          />
                        </div>
                      )}
                      
                      {result.status === 'idle' && (
                        <div className="text-center p-4">
                          <p className="text-zinc-500">等待生成</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 空状态 - 等待生成 */}
              {modelResults.length === 0 && !expandedModel && selectedModels.map((model) => {
                const modelConfig = allModels.find(m => m.value === model);
                const colors = PROVIDER_COLORS[modelConfig?.provider || 'Custom'] || PROVIDER_COLORS['X-AI'];
                
                return (
                  <div
                    key={model}
                    className="bg-[#111118] border border-zinc-800 rounded-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/50">
                      <span className={cn('px-2 py-0.5 text-xs rounded-full', colors.bg, colors.text)}>
                        {modelConfig?.provider}
                      </span>
                      <span className="font-medium text-white">{modelConfig?.label}</span>
                    </div>
                    <div className="flex items-center justify-center bg-zinc-900" style={{ minHeight: '300px' }}>
                      <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                          <Eye className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500">点击"开始生成"查看结果</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="relative z-10 text-center py-8 border-t border-zinc-800/50">
        <p className="text-sm text-zinc-600">Repix.ai Model Comparison © 2024</p>
      </footer>
    </div>
  );
}

