# 更新日志：OCR 图片命名优化 (v1.1)

**更新日期**: 2025-12-02

---

## 更新内容

### 问题背景

MinerU OCR 输出的图片文件使用 64 字符的 SHA256 hash 命名：

```
# 之前
images/7fa70a46f6578c7a6c2ae83ac72a2adafaaddfda5e1d7c2ffc71b061a777d279.jpg
```

这导致：
- LLM 生成时 token 消耗高
- LLM 容易复制出错，导致图片路径无效
- 可读性差

### 解决方案

在 OCR 完成后自动将图片重命名为简洁的序号格式：

```
# 之后
images/img_01.jpg
images/img_02.jpg
```

---

## 对前端的影响

### ✅ 无需修改代码

此更新为**后端内部优化**，对前端 API 调用**完全透明**：

| 接口 | 请求格式 | 响应格式 | 影响 |
|------|----------|----------|------|
| `POST /upload` | 不变 | 不变 | ❌ 无 |
| `POST /ocr/process` | 不变 | 新增字段 | ⚠️ 微小 |
| `POST /slides/html` | 不变 | 不变 | ❌ 无 |
| `POST /slides/pptx` | 不变 | 不变 | ❌ 无 |

### OCR 接口响应变化

`POST /ocr/process` 响应新增一个可选字段：

```json
{
  "success": true,
  "message": "MinerU 处理成功",
  "outputPath": "output/2025-12-02/uuid",
  "input_file": "input/2025-12-02/uuid.png",
  "result": { ... },
  "renamed_images": 4    // ← 新增：重命名的图片数量
}
```

**前端无需处理此字段**，仅供调试参考。

---

## 预期收益

| 指标 | 之前 | 之后 | 改善 |
|------|------|------|------|
| 单张图片引用长度 | ~80 字符 | ~12 字符 | **85%↓** |
| LLM Token 消耗 | 高 | 低 | **50%↓** |
| 图片路径错误率 | 高 | 低 | **显著降低** |
| HTML 生成质量 | 不稳定 | 稳定 | **提升** |

---

## 验证方法

上传新图片测试，检查 OCR 输出目录：

```
output/2025-12-02/{uuid}/{uuid}/auto/images/
├── img_01.jpg  ← 新格式
├── img_02.jpg
└── img_03.jpg
```

检查生成的 Markdown 文件：

```markdown
# 之前
![](images/7fa70a46f6578c7a6c2ae83ac72a2adafaaddfda5e1d7c2ffc71b061a777d279.jpg)

# 之后
![](images/img_01.jpg)
```

---

## 兼容性说明

| 场景 | 兼容性 |
|------|--------|
| 新上传的图片 | ✅ 自动使用新命名 |
| 已存在的 OCR 结果 | ✅ 保持原有 hash 命名，不受影响 |
| 前端现有代码 | ✅ 无需任何修改 |
| SDK (`redeck-sdk.ts`) | ✅ 无需更新 |

---

## 技术实现

新增函数 `simplify_ocr_output()`，在 MinerU 执行完成后自动：

1. 扫描 `images/` 目录中的图片文件
2. 按顺序重命名为 `img_01.jpg`, `img_02.jpg`, ...
3. 更新 `.md` 文件中的图片引用
4. 更新 `_middle.json` 等 JSON 文件中的引用

---

## 回滚方法

如需回滚，注释掉 `main.py` 中的以下代码：

```python
# 在 /ocr/process 接口中
# rename_mapping = simplify_ocr_output(output_dir)
```

重启后端服务即可。

---

## 补丁：修复直接文件名引用问题 (v1.1.1)

**问题**：LLM 有时会生成 `<img src="img_04.jpg">` 而不是 `<img src="images/img_04.jpg">`，导致图片路径解析失败。

**修复**：在 `replace_html_image_paths` 函数中新增第三种匹配模式：

```python
# 情况3: src="img_01.jpg" (直接文件名，无 images/ 前缀)
pattern3 = r'src=["\'](?!http|/|images/)(img_\d+\.(jpg|jpeg|png|webp|gif))["\']'
```

现在会自动将 `img_04.jpg` 转换为完整的 HTTP URL。

---

## 补丁：关闭表格和公式解析 (v1.1.2)

**问题**：
- `html2pptx.js` 暂不支持 `<table>` 元素转换，导致表格不显示
- 公式解析会生成额外的图片文件，增加 LLM 处理复杂度

**修复**：在 MinerU 命令中关闭表格和公式解析：

```python
cmd = [
    mineru_path,
    "-p", input_path,
    "-o", output_path,
    "-t", "false",  # 关闭表格解析
    "-f", "false",  # 关闭公式解析
    "-l", "ch",     # 指定中文语言
]
```

**效果**：
- 表格内容将作为纯文本提取，由 LLM 自行决定如何排版
- 公式将作为文本识别，避免生成额外图片
- 中文识别准确率提升

