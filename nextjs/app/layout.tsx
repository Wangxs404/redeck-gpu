import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HTML to PPTX Canvas',
  description: 'Convert HTML to Editable PowerPoint',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* 
          临时引入 Tailwind CSS CDN 以支持快速开发和预览。
          注意：生产环境建议使用 npm install tailwindcss 并配置 postcss。
        */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
