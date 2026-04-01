import type { Options } from 'qr-code-styling'
import QRCodeStyling from 'qr-code-styling'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type ExportCanvasBg = 'transparent' | 'editor'

export interface ExportCaptionSpec {
  include: boolean
  text: string
  position: 'above' | 'below'
  fontPx: number
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
}

export interface ExportEditorBg {
  gradient: boolean
  c1: string
  c2: string
}

export async function exportComposedQrPng(
  qrOptions: Options,
  qrPixelSize: number,
  paddingFraction: number,
  canvasBg: ExportCanvasBg,
  editorBg: ExportEditorBg,
  caption: ExportCaptionSpec,
): Promise<void> {
  const qr = new QRCodeStyling({
    ...qrOptions,
    width: qrPixelSize,
    height: qrPixelSize,
    type: 'canvas',
  })

  const raw = await qr.getRawData('png')
  if (!raw || !(raw instanceof Blob)) return

  const bmp = await createImageBitmap(raw)
  const pad = Math.max(12, Math.round(qrPixelSize * paddingFraction))
  const capGap = Math.round(pad * 0.6)
  const capText = caption.include ? caption.text.trim() : ''

  let capBlockH = 0
  let capW = 0
  const measure = document.createElement('canvas').getContext('2d')
  if (capText && measure) {
    const weight = caption.bold ? '700' : '500'
    const style = caption.italic ? 'italic ' : ''
    measure.font = `${style}${weight} ${caption.fontPx}px system-ui, "Segoe UI", sans-serif`
    capW = Math.ceil(measure.measureText(capText).width)
    capBlockH = Math.ceil(caption.fontPx * 1.35) + capGap
  }

  const contentW = Math.max(qrPixelSize, capW + pad)
  let y = pad
  const totalW = contentW + pad * 2

  const capAbove = capText && caption.position === 'above'
  const capBelow = capText && caption.position === 'below'

  let totalH = pad * 2 + qrPixelSize
  if (capAbove) totalH += capBlockH
  if (capBelow) totalH += capBlockH

  const canvas = document.createElement('canvas')
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (canvasBg === 'editor') {
    if (editorBg.gradient) {
      const g = ctx.createLinearGradient(0, 0, totalW, 0)
      g.addColorStop(0, editorBg.c1)
      g.addColorStop(1, editorBg.c2)
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = editorBg.c1
    }
    ctx.fillRect(0, 0, totalW, totalH)
  }

  const qrX = (totalW - qrPixelSize) / 2
  if (capAbove) {
    drawCaption(ctx, capText, caption, totalW / 2, y + caption.fontPx * 1.05, totalW)
    y += capBlockH
  }

  ctx.drawImage(bmp, qrX, y, qrPixelSize, qrPixelSize)
  y += qrPixelSize

  if (capBelow) {
    y += capGap
    drawCaption(ctx, capText, caption, totalW / 2, y + caption.fontPx * 1.05, totalW)
  }

  const name =
    canvasBg === 'transparent'
      ? `qr-${qrPixelSize}-transparent.png`
      : `qr-${qrPixelSize}-bg.png`

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, name)
  }, 'image/png')
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  c: ExportCaptionSpec,
  x: number,
  y: number,
  maxW: number,
): void {
  const weight = c.bold ? '700' : '500'
  const style = c.italic ? 'italic ' : ''
  ctx.font = `${style}${weight} ${c.fontPx}px system-ui, "Segoe UI", sans-serif`
  ctx.fillStyle = c.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const lines = wrapText(ctx, text, maxW - 24)
  let ly = y
  for (const line of lines) {
    ctx.fillText(line, x, ly)
    if (c.underline) {
      const m = ctx.measureText(line)
      const uy = ly + 2
      ctx.strokeStyle = c.color
      ctx.lineWidth = Math.max(1, c.fontPx / 14)
      ctx.beginPath()
      ctx.moveTo(x - m.width / 2, uy)
      ctx.lineTo(x + m.width / 2, uy)
      ctx.stroke()
    }
    ly += c.fontPx * 1.25
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  if (words.length === 0) return []
  const lines: string[] = []
  let line = words[0] ?? ''
  for (let i = 1; i < words.length; i++) {
    const w = words[i]
    const test = `${line} ${w}`
    if (ctx.measureText(test).width < maxWidth) line = test
    else {
      lines.push(line)
      line = w ?? ''
    }
  }
  lines.push(line)
  return lines
}
