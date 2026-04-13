export type WeddingThemeId =
  | 'none'
  | 'classic-gold'
  | 'blush-romance'
  | 'sage-garden'
  | 'burgundy-gold'
  | 'champagne-lace'
  | 'hearts-confetti'
  | 'rings-elegant'
  | 'rustic-kraft'
  | 'art-deco-glam'
  | 'midnight-stars'
  | 'lavender-dream'
  | 'white-minimal'
  | 'peach-joy'

/** Klucz i18n: wTheme_none, wTheme_classicGold, … */
export function weddingThemeLabelKey(id: WeddingThemeId): string {
  const parts = id.split('-')
  const camel = parts[0]! + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  return `wTheme_${camel}`
}

export const WEDDING_THEME_ORDER: WeddingThemeId[] = [
  'none',
  'classic-gold',
  'blush-romance',
  'sage-garden',
  'burgundy-gold',
  'champagne-lace',
  'hearts-confetti',
  'rings-elegant',
  'rustic-kraft',
  'art-deco-glam',
  'midnight-stars',
  'lavender-dream',
  'white-minimal',
  'peach-joy',
]

export interface WeddingPalette {
  fg1: string
  fg2: string
  bg1: string
  bg2: string
  fgGradient: boolean
  bgGradient: boolean
}

/** Palety dopasowane do motywów — przycisk „Zastosuj kolory motywu” */
export const WEDDING_PALETTES: Partial<Record<WeddingThemeId, WeddingPalette>> = {
  'classic-gold': {
    fg1: '#9a7b2c',
    fg2: '#c9a227',
    bg1: '#fffef8',
    bg2: '#f5edd8',
    fgGradient: true,
    bgGradient: true,
  },
  'blush-romance': {
    fg1: '#be185d',
    fg2: '#ec4899',
    bg1: '#fff1f2',
    bg2: '#ffe4e6',
    fgGradient: true,
    bgGradient: true,
  },
  'sage-garden': {
    fg1: '#3f6212',
    fg2: '#65a30d',
    bg1: '#f7fee7',
    bg2: '#ecfccb',
    fgGradient: true,
    bgGradient: true,
  },
  'burgundy-gold': {
    fg1: '#7f1d1d',
    fg2: '#b45309',
    bg1: '#fff7ed',
    bg2: '#ffedd5',
    fgGradient: true,
    bgGradient: true,
  },
  'champagne-lace': {
    fg1: '#78716c',
    fg2: '#d6d3d1',
    bg1: '#fafaf9',
    bg2: '#e7e5e4',
    fgGradient: true,
    bgGradient: true,
  },
  'hearts-confetti': {
    fg1: '#db2777',
    fg2: '#e11d48',
    bg1: '#fff1f2',
    bg2: '#ffe4e6',
    fgGradient: true,
    bgGradient: false,
  },
  'rings-elegant': {
    fg1: '#475569',
    fg2: '#94a3b8',
    bg1: '#f8fafc',
    bg2: '#e2e8f0',
    fgGradient: true,
    bgGradient: true,
  },
  'rustic-kraft': {
    fg1: '#78350f',
    fg2: '#a16207',
    bg1: '#fef3c7',
    bg2: '#fde68a',
    fgGradient: false,
    bgGradient: true,
  },
  'art-deco-glam': {
    fg1: '#0f172a',
    fg2: '#b45309',
    bg1: '#fefce8',
    bg2: '#fef9c3',
    fgGradient: true,
    bgGradient: true,
  },
  'midnight-stars': {
    fg1: '#e2e8f0',
    fg2: '#fbbf24',
    bg1: '#1e1b4b',
    bg2: '#312e81',
    fgGradient: true,
    bgGradient: true,
  },
  'lavender-dream': {
    fg1: '#6b21a8',
    fg2: '#a855f7',
    bg1: '#faf5ff',
    bg2: '#f3e8ff',
    fgGradient: true,
    bgGradient: true,
  },
  'white-minimal': {
    fg1: '#334155',
    fg2: '#64748b',
    bg1: '#ffffff',
    bg2: '#f1f5f9',
    fgGradient: false,
    bgGradient: false,
  },
  'peach-joy': {
    fg1: '#c2410c',
    fg2: '#fb923c',
    bg1: '#fff7ed',
    bg2: '#ffedd5',
    fgGradient: true,
    bgGradient: true,
  },
}

export type CornerKind = 'none' | 'heart' | 'ring' | 'flower' | 'star'

export function weddingCornerKind(theme: WeddingThemeId): CornerKind {
  if (theme === 'none') return 'none'
  if (theme === 'hearts-confetti' || theme === 'blush-romance' || theme === 'peach-joy') return 'heart'
  if (theme === 'rings-elegant') return 'ring'
  if (theme === 'sage-garden' || theme === 'lavender-dream' || theme === 'champagne-lace') return 'flower'
  if (theme === 'midnight-stars' || theme === 'art-deco-glam') return 'star'
  return 'flower'
}

/** Szybkie wstawki do pola „napis weselny” (tekst wg języka interfejsu) */
export const WEDDING_QUICK_PHRASES: { id: string; pl: string; en: string }[] = [
  { id: 'menu', pl: 'Zeskanuj — menu wesela', en: 'Scan — wedding menu' },
  { id: 'rsvp', pl: 'Potwierdź obecność (RSVP)', en: 'RSVP — please respond' },
  { id: 'thanks', pl: 'Dziękujemy, że jesteście z nami!', en: 'Thank you for celebrating with us' },
  { id: 'photo', pl: 'Zdjęcia z wesela — kliknij', en: 'Wedding photos — tap here' },
  { id: 'gift', pl: 'Lista prezentów', en: 'Wedding gift list' },
  { id: 'love', pl: 'Z miłością: K & M', en: 'With love: K & M' },
  { id: 'date', pl: 'Do zobaczenia 12 · 09 · 2026', en: 'See you on 12 · 09 · 2026' },
  { id: 'dance', pl: 'Życzenia i playlista', en: 'Wishes & playlist' },
]

export function cornerSvg(kind: CornerKind, className: string): string {
  if (kind === 'none') return ''
  const base = `class="${className}" fill="currentColor" opacity="0.85"`
  switch (kind) {
    case 'heart':
      return `<svg viewBox="0 0 24 24" width="28" height="28" ${base} aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    case 'ring':
      return `<svg viewBox="0 0 24 24" width="28" height="28" ${base} aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.75"/></svg>`
    case 'star':
      return `<svg viewBox="0 0 24 24" width="26" height="26" ${base} aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
    case 'flower':
    default:
      return `<svg viewBox="0 0 24 24" width="26" height="26" ${base} aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="currentColor"/><circle cx="8" cy="14" r="3.2" fill="currentColor"/><circle cx="16" cy="14" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="2.4" fill="currentColor" opacity="0.9"/></svg>`
  }
}
