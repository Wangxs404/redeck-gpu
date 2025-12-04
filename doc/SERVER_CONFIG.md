# ReDeck GPU 服务器配置文档

## 服务器概述

本文档记录 ReDeck GPU 推理服务器的配置信息，用于部署支持 GPU 加速 OCR 的 FastAPI 服务。

---

## 1. 系统信息

| 项目 | 值 |
|------|-----|
| **操作系统** | Ubuntu 22.04.5 LTS (Jammy Jellyfish) |
| **内核版本** | 5.15.0-128-generic |
| **架构** | x86_64 |
| **虚拟化** | KVM (AMD-V) |
| **主机名** | gt-ubuntu22-04-cmd-v3-0-32gb-25m |

---

## 2. 硬件配置

### 2.1 CPU
| 项目 | 值 |
|------|-----|
| **型号** | AMD EPYC 7402 24-Core Processor |
| **核心数** | 10 核 |
| **线程数** | 10 线程 |
| **架构** | x86_64 |

### 2.2 内存
| 项目 | 值 |
|------|-----|
| **总内存** | 32 GB |
| **可用内存** | ~30 GB |
| **Swap** | 无 |

### 2.3 磁盘
| 挂载点 | 大小 | 已用 | 可用 | 使用率 |
|--------|------|------|------|--------|
| `/` | 39 GB | 12 GB | 28 GB | 29% |

### 2.4 GPU (关键)
| 项目 | 值 |
|------|-----|
| **型号** | NVIDIA GeForce RTX 4090 |
| **显存** | 24564 MiB (24 GB) |
| **驱动版本** | 550.142 |
| **CUDA 版本** | 12.4 |
| **功耗** | 11W / 450W |
| **温度** | 26°C |
| **状态** | 空闲 (0% 利用率) |

---

## 3. 网络配置

### 3.1 IP 地址
| 类型 | 地址 |
|------|------|
| **公网 IP** | 36.103.199.134 |
| **内网 IP** | 10.0.19.79 |
| **网络接口** | enp3s0 |
| **子网掩码** | /20 (255.255.240.0) |

### 3.2 已开放端口
| 端口 | 服务 | 说明 |
|------|------|------|
| 22 | SSH | 远程管理 |
| 53 | DNS | 本地 DNS 解析 |
| 9100 | node_exporter | Prometheus 监控 |
| 9835 | - | 待确认 |

---

## 4. 项目说明

### 4.1 项目概述

ReDeck 是一个图片转 PowerPoint 演示文稿工具，主要功能：
- 图片上传 → OCR 识别 → LLM 生成 HTML → 转换 PPTX

### 4.2 目录结构

```
/home/ubuntu/app/redeck-gpu/
├── doc/                    # 文档目录
├── fastapi/                # FastAPI 后端服务
│   ├── main.py            # 主应用
│   ├── .env               # 环境配置
│   ├── scripts/           # Node.js 转换脚本
│   ├── input/             # 上传文件目录
│   └── output/            # 输出文件目录
├── nextjs/                 # Next.js 前端
└── readme.md              # 项目说明
```

### 4.3 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| **后端** | FastAPI + Python | 异步 Web 框架 |
| **OCR** | MinerU | 当前使用云端 API，计划迁移到本地 GPU |
| **LLM** | OpenRouter API | 调用 GPT-4o/Claude 等模型 |
| **PPTX 生成** | PptxGenJS + Playwright | HTML 转 PowerPoint |
| **前端** | Next.js 14 | React 框架 |

---

## 5. 当前状态 vs 目标状态

### 5.1 当前状态 (CPU + Cloud API)
- OCR: 使用 MinerU 云端 API (`MINERU_API_KEY`)
- 无 GPU 加速
- 依赖外部服务

### 5.2 目标状态 (GPU 加速)
- OCR: 本地 MinerU + RTX 4090 GPU 加速
- 完全本地推理，降低延迟和成本
- 利用 24GB 显存处理大型文档

---

## 6. 部署计划 (待实施)

### 6.1 环境准备
- [ ] 安装 Python 虚拟环境
- [ ] 安装 MinerU (GPU 版本)
- [ ] 验证 CUDA 和 PyTorch 兼容性
- [ ] 安装 Node.js 和依赖

### 6.2 服务配置
- [ ] 配置 FastAPI 服务
- [ ] 设置 systemd 服务
- [ ] 配置反向代理 (Nginx/Traefik)
- [ ] SSL 证书配置

### 6.3 端口规划
| 端口 | 服务 | 说明 |
|------|------|------|
| 8000 | FastAPI | 后端 API 服务 |
| 3000 | Next.js | 前端开发服务 |
| 80/443 | Nginx | 生产环境反向代理 |

---

## 7. API 密钥配置

当前 `.env` 配置中的关键参数：

| 变量 | 说明 |
|------|------|
| `OPENROUTER_API_KEY` | OpenRouter LLM API 密钥 |
| `MINERU_API_KEY` | MinerU 云端 OCR 密钥 (GPU 部署后可移除) |
| `STATIC_BASE_URL` | 静态资源 URL (https://api.video2ppt.com) |
| `ALLOWED_ORIGINS` | CORS 允许的来源 |

---

## 8. 监控与维护

### 8.1 GPU 监控
```bash
# 实时 GPU 状态
watch -n 1 nvidia-smi

# GPU 利用率和显存
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv
```

### 8.2 系统资源
```bash
# 内存和 CPU
htop

# 磁盘空间
df -h
```

---

## 9. 注意事项

1. **显存管理**: RTX 4090 有 24GB 显存，MinerU 推理约需 4-8GB
2. **并发控制**: 需根据显存限制控制并发 OCR 任务数
3. **温度监控**: 长时间推理时注意 GPU 温度
4. **磁盘空间**: 定期清理 `output/` 目录的临时文件

---

*文档创建时间: 2025-12-04*
*最后更新: 2025-12-04*
