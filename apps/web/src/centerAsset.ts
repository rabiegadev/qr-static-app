/** Canvas → PNG data URL for qr-code-styling ` image` field (transparent background). */
export function emojiOrTextToDataUrl(text: string, maxFont = 72): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx || !text.trim()) return ''
  let fontSize = maxFont
  ctx.font = `${fontSize}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
  let w = Math.ceil(ctx.measureText(text).width) + 24
  let h = fontSize + 24
  if (w > 512) {
    fontSize = Math.max(24, Math.floor((fontSize * 512) / w))
    ctx.font = `${fontSize}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
    w = Math.ceil(ctx.measureText(text).width) + 24
    h = fontSize + 24
  }
  canvas.width = w
  canvas.height = h
  ctx.font = `${fontSize}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(text, w / 2, h / 2)
  return canvas.toDataURL('image/png')
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('read-failed'))
    r.readAsDataURL(file)
  })
}
