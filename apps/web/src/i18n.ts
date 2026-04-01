export type Lang = 'pl' | 'en'

type Dict = Record<string, string>

const pl: Dict = {
  brandLine: 'QR Generator by rabiegadevelopment.pl',
  brandSubtitle: 'rabiegadevelopment.pl',
  langPl: 'Polski',
  langEn: 'English',
  contentLabel: 'Treść kodu (URL lub tekst)',
  contentPlaceholder: 'https://example.com',
  fgGradient: 'Gradient kolorów modułów',
  fgColor: 'Kolor modułów',
  fgColor2: 'Drugi kolor (gradient)',
  bgGradient: 'Gradient tła kodu',
  bgColor: 'Kolor tła',
  bgColor2: 'Drugie tło (gradient)',
  dotsStyle: 'Kształt modułów',
  cornerOuter: 'Narożniki (zewnętrzne)',
  cornerInner: 'Narożniki (wewnętrzne)',
  qrShape: 'Kształt całego kodu',
  shapeSquare: 'Kwadrat',
  shapeCircle: 'Koło',
  centerMode: 'Środek kodu',
  centerNone: 'Brak',
  centerLogo: 'Logo (PNG / ICO)',
  centerEmoji: 'Emoji',
  centerText: 'Krótki napis',
  centerEmojiLabel: 'Emoji',
  centerTextLabel: 'Napis',
  centerScale: 'Rozmiar symbolu w kodzie',
  uploadLogo: 'Wgraj obraz',
  captionLabel: 'Napis obok kodu',
  captionPlaceholder: 'np. Zeskanuj mnie',
  captionPos: 'Pozycja napisu',
  captionAbove: 'Nad kodem',
  captionBelow: 'Pod kodem',
  captionSize: 'Rozmiar napisu',
  captionBold: 'Pogrubienie',
  captionItalic: 'Kursywa',
  captionUnderline: 'Podkreślenie',
  emojiSuggest: 'Szybki wybór emoji',
  exportTitle: 'Eksport PNG',
  exportBgMode: 'Tło pliku',
  exportBgColored: 'Kolor / gradient (jak poniżej)',
  exportBgTransparent: 'Przezroczyste',
  exportCaptionMode: 'Napis na grafice',
  exportCaptionWith: 'Z napisem',
  exportCaptionWithout: 'Bez napisu',
  exportSize: 'Rozmiar kodu (px)',
  download: 'Pobierz',
  presetColors: 'Szybki wybór — stosuje do zaznaczonego pola koloru',
  presetHint:
    'Kliknij pole koloru (obramowanie), potem wybierz próbkę. Drugie kliknięcie w to samo pole otwiera paletę.',
  errorCorrection: 'Korekcja błędów',
  ecAuto: 'Automatycznie (H przy logo)',
  colorTargetFg1: 'Kolor modułów',
  colorTargetFg2: 'Drugi kolor modułów',
  colorTargetBg1: 'Kolor tła kodu',
  colorTargetBg2: 'Drugie tło',
}

const en: Dict = {
  brandLine: 'QR Generator by rabiegadevelopment.pl',
  brandSubtitle: 'rabiegadevelopment.pl',
  langPl: 'Polish',
  langEn: 'English',
  contentLabel: 'Code content (URL or text)',
  contentPlaceholder: 'https://example.com',
  fgGradient: 'Module color gradient',
  fgColor: 'Module color',
  fgColor2: 'Second color (gradient)',
  bgGradient: 'Background gradient',
  bgColor: 'Background color',
  bgColor2: 'Second background (gradient)',
  dotsStyle: 'Dot style',
  cornerOuter: 'Outer corners',
  cornerInner: 'Inner corners',
  qrShape: 'Overall QR shape',
  shapeSquare: 'Square',
  shapeCircle: 'Circle',
  centerMode: 'Center of QR',
  centerNone: 'None',
  centerLogo: 'Logo (PNG / ICO)',
  centerEmoji: 'Emoji',
  centerText: 'Short label',
  centerEmojiLabel: 'Emoji',
  centerTextLabel: 'Label',
  centerScale: 'Inner symbol size',
  uploadLogo: 'Upload image',
  captionLabel: 'Caption',
  captionPlaceholder: 'e.g. Scan me',
  captionPos: 'Caption position',
  captionAbove: 'Above code',
  captionBelow: 'Below code',
  captionSize: 'Caption size',
  captionBold: 'Bold',
  captionItalic: 'Italic',
  captionUnderline: 'Underline',
  emojiSuggest: 'Emoji suggestions',
  exportTitle: 'Export PNG',
  exportBgMode: 'Image background',
  exportBgColored: 'Color / gradient (as below)',
  exportBgTransparent: 'Transparent',
  exportCaptionMode: 'Caption on image',
  exportCaptionWith: 'Include caption',
  exportCaptionWithout: 'QR only',
  exportSize: 'QR size (px)',
  download: 'Download',
  presetColors: 'Quick picks — applies to the selected color slot',
  presetHint:
    'Select a color slot (border), then tap a swatch. Click the same slot again to open the color picker.',
  errorCorrection: 'Error correction',
  ecAuto: 'Auto (H when using logo)',
  colorTargetFg1: 'Module color',
  colorTargetFg2: 'Second module color',
  colorTargetBg1: 'QR background',
  colorTargetBg2: 'Second background',
}

const dicts: Record<Lang, Dict> = { pl, en }

let currentLang: Lang =
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('pl') ? 'pl' : 'en'

export function getLang(): Lang {
  return currentLang
}

export function setLang(lang: Lang): void {
  currentLang = lang
  try {
    localStorage.setItem('qr-gen-lang', lang)
  } catch {
    /* ignore */
  }
}

export function initLangFromStorage(): void {
  try {
    const s = localStorage.getItem('qr-gen-lang') as Lang | null
    if (s === 'pl' || s === 'en') currentLang = s
  } catch {
    /* ignore */
  }
}

export function t(key: keyof typeof pl | string): string {
  const d = dicts[currentLang]
  const fall = dicts.en
  return d[key] ?? fall[key] ?? key
}
