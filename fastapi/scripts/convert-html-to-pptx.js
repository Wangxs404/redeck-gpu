/**
 * HTML to PPTX Converter CLI
 * 
 * Usage:
 *   node convert-html-to-pptx.js <html_file> <output_pptx> [--tmp-dir <dir>]
 * 
 * Example:
 *   node convert-html-to-pptx.js slide.html output.pptx --tmp-dir /tmp/pptx
 */

const path = require('path');
const fs = require('fs');
const html2pptx = require('./html2pptx');

/**
 * 预处理 HTML：将 HTTP 图片 URL 替换为本地文件路径
 * 这样 Playwright 可以直接加载本地图片，避免网络超时
 * 
 * 支持的 URL 格式：
 * - http://localhost:8000/static/output/...
 * - http://127.0.0.1:8000/static/output/...
 * - http://72.60.226.25:8000/static/output/...
 * - https://api.video2ppt.com/static/output/...
 * - 任意域名/IP + 端口 + /static/output/ 前缀
 */
function preprocessHtml(htmlFile) {
    const htmlDir = path.dirname(htmlFile);
    let htmlContent = fs.readFileSync(htmlFile, 'utf-8');
    
    // 通用正则：匹配任意 http/https + 域名/IP + 可选端口 + /static/output/ 路径
    // 图片 URL 格式: http(s)://任意主机:端口/static/output/2025-11-26/uuid/uuid/auto/images/xxx.jpg
    // 需要转换为: 相对于 HTML 文件的本地路径 (images/xxx.jpg)
    htmlContent = htmlContent.replace(
        /https?:\/\/[^\/]+\/static\/output\/([^"']+)/g,
        (match, relativePath) => {
            // 从 output 目录开始的相对路径
            // HTML 文件位于 output/date/uuid/uuid/auto/uuid.html
            // 图片位于 output/date/uuid/uuid/auto/images/xxx.jpg
            // 所以图片相对于 HTML 的路径是 images/xxx.jpg
            const parts = relativePath.split('/');
            // 找到 images 目录的位置
            const imagesIndex = parts.indexOf('images');
            if (imagesIndex !== -1) {
                const imageRelativePath = parts.slice(imagesIndex).join('/');
                console.log(`[preprocessHtml] 替换图片路径: ${match.substring(0, 50)}... → ${imageRelativePath}`);
                return imageRelativePath;
            }
            // 如果找不到 images，返回原始路径（可能是其他资源）
            console.warn(`[preprocessHtml] 未找到 images 目录，保留原路径: ${match}`);
            return match;
        }
    );
    
    // 创建临时 HTML 文件
    const tempHtmlFile = htmlFile.replace('.html', '_temp.html');
    fs.writeFileSync(tempHtmlFile, htmlContent, 'utf-8');
    
    console.log(`[preprocessHtml] 临时文件已创建: ${tempHtmlFile}`);
    
    return tempHtmlFile;
}

/**
 * 清理临时文件
 */
function cleanupTempFile(tempFile) {
    try {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    } catch (e) {
        // 忽略清理错误
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error(JSON.stringify({
            success: false,
            error: 'Usage: node convert-html-to-pptx.js <html_file> <output_pptx> [--tmp-dir <dir>]'
        }));
        process.exit(1);
    }
    
    const htmlFile = args[0];
    const outputFile = args[1];
    
    // Parse optional arguments
    let tmpDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
    for (let i = 2; i < args.length; i++) {
        if (args[i] === '--tmp-dir' && args[i + 1]) {
            tmpDir = args[i + 1];
            i++;
        }
    }
    
    let tempHtmlFile = null;
    
    try {
        // 预处理 HTML，将 HTTP 图片 URL 替换为本地路径
        tempHtmlFile = preprocessHtml(htmlFile);
        
        // Dynamic import pptxgenjs
        const pptxgen = require('pptxgenjs');
        const pptx = new pptxgen();
        
        // Set 16:9 layout (matches 720pt x 405pt HTML dimensions)
        pptx.layout = 'LAYOUT_16x9';
        pptx.author = 'ReDeck';
        pptx.title = 'Generated Presentation';
        
        // Convert HTML to slide (使用预处理后的临时文件)
        const { slide, placeholders } = await html2pptx(tempHtmlFile, pptx, { tmpDir });
        
        // Save the presentation
        await pptx.writeFile({ fileName: outputFile });
        
        // Output success result as JSON
        console.log(JSON.stringify({
            success: true,
            message: 'PPTX generated successfully',
            output_file: outputFile,
            placeholders: placeholders
        }));
        
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: `${htmlFile}: ${error.message}`,
            details: error.stack
        }));
        process.exit(1);
    } finally {
        // 清理临时文件
        if (tempHtmlFile) {
            cleanupTempFile(tempHtmlFile);
        }
    }
}

main();

