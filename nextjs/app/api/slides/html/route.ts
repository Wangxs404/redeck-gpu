import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image_path } = body

    if (!image_path) {
      return NextResponse.json(
        { success: false, message: '缺少 image_path 参数' },
        { status: 400 }
      )
    }

    // 调用 FastAPI Slides HTML 接口
    const response = await fetch(`${FASTAPI_URL}/slides/html`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_path: image_path
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          message: `FastAPI 错误: ${response.status} ${errorText}`
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('创建 Slides API 路由错误:', error)

    // 检查是否是连接错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          message: `无法连接到 FastAPI 服务 (${FASTAPI_URL})，请确保服务正在运行`
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}`
      },
      { status: 500 }
    )
  }
}

