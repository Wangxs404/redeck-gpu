'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSearch, Settings, Code2, Download,
  ChevronRight, ChevronLeft, Loader2, Check, X,
  Eye, Copy, RefreshCw, Sparkles, FileCode, MessageSquareText,
  Image, Columns, Zap, ArrowRight, ChevronDown, ExternalLink,
  Key, Globe, Server, EyeOff, Wrench
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

interface OcrResult {
  success: boolean;
  outputPath?: string;
  message?: string;
}

interface HtmlResult {
  success: boolean;
  html?: string;
  html_file_path?: string;
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  message?: string;
}

interface PptxResult {
  success: boolean;
  pptx_file_path?: string;
  download_url?: string;
  message?: string;
}

interface PromptPart {
  title: string;
  content: string;
  char_count: number;
  source_file?: string;
  note?: string;
}

interface PromptPreviewResult {
  success: boolean;
  prompt_parts?: {
    system_prompt: PromptPart;
    user_instruction: PromptPart;
    markdown_content: PromptPart;
    layout_json: PromptPart;
    image_note: PromptPart;
  };
  total_text_chars?: number;
  message?: string;
}

type StepStatus = 'pending' | 'active' | 'completed' | 'error';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
}

// ============ 常量 ============
// 生产环境使用代理，开发环境可直连后端
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/proxy';

const proxyImageUrls = (html: string): string => {
  // 将后端静态资源 URL 替换为代理路径
  // 匹配 http://localhost:端口/static/ 或 http://任意host:端口/static/
  return html.replace(
    /http:\/\/[^/]+\/static\//g,
    '/api/proxy/static/'
  );
};

const AVAILABLE_MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o', description: '最强多模态能力', provider: 'OpenAI', recommended: true },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', description: '快速且经济', provider: 'OpenAI' },
  { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', description: '顶级推理能力', provider: 'Anthropic' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', description: '实验性新功能', provider: 'Google' },
  { value: 'x-ai/grok-4.1-fast', label: 'Grok 4.1 Fast', description: '实时数据能力', provider: 'X-AI' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '极速响应', provider: 'Google' },
  { value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5', description: '最新版本', provider: 'Anthropic' },
  { value: 'openrouter/bert-nebulon-alpha', label: 'Bert Neburon Alpha', description: 'Bert Neburon Alpha', provider: 'OpenRouter' },
];

// 常用 OpenRouter 模型列表
const OPENROUTER_MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
  { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
  { value: 'openrouter/bert-nebulon-alpha', label: 'Bert Neburon Alpha' },
];

interface CustomProviderConfig {
  enabled: boolean;
  useCustomEndpoint: boolean;
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

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

// ============ 组件：Card ============
interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
}

const Card: React.FC<CardProps> = ({ className, children, hover = false, glow = false }) => (
  <div
    className={cn(
      'rounded-2xl bg-[#111118] border border-zinc-800/50',
      hover && 'hover:border-zinc-700/50 hover:bg-[#14141b] transition-all duration-300',
      glow && 'shadow-[0_0_50px_rgba(90,103,242,0.1)]',
      className
    )}
  >
    {children}
  </div>
);

// ============ 组件：Badge ============
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-primary-500/10 text-primary-400 border-primary-500/30',
  };

  return (
    <span className={cn('px-2.5 py-0.5 text-xs font-medium rounded-full border', variants[variant])}>
      {children}
    </span>
  );
};

// ============ 组件：Alert ============
interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, action }) => {
  const variants = {
    success: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300',
    error: 'bg-red-500/5 border-red-500/20 text-red-300',
    warning: 'bg-amber-500/5 border-amber-500/20 text-amber-300',
    info: 'bg-primary-500/5 border-primary-500/20 text-primary-300',
  };

  const icons = {
    success: <Check className="w-5 h-5 text-emerald-400" />,
    error: <X className="w-5 h-5 text-red-400" />,
    warning: <Zap className="w-5 h-5 text-amber-400" />,
    info: <Sparkles className="w-5 h-5 text-primary-400" />,
  };

  return (
    <div className={cn('rounded-xl border p-4 flex items-start gap-3', variants[variant])}>
      {icons[variant]}
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-1">{title}</p>}
        <p className="text-sm opacity-90">{children}</p>
      </div>
      {action}
    </div>
  );
};

