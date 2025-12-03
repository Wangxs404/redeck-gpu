import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'

// 允许的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// FastAPI 输入目录的绝对路径
const FASTAPI_INPUT_DIR = join(process.cwd(), '..', 'fastapi', 'input')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: '未找到文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: '不支持的文件类型，请上传图片文件（JPG、PNG、GIF、WEBP）' },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: '文件大小超过 10MB 限制' },
        { status: 400 }
      )
    }

    // 生成规范的文件存储路径
    // 格式: fastapi/input/YYYY-MM-DD/UUID-原文件名
    const now = new Date()
    const dateDir = now.toISOString().split('T')[0] // YYYY-MM-DD
    const fileId = randomUUID()
    const originalName = file.name
    const fileExtension = originalName.split('.').pop() || 'jpg'
    
    // 构建存储目录和文件路径
    const storageDir = join(FASTAPI_INPUT_DIR, dateDir)
    const fileName = `${fileId}.${fileExtension}`
    const filePath = join(storageDir, fileName)

    // 确保目录存在
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true })
    }

    // 将文件转换为 Buffer 并保存
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 返回相对路径（相对于 fastapi 目录）
    const relativePath = join('input', dateDir, fileName).replace(/\\/g, '/')

    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      filePath: relativePath,
      fileName: fileName,
      originalName: originalName,
      size: file.size,
      type: file.type,
      uploadDate: dateDir
    })
  } catch (error) {
    console.error('上传错误:', error)
    return NextResponse.json(
      {
        success: false,
        message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      },
      { status: 500 }
    )
  }
}

