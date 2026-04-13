import type { Options } from 'qr-code-styling'
import QRCodeStyling from 'qr-code-styling'
import type { WeddingThemeId } from './weddingThemes'

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

export interface ExportWeddingSpec {
  theme: WeddingThemeId
  subline: string
  /** Prosta złota / akcentowa ramka wokół QR na PNG */
  drawOrnament: boolean
}

function weddingAccentColor(theme: WeddingThemeId): string {
  if (theme === 'midnight-stars') return '#fbbf24'
  if (theme === 'blush-romance' || theme === 'hearts-confetti' || theme === 'peach-joy') return '#be185d'
  if (theme === 'sage-garden') return '#3f6212'
  if (theme === 'lavender-dream') return '#7c3aed'
  return '#b8860b'
}

function drawWeddingOrnament(
  ctx: CanvasRenderingContext2D,
  qrX: number,
  qrY: number,
  qrSize: number,
  theme: WeddingThemeId,
): void {
  if (theme === 'none') return
  const accent = weddingAccentColor(theme)
  const pad = Math.max(6, Math.round(qrSize * 0.035))
  const x = qrX - pad
  const y = qrY - pad
  const w = qrSize + pad * 2
  const h = qrSize + pad * 2
  ctx.save()
  ctx.strokeStyle = accent
  ctx.lineWidth = Math.max(1.5, qrSize / 140)
  ctx.strokeRect(x, y, w, h)
  ctx.globalAlpha = 0.65
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6)
  ctx.globalAlpha = 1
  const r = Math.max(2, qrSize * 0.018)
  ctx.fillStyle = accent
  for (const [cx, cy] of [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ] as const) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawWeddingSubline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  color: string,
): void {
  const t = text.trim()
  if (!t) return
  ctx.save()
  ctx.font = '600 11px system-ui, "Segoe UI", sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 0.95
  const lines = wrapText(ctx, t, maxW - 16)
  let ly = y
  for (const line of lines) {
    ctx.fillText(line, x, ly)
    ly += 14
  }
  ctx.restore()
}

export async function exportComposedQrPng(
  qrOptions: Options,
  qrPixelSize: number,
  paddingFraction: number,
  canvasBg: ExportCanvasBg,
  editorBg: ExportEditorBg,
  caption: ExportCaptionSpec,
  wedding?: ExportWeddingSpec,
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
  const wedSub = wedding?.subline?.trim() ?? ''
  const theme = wedding?.theme ?? 'none'
  const wedAccent = weddingAccentColor(theme)

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

  let wedBlockH = 0
  let wedW = 0
  if (wedSub && measure) {
    measure.font = '600 11px system-ui, "Segoe UI", sans-serif'
    const wedLines = wrapText(measure, wedSub, qrPixelSize + 100)
    wedW = wedLines.reduce((m, line) => Math.max(m, measure.measureText(line).width), 0)
    wedBlockH = wedLines.length * 14 + Math.floor(capGap * 0.55)
  }

  const contentW = Math.max(qrPixelSize, capW + pad, wedW + pad)
  let y = pad
  const totalW = contentW + pad * 2

  const capAbove = capText && caption.position === 'above'
  const capBelow = capText && caption.position === 'below'

  let totalH = pad * 2 + qrPixelSize
  if (capAbove) totalH += capBlockH
  if (capBelow) totalH += capBlockH
  if (wedSub) totalH += wedBlockH

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

  if (wedSub) {
    drawWeddingSubline(ctx, wedSub, totalW / 2, y + 12, totalW, wedAccent)
    y += wedBlockH
  }

  ctx.drawImage(bmp, qrX, y, qrPixelSize, qrPixelSize)
  if (wedding?.drawOrnament && theme !== 'none') {
    drawWeddingOrnament(ctx, qrX, y, qrPixelSize, theme)
  }
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
