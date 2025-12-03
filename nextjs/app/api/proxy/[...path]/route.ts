import { NextRequest, NextResponse } from 'next/server';

// 服务端使用的后端地址（不暴露给客户端）
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * 通用代理处理函数
 * 将请求转发到 FastAPI 后端
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const pathStr = pathSegments.join('/');
  const targetUrl = `${BACKEND_URL}/${pathStr}`;

  try {
    const headers: HeadersInit = {};
    
    // 转发必要的请求头
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // 处理请求体
    if (method !== 'GET' && method !== 'HEAD') {
      if (contentType?.includes('multipart/form-data')) {
        // FormData 需要特殊处理，让 fetch 自动设置 boundary
        const formData = await request.formData();
        fetchOptions.body = formData;
        delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
      } else if (contentType?.includes('application/json')) {
        fetchOptions.body = await request.text();
      } else {
        fetchOptions.body = await request.arrayBuffer();
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // 获取响应内容
    const responseContentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // 根据内容类型处理响应
    let responseBody: ArrayBuffer | string;
    if (responseContentType.includes('application/json')) {
      responseBody = await response.text();
    } else {
      responseBody = await response.arrayBuffer();
    }

    // 构建响应头
    const responseHeaders: HeadersInit = {
      'Content-Type': responseContentType,
    };

    // 对于静态文件添加缓存
    if (pathStr.startsWith('static/')) {
      responseHeaders['Cache-Control'] = 'public, max-age=3600';
    }

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Proxy ${method} error for ${targetUrl}:`, error);
    return NextResponse.json(
      { success: false, message: '后端服务连接失败' },
      { status: 502 }
    );
  }
}

/**
 * GET 请求代理
 * 用于静态文件、下载等
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

/**
 * POST 请求代理
 * 用于上传、API 调用等
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

/**
 * PUT 请求代理
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

/**
 * DELETE 请求代理
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}
