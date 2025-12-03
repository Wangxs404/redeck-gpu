'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, Sparkles, Image, Zap, 
  FileCode, Download, Shield, Clock, Globe,
  Star, Users, TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 backdrop-blur-xl bg-[#0a0a0f]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Repix.ai</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/workflow" 
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              开始使用
            </Link>
            <Link 
              href="/workflow"
              className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
            >
              免费试用
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">AI-Powered PowerPoint Clone</span>
          </div>
          
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Clone PowerPoint Slide
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-violet-400 to-primary-400">
                with Only Snapshot
            </span>
          </h1>
          
            {/* Subheading */}
            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform any PowerPoint slide screenshot into a fully editable PPTX file. 
              Powered by advanced OCR and AI technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/workflow"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105"
          >
                <Zap className="w-5 h-5" />
                立即开始
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
              <button className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all">
                <Image className="w-5 h-5" />
                查看演示
              </button>
        </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>4.9/5 用户评分</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-400" />
                <span>10,000+ 用户</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>99.9% 准确率</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[#111118]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              为什么选择 Repix.ai？
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              最先进的 AI 技术，让 PowerPoint 克隆变得简单高效
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Image,
                title: '一键上传',
                description: '只需上传截图，无需任何手动操作。支持 JPG、PNG 等多种格式。',
                color: 'primary'
              },
              {
                icon: Sparkles,
                title: 'AI 智能识别',
                description: '使用 MinerU OCR 和 GPT-4o 等先进模型，精确识别文字和布局。',
                color: 'violet'
              },
              {
                icon: FileCode,
                title: '完美还原',
                description: '生成的 PPTX 文件保持原始样式、字体、颜色和布局，可直接编辑。',
                color: 'emerald'
              },
              {
                icon: Zap,
                title: '极速处理',
                description: '平均处理时间仅需 30 秒，快速生成可用的 PowerPoint 文件。',
                color: 'amber'
              },
              {
                icon: Shield,
                title: '安全可靠',
                description: '所有文件处理均在本地完成，数据安全有保障，绝不泄露。',
                color: 'blue'
              },
              {
                icon: Globe,
                title: '多语言支持',
                description: '支持中文、英文等多种语言，准确识别各种文字内容。',
                color: 'rose'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
                violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              };

              return (
                <div
                  key={index}
                  className="bg-[#0a0a0f] border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10"
                >
                  <div className={`w-14 h-14 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} border flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
            </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              工作流程
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              简单三步，轻松完成 PowerPoint 克隆
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: '上传截图',
                description: '选择或拖拽 PowerPoint 截图到上传区域，支持多种图片格式。',
                icon: Image
              },
              {
                step: '02',
                title: 'AI 处理',
                description: '系统自动进行 OCR 识别和 AI 分析，生成标准 HTML 代码。',
                icon: Sparkles
              },
              {
                step: '03',
                title: '下载 PPTX',
                description: '一键转换为可编辑的 PPTX 文件，保持原始样式和布局。',
                icon: Download
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-[#111118] border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all">
                    <div className="text-6xl font-bold text-primary-500/20 mb-4">{item.step}</div>
                    <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-zinc-800">
                      <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-[#111118]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              简单透明的定价
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              一个价格，无限可能
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-primary-500/10 to-violet-500/10 border-2 border-primary-500/30 rounded-3xl p-8 relative overflow-hidden">
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-500 to-violet-500 text-white text-xs font-semibold px-4 py-1 rounded-bl-2xl rounded-tr-3xl">
                推荐
        </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">$20</span>
                  <span className="text-zinc-400">/月</span>
                </div>
                <p className="text-zinc-400 mb-8">专业版计划</p>

                <ul className="space-y-4 mb-8">
                  {[
                    '无限次 PowerPoint 克隆',
                    '支持所有图片格式',
                    '高精度 OCR 识别',
                    '多种 AI 模型选择',
                    '优先处理速度',
                    '7x24 技术支持',
                    '数据安全保障'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/workflow"
                  className="block w-full text-center bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105"
                >
                  立即开始使用
                </Link>

                <p className="text-center text-sm text-zinc-500 mt-4">
                  14 天免费试用，无需信用卡
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary-500/10 via-violet-500/10 to-primary-500/10 border border-primary-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              立即体验 Repix.ai，让 PowerPoint 克隆变得前所未有的简单
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/workflow"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105"
          >
                免费开始
                <ArrowRight className="w-5 h-5" />
          </Link>
              <button className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all">
                联系销售
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <FileCode className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Repix.ai</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Clone PowerPoint slide with only snapshot
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">产品</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="/workflow" className="hover:text-white transition-colors">工作流</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">功能</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">定价</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">支持</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">帮助中心</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">文档</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">联系我们</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">公司</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">关于我们</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">博客</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">隐私政策</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-zinc-500 text-sm">
              © 2024 Repix.ai. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Twitter</Link>
              <Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">GitHub</Link>
              <Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
