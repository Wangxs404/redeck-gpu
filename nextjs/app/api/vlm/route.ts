import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model } = body

    // 调用 FastAPI VLM 接口
    const response = await fetch(`${FASTAPI_URL}/vlm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt || 'hi, who are you',
        model: model || 'openai/gpt-4o-mini'
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
    console.error('VLM API 路由错误:', error)
    
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

