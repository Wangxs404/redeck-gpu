/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 启用 standalone 输出模式，用于 Docker 部署
  // 这会生成一个独立的 server.js 文件，包含所有依赖
  output: 'standalone',
}

module.exports = nextConfig