// ============ 主组件 ============
export default function WorkflowPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: 上传状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: OCR 状态
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  // Step 3: 模型配置状态
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o');
  const [customProvider, setCustomProvider] = useState<CustomProviderConfig>({
    enabled: false,
    useCustomEndpoint: false,
    baseUrl: '',
    apiKey: '',
    modelName: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Step 4: Prompt 预览状态
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptPreview, setPromptPreview] = useState<PromptPreviewResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['system_prompt', 'user_instruction']));

  // Step 5: HTML 生成状态
  const [htmlGenerating, setHtmlGenerating] = useState(false);
  const [htmlResult, setHtmlResult] = useState<HtmlResult | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'original' | 'compare'>('preview');
  const [previewScale, setPreviewScale] = useState(0.65);

  // Step 6: PPTX 转换状态
  const [pptxConverting, setPptxConverting] = useState(false);
  const [pptxResult, setPptxResult] = useState<PptxResult | null>(null);

  // 步骤定义
  const steps: Step[] = [
    { id: 1, title: '上传图片', description: '选择 PPT 截图', icon: <Upload className="w-5 h-5" />, status: currentStep === 1 ? 'active' : uploadResult?.success ? 'completed' : 'pending' },
    { id: 2, title: 'OCR 识别', description: 'MinerU 识别', icon: <FileSearch className="w-5 h-5" />, status: currentStep === 2 ? 'active' : ocrResult?.success ? 'completed' : currentStep > 2 ? 'completed' : 'pending' },
    { id: 3, title: '配置模型', description: '选择 AI 模型', icon: <Settings className="w-5 h-5" />, status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending' },
    { id: 4, title: '预览 Prompt', description: '查看提示词', icon: <MessageSquareText className="w-5 h-5" />, status: currentStep === 4 ? 'active' : promptPreview?.success ? 'completed' : currentStep > 4 ? 'completed' : 'pending' },
    { id: 5, title: '生成 HTML', description: '预览效果', icon: <Code2 className="w-5 h-5" />, status: currentStep === 5 ? 'active' : htmlResult?.success ? 'completed' : 'pending' },
    { id: 6, title: '导出 PPTX', description: '下载文件', icon: <Download className="w-5 h-5" />, status: currentStep === 6 ? 'active' : pptxResult?.success ? 'completed' : 'pending' }
  ];

  // ============ Step 1: 上传图片 ============
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
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setUploadResult({ success: true, file_path: data.file_path, filename: data.filename });
        setCurrentStep(2);
      } else {
        setUploadResult({ success: false, message: data.detail || '上传失败' });
      }
    } catch (error) {
      setUploadResult({ success: false, message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  // ============ Step 2: OCR 识别 ============
  const handleOcr = async () => {
    if (!uploadResult?.file_path) return;
    
    setOcrProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/ocr/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: uploadResult.file_path }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOcrResult({ success: true, outputPath: data.outputPath });
        setCurrentStep(3);
      } else {
        setOcrResult({ success: false, message: data.detail || 'OCR 识别失败' });
      }
    } catch (error) {
      setOcrResult({ success: false, message: `OCR 识别失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setOcrProcessing(false);
    }
  };

  // ============ Step 3: 配置完成 ============
  const handleConfigComplete = () => {
    setCurrentStep(4);
    handleLoadPromptPreview();
  };

  // ============ Step 4: Prompt 预览 ============
  const handleLoadPromptPreview = async () => {
    if (!uploadResult?.file_path) return;
    
    setPromptLoading(true);
    setPromptPreview(null);
    
    try {
      const response = await fetch(`${API_BASE}/slides/preview-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_path: uploadResult.file_path }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPromptPreview({ success: true, prompt_parts: data.prompt_parts, total_text_chars: data.total_text_chars });
      } else {
        setPromptPreview({ success: false, message: data.detail || data.message || 'Prompt 加载失败' });
      }
    } catch (error) {
      setPromptPreview({ success: false, message: `Prompt 加载失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setPromptLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  // ============ Step 5: 生成 HTML ============
  const handleGenerateHtml = async () => {
    if (!uploadResult?.file_path) return;
    
    setHtmlGenerating(true);
    setHtmlResult(null);
    
    try {
      // 构建请求体
      const requestBody: Record<string, unknown> = {
        image_path: uploadResult.file_path,
        model: customProvider.enabled ? customProvider.modelName : selectedModel,
      };
      
      // 只有在使用自定义端点时才添加 custom_provider 配置
      if (customProvider.enabled && customProvider.useCustomEndpoint && customProvider.baseUrl && customProvider.apiKey) {
        requestBody.custom_provider = {
          base_url: customProvider.baseUrl,
          api_key: customProvider.apiKey,
          model_name: customProvider.modelName,
        };
      }
      
      const response = await fetch(`${API_BASE}/slides/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success && data.html) {
        setHtmlResult({ success: true, html: data.html, html_file_path: data.html_file_path, model: data.model, usage: data.usage });
      } else {
        setHtmlResult({ success: false, message: data.detail || data.message || 'HTML 生成失败' });
      }
    } catch (error) {
      setHtmlResult({ success: false, message: `HTML 生成失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setHtmlGenerating(false);
    }
  };

  const copyHtmlToClipboard = () => {
    if (htmlResult?.html) {
      navigator.clipboard.writeText(htmlResult.html);
    }
  };

  // ============ Step 6: 转换 PPTX ============
  const handleConvertPptx = async () => {
    if (!htmlResult?.html_file_path) return;
    
    setPptxConverting(true);
    setPptxResult(null);
    
    try {
      const response = await fetch(`${API_BASE}/slides/pptx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html_file_path: htmlResult.html_file_path }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPptxResult({ success: true, pptx_file_path: data.pptx_file_path, download_url: data.download_url });
      } else {
        setPptxResult({ success: false, message: data.detail || data.message || 'PPTX 转换失败' });
      }
    } catch (error) {
      setPptxResult({ success: false, message: `PPTX 转换失败: ${error instanceof Error ? error.message : '未知错误'}` });
    } finally {
      setPptxConverting(false);
    }
  };

  // ============ 重置 ============
  const handleReset = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setPreview(null);
    setUploadResult(null);
    setOcrResult(null);
    setPromptPreview(null);
    setHtmlResult(null);
    setPptxResult(null);
    setViewMode('preview');
    setPreviewScale(0.65);
    setExpandedSections(new Set(['system_prompt', 'user_instruction']));
    setCustomProvider({
      enabled: false,
      useCustomEndpoint: false,
      baseUrl: '',
      apiKey: '',
      modelName: '',
    });
    setShowApiKey(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============ 渲染步骤指示器 ============
  const renderStepIndicator = () => (
    <div className="relative mb-12">
      {/* 进度条背景 */}
      <div className="absolute top-6 left-12 right-12 h-0.5 bg-zinc-800" />
      {/* 进度条 */}
      <div 
        className="absolute top-6 left-12 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 6rem)' }}
      />
      
      <div className="relative flex justify-between">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col items-center"
          >
            <button
              onClick={() => {
                if (step.id <= currentStep || (step.id === currentStep + 1 && steps[currentStep - 1]?.status === 'completed')) {
                  setCurrentStep(step.id);
                }
              }}
              disabled={step.id > currentStep + 1}
              className={cn(
                'relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 z-10',
                step.status === 'completed' && 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
                step.status === 'active' && 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40 ring-4 ring-primary-500/20',
                step.status === 'pending' && 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
                step.status === 'error' && 'bg-red-500 text-white'
              )}
            >
              {step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
              ) : (
                step.icon
              )}
            </button>
            <span className={cn(
              'mt-3 text-xs font-medium transition-colors',
              step.status === 'active' ? 'text-primary-400' : 'text-zinc-500'
            )}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // ============ 渲染各步骤内容 ============
  const renderStepContent = () => {
    switch (currentStep) {
      // Step 1: 上传图片
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">上传 PPT 截图</h2>
              <p className="text-zinc-400">支持 JPG、PNG 格式，最大 10MB</p>
            </div>

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
                    <div
                      className={cn(
                        'w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800 flex items-center justify-center transition-transform',
                        isDragOver && 'scale-110 rotate-[5deg]'
                      )}
                    >
                      <Upload className={cn('w-10 h-10 transition-colors', isDragOver ? 'text-primary-400' : 'text-zinc-500')} />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">拖拽图片到此处</p>
                    <p className="text-zinc-500">或点击选择文件</p>
                  </div>
                )}
              </label>
            </div>

            {selectedFile && (
              <div className="bg-zinc-900/50 rounded-xl p-4 flex items-center justify-between border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-zinc-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadResult && !uploadResult.success && (
              <Alert variant="error">{uploadResult.message}</Alert>
            )}

            <Button onClick={handleUpload} disabled={!selectedFile} loading={uploading} icon={<Upload className="w-4 h-4" />} size="lg" className="w-full">
              上传图片
            </Button>
          </div>
        );

      // Step 2: OCR 识别
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">OCR 文字识别</h2>
              <p className="text-zinc-400">使用 MinerU 识别图片中的文字和布局</p>
            </div>

            {uploadResult?.success && (
              <Alert variant="success" title="图片已上传">
                {uploadResult.file_path}
              </Alert>
            )}

            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                  <FileSearch className="w-7 h-7 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">MinerU OCR</h3>
                  <p className="text-sm text-zinc-400">高精度文字识别和布局分析</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['识别文字内容', '提取位置信息', '生成结构数据'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {ocrResult && !ocrResult.success && (
              <Alert variant="error">{ocrResult.message}</Alert>
            )}

            {ocrResult?.success && (
              <Alert variant="success" title="OCR 识别完成">
                {ocrResult.outputPath}
              </Alert>
            )}

            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setCurrentStep(1)} icon={<ChevronLeft className="w-4 h-4" />} size="lg" className="flex-1">
                上一步
              </Button>
              <Button 
                onClick={ocrResult?.success ? () => setCurrentStep(3) : handleOcr} 
                loading={ocrProcessing}
                icon={ocrResult?.success ? <ArrowRight className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                size="lg"
                className="flex-1"
              >
                {ocrResult?.success ? '下一步' : '开始识别'}
              </Button>
            </div>
          </div>
        );

      // Step 3: 配置模型
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">配置 AI 模型</h2>
              <p className="text-zinc-400">选择预设模型或手动配置提供商</p>
            </div>

            {/* 模式切换 */}
            <div className="flex items-center gap-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <button
                onClick={() => setCustomProvider(prev => ({ ...prev, enabled: false }))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  !customProvider.enabled ? 'bg-primary-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )}
              >
                <Sparkles className="w-4 h-4" />
                预设模型
              </button>
              <button
                onClick={() => setCustomProvider(prev => ({ ...prev, enabled: true }))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  customProvider.enabled ? 'bg-primary-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )}
              >
                <Wrench className="w-4 h-4" />
                手动配置
              </button>
            </div>

            {/* 预设模型列表 */}
            {!customProvider.enabled && (
              <div className="space-y-3">
                {AVAILABLE_MODELS.map((model) => (
                  <label
                    key={model.value}
                    className={cn(
                      'flex items-center p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 group',
                      selectedModel === model.value
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model.value}
                      checked={selectedModel === model.value}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white">{model.label}</p>
                        {model.recommended && <Badge variant="info">推荐</Badge>}
                      </div>
                      <p className="text-sm text-zinc-500">{model.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded">{model.provider}</span>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        selectedModel === model.value ? 'border-primary-500 bg-primary-500' : 'border-zinc-600'
                      )}>
                        {selectedModel === model.value && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* 手动配置表单 */}
            {customProvider.enabled && (
              <div className="space-y-4">
                {/* 模型名称输入 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-500" />
                    模型名称
                    <span className="text-xs text-zinc-500 font-normal">(OpenRouter 格式)</span>
                  </label>
                  <input
                    type="text"
                    value={customProvider.modelName}
                    onChange={(e) => setCustomProvider(prev => ({ ...prev, modelName: e.target.value }))}
                    placeholder="openai/gpt-4o 或 anthropic/claude-3.5-sonnet"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-mono text-sm"
                  />
                </div>

                {/* 常用模型快捷选择 */}
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">常用模型</p>
                  <div className="flex flex-wrap gap-2">
                    {OPENROUTER_MODELS.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => setCustomProvider(prev => ({ ...prev, modelName: model.value }))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          customProvider.modelName === model.value
                            ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                        )}
                      >
                        {model.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 自定义端点（可选） */}
                <div className="pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => setCustomProvider(prev => ({ ...prev, useCustomEndpoint: !prev.useCustomEndpoint }))}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <ChevronDown className={cn('w-4 h-4 transition-transform', customProvider.useCustomEndpoint && 'rotate-180')} />
                    <Server className="w-4 h-4" />
                    <span>使用自定义 API 端点</span>
                    <span className="text-xs text-zinc-600">(可选)</span>
                  </button>

                  {customProvider.useCustomEndpoint && (
                    <div className="mt-4 space-y-4 pl-6 border-l-2 border-zinc-800">
                      {/* API Base URL */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-zinc-500" />
                          API Base URL
                        </label>
                        <input
                          type="text"
                          value={customProvider.baseUrl}
                          onChange={(e) => setCustomProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                          placeholder="https://api.openai.com/v1"
                          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-mono text-sm"
                        />
                      </div>

                      {/* API Key */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                          <Key className="w-4 h-4 text-zinc-500" />
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={customProvider.apiKey}
                            onChange={(e) => setCustomProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="sk-..."
                            className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500">API Key 仅用于本次请求，不会被存储</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 当前配置提示 */}
                {customProvider.modelName && (
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2">当前配置</p>
                    <div className="space-y-1 font-mono text-sm">
                      <p className="text-zinc-400">
                        <span className="text-zinc-600">Model:</span>{' '}
                        <span className="text-amber-400">{customProvider.modelName}</span>
                      </p>
                      <p className="text-zinc-400">
                        <span className="text-zinc-600">Endpoint:</span>{' '}
                        <span className="text-emerald-400">
                          {customProvider.useCustomEndpoint && customProvider.baseUrl 
                            ? customProvider.baseUrl 
                            : 'OpenRouter (后端配置)'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setCurrentStep(2)} icon={<ChevronLeft className="w-4 h-4" />} size="lg" className="flex-1">
                上一步
              </Button>
              <Button 
                onClick={handleConfigComplete} 
                icon={<ArrowRight className="w-4 h-4" />} 
                size="lg" 
                className="flex-1"
                disabled={customProvider.enabled && !customProvider.modelName}
              >
                下一步
              </Button>
            </div>
          </div>
        );

      // Step 4: 显示 Prompt
      case 4:
        const promptSections = promptPreview?.prompt_parts ? [
          { key: 'system_prompt', data: promptPreview.prompt_parts.system_prompt, color: 'violet' },
          { key: 'user_instruction', data: promptPreview.prompt_parts.user_instruction, color: 'blue' },
          { key: 'markdown_content', data: promptPreview.prompt_parts.markdown_content, color: 'emerald' },
          { key: 'layout_json', data: promptPreview.prompt_parts.layout_json, color: 'amber' },
          { key: 'image_note', data: promptPreview.prompt_parts.image_note, color: 'rose' },
        ] : [];

        const colorMap: Record<string, { bg: string; border: string; header: string; text: string; dot: string }> = {
          violet: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', header: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-400' },
          blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', header: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
          emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', header: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
          amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', header: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
          rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', header: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
        };

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">预览 Prompt</h2>
              <p className="text-zinc-400">查看将发送给 AI 模型的完整提示词</p>
            </div>

            {promptLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                <p className="text-zinc-400 mt-4">正在加载 Prompt...</p>
              </div>
            )}

            {promptPreview && !promptPreview.success && (
              <Alert variant="error" action={
                <Button variant="ghost" size="sm" onClick={handleLoadPromptPreview}>重试</Button>
              }>
                {promptPreview.message}
              </Alert>
            )}

            {promptPreview?.success && promptPreview.prompt_parts && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                  <span className="text-sm text-zinc-400">
                    总文本字符数: <span className="text-white font-mono">{promptPreview.total_text_chars?.toLocaleString()}</span>
                  </span>
                  <Badge variant="info">
                    {customProvider.enabled 
                      ? customProvider.modelName 
                      : AVAILABLE_MODELS.find(m => m.value === selectedModel)?.label
                    }
                  </Badge>
                </div>

                <div className="space-y-3">
                  {promptSections.map(({ key, data, color }) => {
                    const colors = colorMap[color];
                    return (
                      <div key={key} className={cn('rounded-xl border overflow-hidden', colors.border)}>
                        <button
                          onClick={() => toggleSection(key)}
                          className={cn('w-full px-4 py-3 flex items-center justify-between transition-colors', colors.header, 'hover:opacity-90')}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                            <span className={cn('font-medium', colors.text)}>{data.title}</span>
                            <span className="text-xs text-zinc-500 bg-black/20 px-2 py-0.5 rounded-full">
                              {data.char_count.toLocaleString()} 字符
                            </span>
                          </div>
                          <ChevronDown className={cn('w-5 h-5 text-zinc-500 transition-transform', expandedSections.has(key) && 'rotate-180')} />
                        </button>
                          {expandedSections.has(key) && (
                          <div className={cn(colors.bg, 'transition-all duration-200')}>
                              <div className="p-4">
                                {data.note ? (
                                  <p className="text-zinc-400 italic">{data.note}</p>
                                ) : (
                                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap break-words max-h-48 overflow-auto font-mono bg-black/20 rounded-lg p-3 scrollbar-thin">
                                    {data.content}
                                  </pre>
                                )}
                              </div>
                          </div>
                          )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 text-xs pt-2">
                  {promptSections.map(({ key, data, color }) => (
                    <span key={key} className="flex items-center gap-1.5 text-zinc-500">
                      <span className={cn('w-2 h-2 rounded-full', colorMap[color].dot)} />
                      {data.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setCurrentStep(3)} icon={<ChevronLeft className="w-4 h-4" />} size="lg" className="flex-1">
                上一步
              </Button>
              <Button onClick={() => setCurrentStep(5)} disabled={!promptPreview?.success} icon={<ArrowRight className="w-4 h-4" />} size="lg" className="flex-1">
                下一步
              </Button>
            </div>
          </div>
        );

      // Step 5: 生成 HTML
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">生成 HTML</h2>
              <p className="text-zinc-400">
                使用 {customProvider.enabled 
                  ? customProvider.modelName 
                  : AVAILABLE_MODELS.find(m => m.value === selectedModel)?.label
                } 生成
              </p>
            </div>

            {!htmlResult?.success && (
              <Card className="p-12 text-center" glow>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary-400" />
                </div>
                <p className="text-zinc-400 mb-6">点击下方按钮，AI 将根据 OCR 识别结果生成 HTML 代码</p>
                <Button onClick={handleGenerateHtml} loading={htmlGenerating} icon={<Zap className="w-4 h-4" />} size="lg">
                  生成 HTML
                </Button>
              </Card>
            )}

            {htmlResult && !htmlResult.success && (
              <Alert variant="error" action={
                <Button variant="ghost" size="sm" onClick={handleGenerateHtml}>重试</Button>
              }>
                {htmlResult.message}
              </Alert>
            )}

            {htmlResult?.success && htmlResult.html && (
              <div className="space-y-4">
                {htmlResult.usage && (
                  <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                    <span className="text-sm text-zinc-400">
                      Token: <span className="text-white font-mono">{htmlResult.usage.total_tokens}</span>
                      <span className="text-zinc-600 ml-1">({htmlResult.usage.prompt_tokens} + {htmlResult.usage.completion_tokens})</span>
                    </span>
                    <Badge variant="info">{htmlResult.model}</Badge>
                  </div>
                )}

                {/* 视图切换 */}
                <div className="flex items-center gap-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  {[
                    { id: 'preview', label: '预览', icon: Eye },
                    { id: 'original', label: '原图', icon: Image },
                    { id: 'compare', label: '对比', icon: Columns },
                    { id: 'code', label: '代码', icon: FileCode },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setViewMode(id as typeof viewMode)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        viewMode === id ? 'bg-primary-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                  <div className="w-px h-6 bg-zinc-700 mx-1" />
                  <button onClick={copyHtmlToClipboard} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="复制代码">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={handleGenerateHtml} disabled={htmlGenerating} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="重新生成">
                    <RefreshCw className={cn('w-4 h-4', htmlGenerating && 'animate-spin')} />
                  </button>
                </div>

                {/* 内容区域 */}
                <div>
                  {viewMode === 'code' && (
                    <div className="bg-[#0d0d12] rounded-xl border border-zinc-800 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-xs text-zinc-500 ml-2">slide.html</span>
                      </div>
                      <pre className="p-4 text-sm text-zinc-300 overflow-auto max-h-[400px] font-mono">
                        <code>{htmlResult.html}</code>
                      </pre>
                    </div>
                  )}

                  {viewMode === 'original' && preview && (
                    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
                      <div className="relative h-[400px] flex items-center justify-center p-4">
                        <img src={preview} alt="原始图片" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                      </div>
                      <div className="px-4 py-2 border-t border-zinc-800 text-center">
                        <span className="text-xs text-zinc-500">📷 原始上传图片</span>
                      </div>
                    </div>
                  )}

                  {viewMode === 'compare' && preview && (
                    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
                      <div className="grid grid-cols-2 gap-px bg-zinc-800">
                        <div className="bg-zinc-900">
                          <div className="px-4 py-2 border-b border-zinc-800 text-center">
                            <span className="text-xs text-zinc-400 font-medium">📷 原始图片</span>
                          </div>
                          <div className="relative h-[300px] flex items-center justify-center p-2">
                            <img src={preview} alt="原始图片" className="max-w-full max-h-full object-contain rounded shadow" />
                          </div>
                        </div>
                        <div className="bg-zinc-900">
                          <div className="px-4 py-2 border-b border-zinc-800 text-center">
                            <span className="text-xs text-zinc-400 font-medium">✨ 生成的 HTML</span>
                          </div>
                          <div className="relative h-[300px] flex items-center justify-center overflow-hidden">
                            <div 
                              className="bg-white shadow-lg rounded-sm"
                              style={{ width: '960px', height: '540px', transform: 'scale(0.45)', transformOrigin: 'center center' }}
                            >
                              <iframe srcDoc={proxyImageUrls(htmlResult.html)} className="border-0" style={{ width: '960px', height: '540px' }} title="HTML Preview" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === 'preview' && (
                    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
                      <div 
                        className="relative w-full overflow-hidden flex items-center justify-center transition-all duration-300"
                        style={{ height: `${Math.max(200, 540 * previewScale + 40)}px` }}
                      >
                        <div 
                          className="bg-white shadow-2xl rounded-sm transition-transform duration-300"
                          style={{ width: '960px', height: '540px', transformOrigin: 'center center', transform: `scale(${previewScale})` }}
                        >
                          <iframe srcDoc={proxyImageUrls(htmlResult.html)} className="border-0" style={{ width: '960px', height: '540px' }} title="HTML Preview" />
                        </div>
                      </div>
                      <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">📐 720pt × 405pt (16:9)</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">缩放</span>
                          <input
                            type="range"
                            min="0.3"
                            max="1"
                            step="0.05"
                            value={previewScale}
                            onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-xs text-zinc-400 font-mono w-10 text-right">{Math.round(previewScale * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setCurrentStep(4)} icon={<ChevronLeft className="w-4 h-4" />} size="lg" className="flex-1">
                上一步
              </Button>
              <Button onClick={() => setCurrentStep(6)} disabled={!htmlResult?.success} icon={<ArrowRight className="w-4 h-4" />} size="lg" className="flex-1">
                下一步
              </Button>
            </div>
          </div>
        );

      // Step 6: 导出 PPTX
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">导出 PPTX</h2>
              <p className="text-zinc-400">将 HTML 转换为 PowerPoint 文件</p>
            </div>

            {!pptxResult?.success && (
              <Card className="p-12 text-center" glow>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                  <Download className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="text-zinc-400 mb-6">点击下方按钮，将 HTML 转换为可编辑的 PPTX 文件</p>
                <Button onClick={handleConvertPptx} loading={pptxConverting} disabled={!htmlResult?.html_file_path} icon={<Zap className="w-4 h-4" />} size="lg">
                  转换为 PPTX
                </Button>
              </Card>
            )}

            {pptxResult && !pptxResult.success && (
              <Alert variant="error" action={
                <Button variant="ghost" size="sm" onClick={handleConvertPptx}>重试</Button>
              }>
                {pptxResult.message}
              </Alert>
            )}

            {pptxResult?.success && (
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 p-8 text-center">
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">转换成功！</h3>
                  <p className="text-emerald-400/80 mb-6 text-sm">{pptxResult.pptx_file_path}</p>
                  <a
                    href={pptxResult.download_url}
                    download
                    className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-500/25"
                  >
                    <Download className="w-5 h-5" />
                    下载 PPTX 文件
                    <ExternalLink className="w-4 h-4 opacity-60" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setCurrentStep(5)} icon={<ChevronLeft className="w-4 h-4" />} size="lg" className="flex-1">
                上一步
              </Button>
              <Button variant="outline" onClick={handleReset} icon={<RefreshCw className="w-4 h-4" />} size="lg" className="flex-1">
                重新开始
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============ 主渲染 ============
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* 背景效果 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      </div>

      {/* 头部 */}
      <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl bg-[#0a0a0f]/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ReDeck</h1>
              <p className="text-xs text-zinc-500">Image to PPTX Workflow</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} icon={<RefreshCw className="w-4 h-4" />}>
            重置
          </Button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {renderStepIndicator()}

        <Card className="p-8" glow>
            {renderStepContent()}
        </Card>
      </main>

      {/* 底部 */}
      <footer className="relative z-10 text-center py-8">
        <p className="text-sm text-zinc-600">ReDeck Workflow © 2024</p>
      </footer>
    </div>
  );
}
