'use client'

import { useState, useRef, ChangeEvent } from 'react'
import './ImageUpload.css'

interface UploadResponse {
  success: boolean
  message: string
  filePath?: string
  fileName?: string
  uploadDate?: string
}

interface MinerUResponse {
  success: boolean
  message: string
  outputPath?: string
  result?: any
}

interface SlidesResponse {
  success: boolean
  message?: string
  html?: string
  model?: string
  usage?: any
}

type Step = 'upload' | 'ocr' | 'slides'

export default function ImageUpload() {
  const [activeStep, setActiveStep] = useState<Step>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<MinerUResponse | null>(null)
  const [slidesProcessing, setSlidesProcessing] = useState(false)
  const [slidesResult, setSlidesResult] = useState<SlidesResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setResult({
          success: false,
          message: '请选择图片文件（JPG、PNG、GIF 等）'
        })
        return
      }

      // 验证文件大小（限制为 10MB）
      if (file.size > 10 * 1024 * 1024) {
        setResult({
          success: false,
          message: '图片大小不能超过 10MB'
        })
        return
      }

      setSelectedFile(file)
      setResult(null)

      // 创建预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setResult({
        success: false,
        message: '请先选择图片'
      })
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data: UploadResponse = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: '图片上传成功！',
          filePath: data.filePath,
          fileName: data.fileName
        })
        // 保存上传的文件路径，用于后续处理
        setUploadedFilePath(data.filePath || null)
        setProcessResult(null)
        setSlidesResult(null)
        // 自动切换到 OCR 步骤
        setActiveStep('ocr')
        // 清空选择
        setSelectedFile(null)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setResult({
          success: false,
          message: data.message || '上传失败，请重试'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setUploadedFilePath(null)
    setProcessResult(null)
    setSlidesResult(null)
    setActiveStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStartMinerU = async () => {
    if (!uploadedFilePath) {
      setProcessResult({
        success: false,
        message: '未找到上传的文件路径'
      })
      return
    }

    setProcessing(true)
    setProcessResult(null)

    try {
      // 通过 Next.js API 路由调用 FastAPI（避免 CORS 问题）
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: uploadedFilePath
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data: MinerUResponse = await response.json()

      if (data.success) {
        setProcessResult({
          success: true,
          message: 'MinerU 处理成功！',
          outputPath: data.outputPath,
          result: data.result
        })
        // 自动切换到创建 Slides 步骤
        setActiveStep('slides')
      } else {
        setProcessResult({
          success: false,
          message: data.message || 'MinerU 处理失败，请重试'
        })
      }
    } catch (error) {
      console.error('处理错误:', error)
      let errorMessage = '处理失败'
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '无法连接到服务器，请确保 FastAPI 服务正在运行（http://localhost:8000）'
      } else if (error instanceof Error) {
        errorMessage = `处理失败: ${error.message}`
      }
      
      setProcessResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateSlides = async () => {
    if (!uploadedFilePath) {
      setSlidesResult({
        success: false,
        message: '未找到上传的文件路径'
      })
      return
    }

    setSlidesProcessing(true)
    setSlidesResult(null)

    try {
      // 通过 Next.js API 路由调用 FastAPI
      const response = await fetch('/api/slides/html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_path: uploadedFilePath
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data: SlidesResponse = await response.json()

      if (data.success && data.html) {
        setSlidesResult({
          success: true,
          html: data.html,
          model: data.model,
          usage: data.usage
        })
      } else {
        setSlidesResult({
          success: false,
          message: data.message || '创建 Slides 失败，请重试'
        })
      }
    } catch (error) {
      console.error('创建 Slides 错误:', error)
      let errorMessage = '创建 Slides 失败'

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '无法连接到服务器，请确保 FastAPI 服务正在运行（http://localhost:8000）'
      } else if (error instanceof Error) {
        errorMessage = `处理失败: ${error.message}`
      }

      setSlidesResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setSlidesProcessing(false)
    }
  }

  return (
    <div className="upload-container">
      {/* 步骤导航 Tab */}
      <div className="steps-tabs">
        <button
          className={`step-tab ${activeStep === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveStep('upload')}
        >
          1. 上传图片
        </button>
        <button
          className={`step-tab ${activeStep === 'ocr' ? 'active' : ''}`}
          onClick={() => uploadedFilePath && setActiveStep('ocr')}
          disabled={!uploadedFilePath}
        >
          2. OCR 识别
        </button>
        <button
          className={`step-tab ${activeStep === 'slides' ? 'active' : ''}`}
          onClick={() => uploadedFilePath && setActiveStep('slides')}
          disabled={!uploadedFilePath}
        >
          3. 创建 Slides
        </button>
      </div>

      {/* Step 1: 上传图片 */}
      {activeStep === 'upload' && (
        <div className="step-content">
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
              id="file-input"
              disabled={uploading}
            />
            <label htmlFor="file-input" className="file-label">
              {preview ? (
                <div className="preview-container">
                  <img src={preview} alt="预览" className="preview-image" />
                  <div className="preview-overlay">
                    <span className="preview-text">点击更换图片</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <svg
                    className="upload-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="upload-text">点击或拖拽图片到此处</p>
                  <p className="upload-hint">支持 JPG、PNG、GIF 等格式，最大 10MB</p>
                </div>
              )}
            </label>
          </div>

          {selectedFile && (
            <div className="file-info">
              <p className="file-name">
                <strong>文件名:</strong> {selectedFile.name}
              </p>
              <p className="file-size">
                <strong>大小:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="button-group">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn btn-primary"
            >
              {uploading ? '上传中...' : '上传图片'}
            </button>
            {selectedFile && (
              <button
                onClick={handleReset}
                disabled={uploading}
                className="btn btn-secondary"
              >
                重置
              </button>
            )}
          </div>

          {result && (
            <div className={`result-message ${result.success ? 'success' : 'error'}`}>
              <p>{result.message}</p>
              {result.success && result.filePath && (
                <p className="file-path">
                  <strong>保存路径:</strong> {result.filePath}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: OCR 识别 */}
      {activeStep === 'ocr' && (
        <div className="step-content">
          {result?.success && uploadedFilePath ? (
            <>
              <div className="step-info">
                <p>已上传图片: <strong>{result.filePath}</strong></p>
                <p className="step-hint">点击下方按钮开始 OCR 识别处理</p>
              </div>

              <div className="action-section">
                <button
                  onClick={handleStartMinerU}
                  disabled={processing}
                  className="btn btn-mineru"
                >
                  {processing ? '处理中...' : '启动 OCR (MinerU)'}
                </button>
              </div>

              {processResult && (
                <div className={`result-message ${processResult.success ? 'success' : 'error'}`}>
                  <p>{processResult.message}</p>
                  {processResult.success && processResult.outputPath && (
                    <p className="file-path">
                      <strong>输出路径:</strong> {processResult.outputPath}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="step-info">
              <p className="step-hint">请先完成步骤 1：上传图片</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: 创建 Slides */}
      {activeStep === 'slides' && (
        <div className="step-content">
          {uploadedFilePath ? (
            <>
              <div className="step-info">
                <p>准备创建 Slides</p>
                {processResult?.success && (
                  <p className="step-hint">OCR 识别已完成，点击下方按钮生成 HTML Slides</p>
                )}
                {!processResult?.success && (
                  <p className="step-hint warning">提示：建议先完成步骤 2 的 OCR 识别，以获得更好的结果</p>
                )}
              </div>

              <div className="action-section">
                <button
                  onClick={handleCreateSlides}
                  disabled={slidesProcessing}
                  className="btn btn-slides"
                >
                  {slidesProcessing ? '创建中...' : '创建 Slides'}
                </button>
              </div>

              {slidesResult && (
                <div className={`result-message ${slidesResult.success ? 'success' : 'error'}`}>
                  {slidesResult.success ? (
                    <>
                      <p>Slides 创建成功！</p>
                      {slidesResult.html && (
                        <div className="slides-preview">
                          <h3 className="slides-title">生成的 Slides 预览</h3>
                          <div
                            className="slides-frame"
                            dangerouslySetInnerHTML={{ __html: slidesResult.html }}
                          />
                          {slidesResult.usage && (
                            <p className="slides-usage">
                              <strong>Token 使用:</strong> {JSON.stringify(slidesResult.usage)}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p>{slidesResult.message || '创建失败'}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="step-info">
              <p className="step-hint">请先完成步骤 1：上传图片</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
