'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, ArrowRight, Check, Loader2, 
  Download, RefreshCw, Sparkles, 
  Plus, Image as ImageIcon, Layout, FileType,
  Trash2, Maximize2, ChevronLeft, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============ 工具函数 ============
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/proxy';

const proxyImageUrls = (html: string): string => {
  return html.replace(
    /http:\/\/[^/]+\/static\//g,
    '/api/proxy/static/'
  );
};

// ============ 常量定义 ============
const MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', desc: '极速响应' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', desc: '高质量响应' },
  { id: 'openrouter/bert-nebulon-alpha', name: 'Bert Neburon Alpha', provider: 'OpenRouter', desc: '实验性模型' },
];

// ============ 类型定义 ============
// 简化状态：隐藏中间技术细节，统一为 processing
type ProjectStatus = 'processing' | 'success' | 'error';

interface Project {
  id: string;
  timestamp: number;
  status: ProjectStatus;
  file: File;
  previewUrl: string;
  uploadRes?: { file_path: string; filename: string };
  htmlRes?: { html: string; html_file_path: string; usage?: any };
  pptxRes?: { pptx_file_path: string; download_url: string };
  selectedModel: string;
  error?: string;
}

// ============ 组件：Initial Upload Card (白布风格) ============
const InitialUploadCard = ({ onFileSelect }: { onFileSelect: (file: File, modelId: string) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-3xl"
    >
      <div 
        className={cn(
          "relative overflow-hidden rounded-[32px] bg-[#18181b] border border-white/10 transition-all duration-300 group",
          isDragging ? "ring-2 ring-indigo-500 scale-[1.01]" : "hover:border-white/20"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0], selectedModel);
        }}
      >
        <div className="p-20 flex flex-col items-center justify-center text-center relative z-10">
          {/* 装饰性背景图片堆叠效果 */}
          <div className="mb-12 relative w-48 h-32">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-zinc-800 rounded-lg -rotate-6 opacity-60 transform origin-bottom scale-90 border border-white/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-zinc-700 rounded-lg rotate-6 opacity-80 transform origin-bottom scale-95 border border-white/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-zinc-900 rounded-lg shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-linear-to-br from-indigo-500/20 to-purple-500/20" />
               <ImageIcon className="w-10 h-10 text-white/50" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">上传设计草图或截图</h2>
          <p className="text-zinc-400 mb-8 max-w-lg text-lg">
            上传具有相似视觉风格或内容的图片。这可以是同一类型的插图，或者是同一人的自拍。
          </p>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0], selectedModel)}
          />
          
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            开始生成
          </button>

          {/* 模型选择器 - 移至左下角 */}
          <div className="absolute bottom-6 left-6 z-20">
            <div className="relative">
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-48 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg py-2 pl-8 pr-8 text-xs text-zinc-300 appearance-none focus:outline-none focus:border-blue-500/50 hover:bg-black/60 transition-colors cursor-pointer font-medium"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#18181b] text-white">
                    {m.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 底部微光效果 */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
};

// ============ 主页面组件 ============
export default function CreatePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarModel, setSidebarModel] = useState(MODELS[0].id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find(p => p.id === activeId);

  // 创建新项目并开始流程
  const startNewProject = async (file: File, modelId: string) => {
    const newId = Date.now().toString();
    const previewUrl = URL.createObjectURL(file);
    
    const newProject: Project = {
      id: newId,
      timestamp: Date.now(),
      status: 'processing', // 统一为处理中状态
      file,
      previewUrl,
      selectedModel: modelId,
    };

    setProjects(prev => [...prev, newProject]);
    setActiveId(newId);

    // 自动执行完整流程：上传 -> OCR -> 生成
    try {
      // 1. Upload
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.detail || '上传失败');
      
      // 更新中间数据但不改变状态
      updateProject(newId, { 
        uploadRes: { file_path: uploadData.file_path, filename: uploadData.filename }
      });
      
      // 2. OCR
      const ocrRes = await fetch(`${API_BASE}/ocr/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: uploadData.file_path }),
      });
      const ocrData = await ocrRes.json();
      
      if (!ocrData.success) {
        // 如果 OCR 失败但我们想继续尝试生成（容错），记录错误但继续
        console.warn('OCR Warning:', ocrData.detail);
      }

      // 3. Generate HTML
      const htmlRes = await fetch(`${API_BASE}/slides/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image_path: uploadData.file_path, 
          model: modelId 
        }),
      });
      
      const htmlData = await htmlRes.json();
      if (!htmlData.success) throw new Error(htmlData.message || '生成失败');
      
      updateProject(newId, { 
        status: 'success',
        htmlRes: {
          html: htmlData.html,
          html_file_path: htmlData.html_file_path,
          usage: htmlData.usage
        }
      });

    } catch (e) {
      updateProject(newId, { status: 'error', error: e instanceof Error ? e.message : '处理失败' });
    }
  };

  // 更新项目工具函数
  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // 重新生成
  const regenerate = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project?.uploadRes) return;

    updateProject(id, { status: 'processing', error: undefined });
    
    try {
      const res = await fetch(`${API_BASE}/slides/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image_path: project.uploadRes.file_path, 
          model: project.selectedModel 
        }),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message || '生成失败');
      
      updateProject(id, { 
        status: 'success',
        htmlRes: {
          html: data.html,
          html_file_path: data.html_file_path,
          usage: data.usage
        }
      });
    } catch (e) {
      updateProject(id, { status: 'error', error: e instanceof Error ? e.message : '生成失败' });
    }
  };

  // 转换为 PPTX
  const downloadPptx = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project?.htmlRes) return;

    if (project.pptxRes) {
      window.open(project.pptxRes.download_url, '_blank');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/slides/pptx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html_file_path: project.htmlRes.html_file_path }),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message || '转换失败');
      
      updateProject(id, {
        pptxRes: {
          pptx_file_path: data.pptx_file_path,
          download_url: data.download_url
        }
      });
      
      window.open(data.download_url, '_blank');
      
    } catch (e) {
      alert('导出失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  // 删除项目
  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (activeId === id) {
      setActiveId(newProjects[0]?.id || null);
    }
  };

  // ============ 渲染：侧边栏 ============
  const renderSidebar = () => (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0a0a0a] flex flex-col h-screen">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2 font-bold text-white/90">
           <Sparkles className="w-5 h-5 text-blue-500" />
           <span>Workspace</span>
         </div>
         <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
           <Layout className="w-4 h-4" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {projects.map((p, index) => (
          <div
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={cn(
              "group relative w-full aspect-video rounded-lg border overflow-hidden cursor-pointer transition-all duration-200",
              activeId === p.id 
                ? "border-blue-500 ring-2 ring-blue-500/20" 
                : "border-white/10 hover:border-white/30"
            )}
          >
            {/* 缩略图 */}
            <img src={p.previewUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="" />
            
            {/* 序号 */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-1.5 rounded text-[10px] font-mono text-zinc-300">
              {String(index + 1).padStart(2, '0')}
            </div>

            {/* 状态指示器 */}
            <div className="absolute bottom-2 right-2">
              {p.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
              {p.status === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
              {p.status === 'error' && <div className="w-2 h-2 rounded-full bg-red-500" />}
            </div>

            {/* 删除按钮 */}
            <button 
              onClick={(e) => deleteProject(e, p.id)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all text-zinc-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {activeId === p.id && (
              <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 space-y-3">
        {/* 侧边栏模型选择 */}
        <div className="relative">
          <select
             value={sidebarModel}
             onChange={(e) => setSidebarModel(e.target.value)}
             className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-xs text-zinc-400 appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id} className="bg-[#18181b] text-white">
                {m.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && startNewProject(e.target.files[0], sidebarModel)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white flex items-center justify-center gap-2 transition-all font-medium shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          New Slide
        </button>
      </div>
    </aside>
  );

  // ============ 渲染：主画布 ============
  const renderMainCanvas = () => {
    if (!activeProject) return <div className="flex-1" />;

    return (
      <div className="flex-1 flex flex-col h-screen bg-[#050505] overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur z-20">
          <div className="flex items-center gap-4">
             <h1 className="font-semibold text-white">
               {activeProject.status === 'success' ? 'Generated Slide' : 'Creating...'}
             </h1>
             {activeProject.status === 'success' && (
               <span className="px-2 py-0.5 rounded-full text-xs border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                 SUCCESS
               </span>
             )}
          </div>

          <div className="flex items-center gap-3">
            {activeProject.status === 'success' && (
              <>
                <button 
                  onClick={() => regenerate(activeProject.id)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新生成
                </button>
                <button 
                  onClick={() => downloadPptx(activeProject.id)}
                  className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出 PPTX
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            
            {/* State: Processing (Hidden details) */}
            {activeProject.status === 'processing' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center"
              >
                <div className="relative w-32 h-32 mb-8">
                   {/* 模糊的预览图 */}
                   <img src={activeProject.previewUrl} className="w-full h-full object-cover rounded-2xl opacity-40 blur-md" alt="" />
                   {/* 居中的 Loading 动画 */}
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                        <Loader2 className="w-12 h-12 text-white animate-spin relative z-10" />
                     </div>
                   </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">正在生成演示文稿</h3>
                <p className="text-zinc-400 max-w-xs">AI 正在分析您的设计并构建 PowerPoint 幻灯片，请稍候...</p>
              </motion.div>
            )}

            {/* State: Success / Preview */}
            {activeProject.status === 'success' && activeProject.htmlRes && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex items-center justify-center"
              >
                {/* PowerPoint 16:9 比例画布 (720pt × 405pt = 16:9) */}
                <div 
                  className="relative bg-white rounded-lg shadow-2xl overflow-hidden border border-white/10 ring-1 ring-black/50"
                  style={{
                    aspectRatio: '16 / 9',
                    width: 'min(90%, calc((100vh - 10rem) * 16 / 9))',
                    maxWidth: '1280px',
                    maxHeight: 'calc(100vh - 10rem)',
                  }}
                >
                   <iframe 
                     srcDoc={proxyImageUrls(activeProject.htmlRes.html)} 
                     className="w-full h-full border-0"
                     title="Preview"
                   />
                </div>
              </motion.div>
            )}

            {/* State: Error */}
            {activeProject.status === 'error' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md"
              >
                <h3 className="text-xl font-bold text-red-400 mb-2">生成失败</h3>
                <p className="text-zinc-400 mb-6">{activeProject.error || '未知错误'}</p>
                <button 
                  onClick={() => startNewProject(activeProject.file, activeProject.selectedModel)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-2 rounded-lg text-sm transition-colors"
                >
                  重试
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    );
  };

  // ============ 渲染：根布局 ============
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      {projects.length === 0 ? (
        // Mode 1: Initial Upload
        <div className="h-screen w-full flex flex-col items-center justify-center relative">
           <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
           
           <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
             <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
               <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
                 <Sparkles className="w-5 h-5" fill="currentColor" />
               </div>
               ReDeck
             </div>
           </header>

           <InitialUploadCard onFileSelect={startNewProject} />
           
           <footer className="absolute bottom-8 text-zinc-600 text-sm">
             Powered by MinerU & LLM Generation
           </footer>
        </div>
      ) : (
        // Mode 2: Workspace
        <div className="flex h-screen">
          {renderSidebar()}
          {renderMainCanvas()}
        </div>
      )}
    </div>
  );
}
