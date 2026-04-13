import './style.css'
import QRCodeStyling from 'qr-code-styling'
import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  Options,
} from 'qr-code-styling/lib/types'
import { emojiOrTextToDataUrl, readFileAsDataUrl } from './centerAsset'
import { exportComposedQrPng } from './exportPng'
import { getLang, initLangFromStorage, setLang, t } from './i18n'
import type { WeddingThemeId } from './weddingThemes'
import {
  WEDDING_PALETTES,
  WEDDING_QUICK_PHRASES,
  WEDDING_THEME_ORDER,
  cornerSvg,
  weddingCornerKind,
  weddingThemeLabelKey,
} from './weddingThemes'

initLangFromStorage()

const PRESET_COLORS = [
  '#0f172a',
  '#1e293b',
  '#2563eb',
  '#7c3aed',
  '#c026d3',
  '#db2777',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#ffffff',
  '#e2e8f0',
  '#94a3b8',
]

const EMOJI_PRESETS = [
  '✨',
  '❤️',
  '🔗',
  '👍',
  '⭐',
  '🎉',
  '🏠',
  '📧',
  '📱',
  '🌐',
  '✅',
  '🎁',
  '🔐',
  '💳',
  '🛒',
  '☕',
  '🚀',
  '💡',
  '📍',
  '🔔',
  '👋',
  '💼',
  '🎵',
  '📷',
]

const DOT_TYPES: DotType[] = [
  'square',
  'dots',
  'rounded',
  'extra-rounded',
  'classy',
  'classy-rounded',
]

const CORNER_SQUARE: CornerSquareType[] = [
  'square',
  'dot',
  'extra-rounded',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
]

const CORNER_DOT: CornerDotType[] = ['square', 'dot', 'rounded', 'extra-rounded']

const PREVIEW_SIZE = 288

type ColorTarget = 'fg1' | 'fg2' | 'bg1' | 'bg2'
type CenterMode = 'none' | 'logo' | 'emoji' | 'text'

const PREVIEW_FRAME_CLASS =
  'rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px] transition-shadow duration-300 border-2 border-dashed border-violet-400/55 bg-slate-900/35'

const SITE_HREF = 'https://rabiegadevelopment.pl'
/** Podmień na właściwe adresy profili, gdy są gotowe */
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/rabiegadevelopment',
  instagram: 'https://www.instagram.com/rabiegadevelopment/',
  youtube: 'https://www.youtube.com/@rabiegadevelopment',
} as const

interface State {
  data: string
  fgGradient: boolean
  fg1: string
  fg2: string
  bgGradient: boolean
  bg1: string
  bg2: string
  dots: DotType
  cornerSquare: CornerSquareType
  cornerDot: CornerDotType
  shape: 'square' | 'circle'
  centerMode: CenterMode
  logoDataUrl: string | null
  emojiText: string
  centerText: string
  imageSize: number
  caption: string
  captionPos: 'above' | 'below'
  captionFontPx: number
  captionBold: boolean
  captionItalic: boolean
  captionUnderline: boolean
  activeColorTarget: ColorTarget
  weddingTheme: WeddingThemeId
  weddingSubline: string
  weddingShowCorners: boolean
  weddingAutoPalette: boolean
  weddingExportOrnament: boolean
}

const state: State = {
  data: 'https://rabiegadevelopment.pl',
  fgGradient: false,
  fg1: '#7c3aed',
  fg2: '#2563eb',
  bgGradient: false,
  bg1: '#ffffff',
  bg2: '#e2e8f0',
  dots: 'rounded',
  cornerSquare: 'extra-rounded',
  cornerDot: 'dot',
  shape: 'square',
  centerMode: 'none',
  logoDataUrl: null,
  emojiText: '✨',
  centerText: 'SCAN',
  imageSize: 0.32,
  caption: '',
  captionPos: 'below',
  captionFontPx: 15,
  captionBold: false,
  captionItalic: false,
  captionUnderline: false,
  activeColorTarget: 'fg1',
  weddingTheme: 'none',
  weddingSubline: '',
  weddingShowCorners: true,
  weddingAutoPalette: true,
  weddingExportOrnament: true,
}

let debounceT = 0

function getCenterImage(): string | undefined {
  if (state.centerMode === 'logo' && state.logoDataUrl) return state.logoDataUrl
  if (state.centerMode === 'emoji' && state.emojiText.trim()) {
    return emojiOrTextToDataUrl(state.emojiText.trim().slice(0, 8), 80)
  }
  if (state.centerMode === 'text' && state.centerText.trim()) {
    const txt = state.centerText.trim().slice(0, 14)
    const fs = txt.length > 6 ? 36 : 52
    return emojiOrTextToDataUrl(txt, fs)
  }
  return undefined
}

function moduleStyle():
  | { type: DotType; color: string }
  | {
      type: DotType
      gradient: {
        type: 'linear'
        rotation: number
        colorStops: { offset: number; color: string }[]
      }
    } {
  if (state.fgGradient) {
    return {
      type: state.dots,
      gradient: {
        type: 'linear',
        rotation: 0,
        colorStops: [
          { offset: 0, color: state.fg1 },
          { offset: 1, color: state.fg2 },
        ],
      },
    }
  }
  return { type: state.dots, color: state.fg1 }
}

function cornerStyle():
  | { type: CornerSquareType; color: string }
  | {
      type: CornerSquareType
      gradient: {
        type: 'linear'
        rotation: number
        colorStops: { offset: number; color: string }[]
      }
    } {
  const m = moduleStyle()
  if ('gradient' in m) {
    return { type: state.cornerSquare, gradient: m.gradient }
  }
  return { type: state.cornerSquare, color: state.fg1 }
}

function innerCornerStyle():
  | { type: CornerDotType; color: string }
  | {
      type: CornerDotType
      gradient: {
        type: 'linear'
        rotation: number
        colorStops: { offset: number; color: string }[]
      }
    } {
  const m = moduleStyle()
  if ('gradient' in m) {
    return { type: state.cornerDot, gradient: m.gradient }
  }
  return { type: state.cornerDot, color: state.fg1 }
}

function backgroundStyle():
  | { color: string }
  | {
      color?: string
      gradient: {
        type: 'linear'
        rotation: number
        colorStops: { offset: number; color: string }[]
      }
    } {
  if (state.bgGradient) {
    return {
      gradient: {
        type: 'linear',
        rotation: 0,
        colorStops: [
          { offset: 0, color: state.bg1 },
          { offset: 1, color: state.bg2 },
        ],
      },
    }
  }
  return { color: state.bg1 }
}

function buildOptions(width: number, transparentBg: boolean): Options {
  const center = getCenterImage()
  const fg = moduleStyle()
  const dotsOptions =
    'gradient' in fg
      ? { type: fg.type, gradient: fg.gradient }
      : { type: fg.type, color: fg.color }
  const cornersSquareOptions = cornerStyle()
  const cornersDotOptions = innerCornerStyle()
  const bg = transparentBg ? { color: '#00000000' } : backgroundStyle()

  const opts: Options = {
    width,
    height: width,
    type: 'svg',
    data: state.data.trim() || ' ',
    margin: 6,
    shape: state.shape,
    qrOptions: {
      errorCorrectionLevel: center ? 'H' : 'Q',
    },
    dotsOptions,
    cornersSquareOptions,
    cornersDotOptions,
    backgroundOptions: bg,
  }

  if (center) {
    opts.image = center
    opts.imageOptions = {
      hideBackgroundDots: true,
      imageSize: state.imageSize,
      margin: 3,
      crossOrigin: 'anonymous',
    }
  }

  return opts
}

function mount(): void {
  const root = document.querySelector<HTMLDivElement>('#app')
  if (!root) return

  root.innerHTML = `
    <div class="min-h-dvh flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.22),transparent)] pointer-events-none"></div>
      <div class="relative z-10 flex flex-1 flex-col min-h-0 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
        <header class="text-center mb-10 sm:mb-14 shrink-0">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-violet-200/90 mb-4">
            <span class="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            <span id="chip-ec"></span>
          </div>
          <h1 class="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-center max-w-3xl mx-auto leading-snug">
            <a
              href="${SITE_HREF}"
              target="_blank"
              rel="noopener noreferrer"
              id="brand-link"
              class="inline-block no-underline cursor-pointer rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500/60"
            >
              <span class="bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-transparent" id="brand-line"></span>
            </a>
          </h1>
          <p class="mt-3 text-violet-300/70 text-xs sm:text-sm font-normal" id="brand-sub"></p>
          <div class="mt-6 flex justify-center gap-2">
            <button type="button" id="lang-pl" class="lang-btn rounded-lg px-4 py-2 text-sm font-medium border transition-colors"></button>
            <button type="button" id="lang-en" class="lang-btn rounded-lg px-4 py-2 text-sm font-medium border transition-colors"></button>
          </div>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-12 items-start flex-1 min-h-0">
          <section class="order-1 lg:order-1 space-y-4 lg:sticky lg:top-4 lg:self-start lg:z-20">
            <div id="wedding-wrap" class="wedding-wrap" data-wedding="none">
              <p id="wedding-sub-above" class="wedding-subline hidden text-center mb-2 max-w-[min(100%,340px)] mx-auto px-1 text-slate-300"></p>
              <div class="relative z-[1]">
                <div id="wc-tl" class="wedding-corner wedding-corner-tl hidden"></div>
                <div id="wc-tr" class="wedding-corner wedding-corner-tr hidden"></div>
                <div id="wc-bl" class="wedding-corner wedding-corner-bl hidden"></div>
                <div id="wc-br" class="wedding-corner wedding-corner-br hidden"></div>
                <div id="preview-outer" class="${PREVIEW_FRAME_CLASS}">
                  <p id="cap-above" class="hidden text-center text-slate-300 mb-3 max-w-[min(100%,320px)] mx-auto break-words"></p>
                  <div id="qr-host" class="flex items-center justify-center [&_svg]:max-w-full [&_canvas]:max-w-full"></div>
                  <p id="cap-below" class="hidden text-center text-slate-300 mt-3 max-w-[min(100%,320px)] mx-auto break-words"></p>
                </div>
              </div>
            </div>
          </section>

          <section class="order-2 lg:order-2 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm p-5 sm:p-7 shadow-xl shadow-black/20 space-y-6">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5" for="f-data" id="l-data"></label>
              <textarea id="f-data" rows="3"
                class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y min-h-[88px]"
              ></textarea>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <fieldset class="space-y-2 rounded-xl border border-white/10 p-3 bg-slate-950/30">
                <legend class="text-xs uppercase tracking-wider text-violet-300/90 px-1">FG</legend>
                <label class="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" id="f-fg-grad" class="rounded border-white/20 bg-slate-900 text-violet-500" />
                  <span id="l-fg-grad"></span>
                </label>
                <div id="well-fg1" data-ct="fg1" class="color-well cursor-pointer rounded-xl border-2 border-violet-500/50 ring-2 ring-violet-500/40 p-2 bg-slate-950/40 transition-all">
                  <span class="block text-xs text-slate-500 mb-1" id="l-fg1"></span>
                  <div class="flex items-center gap-2">
                    <div id="sw-fg1" class="h-10 flex-1 rounded-lg border border-white/20 shadow-inner min-h-[2.5rem]"></div>
                    <input type="color" id="c-fg1" class="sr-only" tabindex="-1" aria-hidden="true" />
                  </div>
                </div>
                <div id="well-fg2" data-ct="fg2" class="color-well cursor-pointer rounded-xl border-2 border-white/15 p-2 bg-slate-950/40 transition-all hidden">
                  <span class="block text-xs text-slate-500 mb-1" id="l-fg2"></span>
                  <div class="flex items-center gap-2">
                    <div id="sw-fg2" class="h-10 flex-1 rounded-lg border border-white/20 shadow-inner min-h-[2.5rem]"></div>
                    <input type="color" id="c-fg2" class="sr-only" tabindex="-1" aria-hidden="true" />
                  </div>
                </div>
              </fieldset>
              <fieldset class="space-y-2 rounded-xl border border-white/10 p-3 bg-slate-950/30">
                <legend class="text-xs uppercase tracking-wider text-violet-300/90 px-1">BG</legend>
                <label class="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" id="f-bg-grad" class="rounded border-white/20 bg-slate-900 text-violet-500" />
                  <span id="l-bg-grad"></span>
                </label>
                <div id="well-bg1" data-ct="bg1" class="color-well cursor-pointer rounded-xl border-2 border-white/15 p-2 bg-slate-950/40 transition-all">
                  <span class="block text-xs text-slate-500 mb-1" id="l-bg1"></span>
                  <div class="flex items-center gap-2">
                    <div id="sw-bg1" class="h-10 flex-1 rounded-lg border border-white/20 shadow-inner min-h-[2.5rem]"></div>
                    <input type="color" id="c-bg1" class="sr-only" tabindex="-1" aria-hidden="true" />
                  </div>
                </div>
                <div id="well-bg2" data-ct="bg2" class="color-well cursor-pointer rounded-xl border-2 border-white/15 p-2 bg-slate-950/40 transition-all hidden">
                  <span class="block text-xs text-slate-500 mb-1" id="l-bg2"></span>
                  <div class="flex items-center gap-2">
                    <div id="sw-bg2" class="h-10 flex-1 rounded-lg border border-white/20 shadow-inner min-h-[2.5rem]"></div>
                    <input type="color" id="c-bg2" class="sr-only" tabindex="-1" aria-hidden="true" />
                  </div>
                </div>
              </fieldset>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-400 mb-1" id="l-presets"></p>
              <p class="text-[11px] text-slate-500 mb-2 leading-snug" id="l-preset-hint"></p>
              <div id="preset-row" class="flex flex-wrap gap-2"></div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-slate-300 mb-1" for="f-dots" id="l-dots"></label>
                <select id="f-dots" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"></select>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-1" for="f-shape" id="l-shape"></label>
                <select id="f-shape" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"></select>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-1" for="f-cs" id="l-cs"></label>
                <select id="f-cs" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"></select>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-1" for="f-cd" id="l-cd"></label>
                <select id="f-cd" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"></select>
              </div>
            </div>

            <div class="rounded-xl border border-white/10 p-4 bg-slate-950/30 space-y-3">
              <label class="block text-sm font-medium text-slate-300" for="f-center" id="l-center"></label>
              <select id="f-center" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm mb-2"></select>
              <div id="logo-box" class="hidden space-y-2">
                <label class="block">
                  <span class="text-xs text-slate-500" id="l-upload"></span>
                  <input type="file" id="f-file" accept=".png,.ico,image/png,image/x-icon,image/vnd.microsoft.icon" class="mt-1 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500" />
                </label>
              </div>
              <div id="emoji-box" class="hidden space-y-2">
                <p class="text-xs text-slate-500" id="l-emoji-suggest"></p>
                <div id="emoji-suggestions" class="flex flex-wrap gap-1.5"></div>
                <label class="block text-xs text-slate-500" for="f-emoji" id="l-emoji"></label>
                <input type="text" id="f-emoji" maxlength="8" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-lg" />
              </div>
              <div id="text-box" class="hidden space-y-2">
                <label class="block text-xs text-slate-500" for="f-ctext" id="l-ctext"></label>
                <input type="text" id="f-ctext" maxlength="14" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="flex justify-between text-xs text-slate-400" for="f-imsize">
                  <span id="l-imsize"></span>
                  <span id="imsize-val"></span>
                </label>
                <input type="range" id="f-imsize" min="0.18" max="0.42" step="0.01" class="w-full accent-violet-500 mt-1" />
              </div>
            </div>

            <div>
              <label class="block text-sm text-slate-300 mb-1" for="f-cappos" id="l-cappos"></label>
              <select id="f-cappos" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"></select>
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1" for="f-caption" id="l-caption"></label>
              <input type="text" id="f-caption" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm" />
            </div>
            <div class="rounded-xl border border-white/10 p-4 bg-slate-950/25 space-y-3">
              <label class="flex justify-between text-xs text-slate-400" for="f-capsize">
                <span id="l-capsize"></span>
                <span id="capsize-val"></span>
              </label>
              <input type="range" id="f-capsize" min="11" max="28" step="1" class="w-full accent-violet-500" />
              <div class="flex flex-wrap gap-4 text-sm text-slate-300">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="f-cap-b" class="rounded border-white/20 bg-slate-900 text-violet-500" />
                  <span id="l-cap-b"></span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="f-cap-i" class="rounded border-white/20 bg-slate-900 text-violet-500" />
                  <span id="l-cap-i"></span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="f-cap-u" class="rounded border-white/20 bg-slate-900 text-violet-500" />
                  <span id="l-cap-u"></span>
                </label>
              </div>
            </div>

            <fieldset class="rounded-xl border border-rose-500/25 bg-rose-950/15 p-4 space-y-3">
              <legend class="text-sm font-medium text-rose-100/90 px-1" id="l-wedding-section"></legend>
              <div>
                <label class="block text-sm text-slate-300 mb-1" for="f-wedding-theme" id="l-wedding-theme"></label>
                <select id="f-wedding-theme" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"></select>
              </div>
              <label class="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" id="f-wedding-auto-pal" class="rounded border-white/20 bg-slate-900 text-rose-500" checked />
                <span id="l-wedding-auto-pal"></span>
              </label>
              <button type="button" id="btn-wedding-palette" class="w-full rounded-xl border border-rose-500/35 bg-rose-950/25 py-2 text-xs font-medium text-rose-100/90 hover:bg-rose-900/35 transition"></button>
              <div>
                <p class="text-[11px] text-slate-500 mb-1.5" id="l-wedding-quick"></p>
                <div id="wedding-quick-row" class="flex flex-wrap gap-1"></div>
              </div>
              <div>
                <label class="block text-sm text-slate-300 mb-1" for="f-wedding-sub" id="l-wedding-sub"></label>
                <input type="text" id="f-wedding-sub" maxlength="120" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm" />
              </div>
              <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" id="f-wedding-corners" class="rounded border-white/20 bg-slate-900 text-rose-500" checked />
                <span id="l-wedding-corners"></span>
              </label>
            </fieldset>

            <fieldset class="rounded-xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-4">
              <legend class="text-sm font-medium text-violet-200 px-1" id="l-export"></legend>

              <div class="space-y-2">
                <p class="text-xs text-slate-400 font-medium" id="l-exp-bg-mode"></p>
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="radio" name="exp-bg" value="colored" class="accent-violet-500" checked />
                  <span id="l-exp-bg-colored"></span>
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="radio" name="exp-bg" value="transparent" class="accent-violet-500" />
                  <span id="l-exp-bg-trans"></span>
                </label>
              </div>

              <div class="space-y-2">
                <p class="text-xs text-slate-400 font-medium" id="l-exp-cap-mode"></p>
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="radio" name="exp-cap" value="with" class="accent-violet-500" checked />
                  <span id="l-exp-cap-with"></span>
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="radio" name="exp-cap" value="without" class="accent-violet-500" />
                  <span id="l-exp-cap-without"></span>
                </label>
              </div>

              <div>
                <label class="block text-xs text-slate-400 mb-1" for="f-expsize" id="l-expsize"></label>
                <select id="f-expsize" class="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"></select>
              </div>
              <div id="wedding-export-wrap" class="hidden">
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" id="f-wedding-export-frame" class="rounded border-white/20 bg-slate-900 text-violet-500" checked />
                  <span id="l-wedding-export-frame"></span>
                </label>
              </div>
              <button type="button" id="btn-dl" class="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-fuchsia-500 transition"></button>
            </fieldset>
          </section>
        </main>
      </div>

      <footer class="relative z-10 mt-auto w-full shrink-0 border-t border-white/10 bg-slate-950/55 backdrop-blur-sm">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-slate-500">
          <a href="${SITE_HREF}" id="footer-home" class="text-slate-400 hover:text-violet-300 transition-colors no-underline font-medium"></a>
          <span class="text-slate-700 hidden sm:inline select-none" aria-hidden="true">|</span>
          <div class="flex items-center gap-3">
            <a href="${SOCIAL_LINKS.facebook}" target="_blank" rel="noopener noreferrer" id="footer-fb" class="footer-social text-slate-500 hover:text-violet-300 transition-colors p-0.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500/50" aria-label="">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="${SOCIAL_LINKS.instagram}" target="_blank" rel="noopener noreferrer" id="footer-ig" class="footer-social text-slate-500 hover:text-violet-300 transition-colors p-0.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500/50" aria-label="">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="${SOCIAL_LINKS.youtube}" target="_blank" rel="noopener noreferrer" id="footer-yt" class="footer-social text-slate-500 hover:text-violet-300 transition-colors p-0.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500/50" aria-label="">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  `

  wire(root)
}

function wire(root: HTMLElement): void {
  const qs = <T extends Element>(sel: string) => root.querySelector<T>(sel)

  const elData = qs<HTMLTextAreaElement>('#f-data')!
  const elFgGrad = qs<HTMLInputElement>('#f-fg-grad')!
  const elBgGrad = qs<HTMLInputElement>('#f-bg-grad')!
  const cFg1 = qs<HTMLInputElement>('#c-fg1')!
  const cFg2 = qs<HTMLInputElement>('#c-fg2')!
  const cBg1 = qs<HTMLInputElement>('#c-bg1')!
  const cBg2 = qs<HTMLInputElement>('#c-bg2')!
  const wellFg1 = qs<HTMLElement>('#well-fg1')!
  const wellFg2 = qs<HTMLElement>('#well-fg2')!
  const wellBg1 = qs<HTMLElement>('#well-bg1')!
  const wellBg2 = qs<HTMLElement>('#well-bg2')!
  const swFg1 = qs<HTMLElement>('#sw-fg1')!
  const swFg2 = qs<HTMLElement>('#sw-fg2')!
  const swBg1 = qs<HTMLElement>('#sw-bg1')!
  const swBg2 = qs<HTMLElement>('#sw-bg2')!
  const presetRow = qs<HTMLElement>('#preset-row')!
  const elDots = qs<HTMLSelectElement>('#f-dots')!
  const elShape = qs<HTMLSelectElement>('#f-shape')!
  const elCs = qs<HTMLSelectElement>('#f-cs')!
  const elCd = qs<HTMLSelectElement>('#f-cd')!
  const elCenter = qs<HTMLSelectElement>('#f-center')!
  const logoBox = qs<HTMLElement>('#logo-box')!
  const emojiBox = qs<HTMLElement>('#emoji-box')!
  const emojiSuggest = qs<HTMLElement>('#emoji-suggestions')!
  const textBox = qs<HTMLElement>('#text-box')!
  const elEmoji = qs<HTMLInputElement>('#f-emoji')!
  const elCtext = qs<HTMLInputElement>('#f-ctext')!
  const elFile = qs<HTMLInputElement>('#f-file')!
  const elImsize = qs<HTMLInputElement>('#f-imsize')!
  const imsizeVal = qs<HTMLElement>('#imsize-val')!
  const elCaption = qs<HTMLInputElement>('#f-caption')!
  const elCapPos = qs<HTMLSelectElement>('#f-cappos')!
  const elCapsize = qs<HTMLInputElement>('#f-capsize')!
  const capsizeVal = qs<HTMLElement>('#capsize-val')!
  const elCapB = qs<HTMLInputElement>('#f-cap-b')!
  const elCapI = qs<HTMLInputElement>('#f-cap-i')!
  const elCapU = qs<HTMLInputElement>('#f-cap-u')!
  const capAbove = qs<HTMLElement>('#cap-above')!
  const capBelow = qs<HTMLElement>('#cap-below')!
  const elExpSize = qs<HTMLSelectElement>('#f-expsize')!
  const btnDl = qs<HTMLButtonElement>('#btn-dl')!
  const qrHost = qs<HTMLElement>('#qr-host')!
  const langPl = qs<HTMLButtonElement>('#lang-pl')!
  const langEn = qs<HTMLButtonElement>('#lang-en')!
  const weddingWrap = qs<HTMLElement>('#wedding-wrap')!
  const weddingSubAbove = qs<HTMLElement>('#wedding-sub-above')!
  const wcTl = qs<HTMLElement>('#wc-tl')!
  const wcTr = qs<HTMLElement>('#wc-tr')!
  const wcBl = qs<HTMLElement>('#wc-bl')!
  const wcBr = qs<HTMLElement>('#wc-br')!
  const elWeddingTheme = qs<HTMLSelectElement>('#f-wedding-theme')!
  const elWeddingAutoPal = qs<HTMLInputElement>('#f-wedding-auto-pal')!
  const btnWeddingPalette = qs<HTMLButtonElement>('#btn-wedding-palette')!
  const weddingQuickRow = qs<HTMLElement>('#wedding-quick-row')!
  const elWeddingSub = qs<HTMLInputElement>('#f-wedding-sub')!
  const elWeddingCorners = qs<HTMLInputElement>('#f-wedding-corners')!
  const weddingExportWrap = qs<HTMLElement>('#wedding-export-wrap')!
  const elWeddingExportFrame = qs<HTMLInputElement>('#f-wedding-export-frame')!

  const wells: Record<ColorTarget, HTMLElement> = {
    fg1: wellFg1,
    fg2: wellFg2,
    bg1: wellBg1,
    bg2: wellBg2,
  }
  const inputs: Record<ColorTarget, HTMLInputElement> = {
    fg1: cFg1,
    fg2: cFg2,
    bg1: cBg1,
    bg2: cBg2,
  }
  const swatches: Record<ColorTarget, HTMLElement> = {
    fg1: swFg1,
    fg2: swFg2,
    bg1: swBg1,
    bg2: swBg2,
  }

  const targetVisible = (ct: ColorTarget): boolean => {
    if (ct === 'fg2' && !state.fgGradient) return false
    if (ct === 'bg2' && !state.bgGradient) return false
    return true
  }

  function syncHiddenWells(): void {
    wellFg2.classList.toggle('hidden', !state.fgGradient)
    wellBg2.classList.toggle('hidden', !state.bgGradient)
    if (!state.fgGradient && state.activeColorTarget === 'fg2') state.activeColorTarget = 'fg1'
    if (!state.bgGradient && state.activeColorTarget === 'bg2') state.activeColorTarget = 'bg1'
  }

  function updateColorUi(): void {
    ;(Object.keys(wells) as ColorTarget[]).forEach((ct) => {
      const w = wells[ct]
      const sw = swatches[ct]
      const active = state.activeColorTarget === ct && targetVisible(ct)
      sw.style.backgroundColor = state[ct]
      inputs[ct].value = state[ct]
      if (!targetVisible(ct)) return
      if (active) {
        w.classList.add('border-violet-400', 'ring-2', 'ring-violet-500/45')
        w.classList.remove('border-white/15')
      } else {
        w.classList.remove('border-violet-400', 'ring-2', 'ring-violet-500/45')
        w.classList.add('border-white/15')
      }
    })
  }

  function onWellClick(ct: ColorTarget): void {
    if (!targetVisible(ct)) return
    if (state.activeColorTarget === ct) {
      inputs[ct].click()
    } else {
      state.activeColorTarget = ct
      updateColorUi()
    }
  }

  elData.value = state.data
  elFgGrad.checked = state.fgGradient
  elBgGrad.checked = state.bgGradient
  cFg1.value = state.fg1
  cFg2.value = state.fg2
  cBg1.value = state.bg1
  cBg2.value = state.bg2
  syncHiddenWells()
  elImsize.value = String(state.imageSize)
  imsizeVal.textContent = `${Math.round(state.imageSize * 100)}%`
  elCaption.value = state.caption
  elCapsize.value = String(state.captionFontPx)
  capsizeVal.textContent = `${state.captionFontPx}px`
  elCapB.checked = state.captionBold
  elCapI.checked = state.captionItalic
  elCapU.checked = state.captionUnderline

  const fillSelect = (sel: HTMLSelectElement, values: string[], labels?: string[]) => {
    sel.innerHTML = values
      .map((v, i) => `<option value="${v}">${labels?.[i] ?? v}</option>`)
      .join('')
  }

  fillSelect(elDots, DOT_TYPES)
  fillSelect(elCs, CORNER_SQUARE)
  fillSelect(elCd, CORNER_DOT)
  elDots.value = state.dots
  elCs.value = state.cornerSquare
  elCd.value = state.cornerDot

  elShape.innerHTML = `
    <option value="square">${t('shapeSquare')}</option>
    <option value="circle">${t('shapeCircle')}</option>
  `
  elShape.value = state.shape

  elCenter.innerHTML = `
    <option value="none">${t('centerNone')}</option>
    <option value="logo">${t('centerLogo')}</option>
    <option value="emoji">${t('centerEmoji')}</option>
    <option value="text">${t('centerText')}</option>
  `
  elCenter.value = state.centerMode

  elCapPos.innerHTML = `
    <option value="above">${t('captionAbove')}</option>
    <option value="below">${t('captionBelow')}</option>
  `
  elCapPos.value = state.captionPos

  const sizes = ['512', '1024', '2048', '4096']
  fillSelect(elExpSize, sizes)

  const fillWeddingThemeOptions = () => {
    const cur = (elWeddingTheme.value || state.weddingTheme) as WeddingThemeId
    elWeddingTheme.innerHTML = WEDDING_THEME_ORDER.map(
      (id) => `<option value="${id}">${t(weddingThemeLabelKey(id))}</option>`,
    ).join('')
    elWeddingTheme.value = WEDDING_THEME_ORDER.includes(cur) ? cur : state.weddingTheme
  }
  fillWeddingThemeOptions()

  const fillWeddingQuickRow = () => {
    weddingQuickRow.innerHTML = WEDDING_QUICK_PHRASES.map((row) => {
      const label = getLang() === 'pl' ? row.pl : row.en
      const safe = label.replace(/"/g, '&quot;').replace(/</g, '')
      return `<button type="button" class="wedding-quick-btn rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1 text-[10px] text-slate-400 hover:border-rose-500/40 hover:text-rose-100/90 transition" data-phrase="${safe}">${label}</button>`
    }).join('')
  }
  fillWeddingQuickRow()

  elWeddingSub.value = state.weddingSubline
  elWeddingAutoPal.checked = state.weddingAutoPalette
  elWeddingCorners.checked = state.weddingShowCorners
  elWeddingExportFrame.checked = state.weddingExportOrnament

  presetRow.innerHTML = PRESET_COLORS.map(
    (c) =>
      `<button type="button" data-preset="${c}" title="${c}" class="preset-btn h-8 w-8 rounded-lg border border-white/15 shadow-inner hover:ring-2 hover:ring-violet-500/50 transition" style="background:${c}"></button>`,
  ).join('')

  emojiSuggest.innerHTML = EMOJI_PRESETS.map(
    (e) =>
      `<button type="button" data-emoji="${e}" class="emoji-chip text-xl leading-none px-2 py-1.5 rounded-lg border border-white/10 bg-slate-950/50 hover:bg-violet-600/30 transition">${e}</button>`,
  ).join('')

  elEmoji.value = state.emojiText
  elCtext.value = state.centerText

  ;(Object.keys(wells) as ColorTarget[]).forEach((ct) => {
    wells[ct].addEventListener('click', () => onWellClick(ct))
  })

  ;(Object.keys(inputs) as ColorTarget[]).forEach((ct) => {
    inputs[ct].addEventListener('input', () => {
      state[ct] = inputs[ct].value
      updateColorUi()
      schedule()
    })
  })

  const syncCenterUi = () => {
    logoBox.classList.toggle('hidden', state.centerMode !== 'logo')
    emojiBox.classList.toggle('hidden', state.centerMode !== 'emoji')
    textBox.classList.toggle('hidden', state.centerMode !== 'text')
  }
  syncCenterUi()

  emojiSuggest.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.emoji-chip[data-emoji]')
    if (!b?.dataset.emoji) return
    elEmoji.value = b.dataset.emoji
    state.emojiText = elEmoji.value
    schedule()
  })

  function syncColorFormFromState(): void {
    elFgGrad.checked = state.fgGradient
    elBgGrad.checked = state.bgGradient
    cFg1.value = state.fg1
    cFg2.value = state.fg2
    cBg1.value = state.bg1
    cBg2.value = state.bg2
    syncHiddenWells()
    updateColorUi()
  }

  function applyWeddingPaletteTheme(theme: WeddingThemeId): void {
    const p = WEDDING_PALETTES[theme]
    if (!p) return
    state.fg1 = p.fg1
    state.fg2 = p.fg2
    state.bg1 = p.bg1
    state.bg2 = p.bg2
    state.fgGradient = p.fgGradient
    state.bgGradient = p.bgGradient
    syncColorFormFromState()
    schedule()
  }

  function updateWeddingVisual(): void {
    weddingWrap.dataset.wedding = state.weddingTheme
    const tx = state.weddingSubline.trim()
    weddingSubAbove.textContent = tx
    weddingSubAbove.className = [
      'wedding-subline text-center mb-2 max-w-[min(100%,340px)] mx-auto px-1',
      tx ? (state.weddingTheme === 'none' ? 'text-slate-400' : '') : 'hidden',
    ]
      .filter(Boolean)
      .join(' ')

    const kind = weddingCornerKind(state.weddingTheme)
    const showCorn =
      state.weddingShowCorners && kind !== 'none' && state.weddingTheme !== 'none'
    const svg = showCorn ? cornerSvg(kind, 'drop-shadow-sm') : ''
    for (const el of [wcTl, wcTr, wcBl, wcBr]) {
      if (!showCorn || !svg) {
        el.classList.add('hidden')
        el.innerHTML = ''
      } else {
        el.classList.remove('hidden')
        el.innerHTML = svg
      }
    }
    weddingExportWrap.classList.toggle('hidden', state.weddingTheme === 'none')
  }

  const schedule = () => {
    window.clearTimeout(debounceT)
    debounceT = window.setTimeout(() => syncQr(qrHost), 100)
  }

  const applyI18nLabels = () => {
    qs('#chip-ec')!.textContent = `${t('errorCorrection')}: ${t('ecAuto')}`
    qs('#brand-line')!.textContent = t('brandLine')
    qs('#brand-sub')!.textContent = `\u2014 ${t('brandSubtitle')} \u2014`
    qs('#l-data')!.textContent = t('contentLabel')
    elData.placeholder = t('contentPlaceholder')
    qs('#l-fg-grad')!.textContent = t('fgGradient')
    qs('#l-bg-grad')!.textContent = t('bgGradient')
    qs('#l-fg1')!.textContent = t('fgColor')
    qs('#l-fg2')!.textContent = t('fgColor2')
    qs('#l-bg1')!.textContent = t('bgColor')
    qs('#l-bg2')!.textContent = t('bgColor2')
    qs('#l-presets')!.textContent = t('presetColors')
    qs('#l-preset-hint')!.textContent = t('presetHint')
    qs('#l-dots')!.textContent = t('dotsStyle')
    qs('#l-shape')!.textContent = t('qrShape')
    qs('#l-cs')!.textContent = t('cornerOuter')
    qs('#l-cd')!.textContent = t('cornerInner')
    qs('#l-center')!.textContent = t('centerMode')
    qs('#l-upload')!.textContent = t('uploadLogo')
    qs('#l-emoji-suggest')!.textContent = t('emojiSuggest')
    qs('#l-emoji')!.textContent = t('centerEmojiLabel')
    qs('#l-ctext')!.textContent = t('centerTextLabel')
    qs('#l-imsize')!.textContent = t('centerScale')
    qs('#l-cappos')!.textContent = t('captionPos')
    qs('#l-caption')!.textContent = t('captionLabel')
    elCaption.placeholder = t('captionPlaceholder')
    qs('#l-capsize')!.textContent = t('captionSize')
    qs('#l-cap-b')!.textContent = t('captionBold')
    qs('#l-cap-i')!.textContent = t('captionItalic')
    qs('#l-cap-u')!.textContent = t('captionUnderline')
    qs('#l-export')!.textContent = t('exportTitle')
    qs('#l-exp-bg-mode')!.textContent = t('exportBgMode')
    qs('#l-exp-bg-colored')!.textContent = t('exportBgColored')
    qs('#l-exp-bg-trans')!.textContent = t('exportBgTransparent')
    qs('#l-exp-cap-mode')!.textContent = t('exportCaptionMode')
    qs('#l-exp-cap-with')!.textContent = t('exportCaptionWith')
    qs('#l-exp-cap-without')!.textContent = t('exportCaptionWithout')
    qs('#l-expsize')!.textContent = t('exportSize')
    qs('#l-wedding-export-frame')!.textContent = t('weddingExportFrame')
    btnDl.textContent = t('download')

    qs('#l-wedding-section')!.textContent = t('weddingSection')
    qs('#l-wedding-theme')!.textContent = t('weddingTheme')
    qs('#l-wedding-auto-pal')!.textContent = t('weddingAutoPalette')
    btnWeddingPalette.textContent = t('weddingApplyPaletteBtn')
    qs('#l-wedding-quick')!.textContent = t('weddingQuick')
    qs('#l-wedding-sub')!.textContent = t('weddingSubline')
    elWeddingSub.placeholder = t('weddingSublinePh')
    qs('#l-wedding-corners')!.textContent = t('weddingCorners')
    fillWeddingThemeOptions()
    fillWeddingQuickRow()
    updateWeddingVisual()

    qs('#footer-home')!.textContent = t('footerHome')
    qs('#footer-fb')!.setAttribute('aria-label', t('ariaFacebook'))
    qs('#footer-ig')!.setAttribute('aria-label', t('ariaInstagram'))
    qs('#footer-yt')!.setAttribute('aria-label', t('ariaYoutube'))

    langPl.textContent = t('langPl')
    langEn.textContent = t('langEn')
    const active = 'border-violet-500 bg-violet-500/20 text-white'
    const idle = 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
    langPl.className = `lang-btn rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${getLang() === 'pl' ? active : idle}`
    langEn.className = `lang-btn rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${getLang() === 'en' ? active : idle}`

    const oShape = elShape.querySelectorAll('option')
    oShape[0]!.textContent = t('shapeSquare')
    oShape[1]!.textContent = t('shapeCircle')
  }

  applyI18nLabels()

  const refreshSelectLabels = () => {
    const oC = elCenter.querySelectorAll('option')
    oC[0]!.textContent = t('centerNone')
    oC[1]!.textContent = t('centerLogo')
    oC[2]!.textContent = t('centerEmoji')
    oC[3]!.textContent = t('centerText')
    const oP = elCapPos.querySelectorAll('option')
    oP[0]!.textContent = t('captionAbove')
    oP[1]!.textContent = t('captionBelow')
  }
  refreshSelectLabels()

  updateColorUi()

  elData.addEventListener('input', () => {
    state.data = elData.value
    schedule()
  })
  elFgGrad.addEventListener('change', () => {
    state.fgGradient = elFgGrad.checked
    syncHiddenWells()
    updateColorUi()
    schedule()
  })
  elBgGrad.addEventListener('change', () => {
    state.bgGradient = elBgGrad.checked
    syncHiddenWells()
    updateColorUi()
    schedule()
  })

  presetRow.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.preset-btn[data-preset]')
    if (!btn?.dataset.preset) return
    const key = state.activeColorTarget
    if (!targetVisible(key)) return
    const col = btn.dataset.preset
    state[key] = col
    updateColorUi()
    schedule()
  })

  elDots.addEventListener('change', () => {
    state.dots = elDots.value as DotType
    schedule()
  })
  elShape.addEventListener('change', () => {
    state.shape = elShape.value as 'square' | 'circle'
    schedule()
  })
  elCs.addEventListener('change', () => {
    state.cornerSquare = elCs.value as CornerSquareType
    schedule()
  })
  elCd.addEventListener('change', () => {
    state.cornerDot = elCd.value as CornerDotType
    schedule()
  })
  elCenter.addEventListener('change', () => {
    state.centerMode = elCenter.value as CenterMode
    syncCenterUi()
    schedule()
  })
  elEmoji.addEventListener('input', () => {
    state.emojiText = elEmoji.value
    schedule()
  })
  elCtext.addEventListener('input', () => {
    state.centerText = elCtext.value
    schedule()
  })
  elFile.addEventListener('change', async () => {
    const f = elFile.files?.[0]
    if (!f) return
    try {
      state.logoDataUrl = await readFileAsDataUrl(f)
    } catch {
      state.logoDataUrl = null
    }
    schedule()
  })
  elImsize.addEventListener('input', () => {
    state.imageSize = Number(elImsize.value)
    imsizeVal.textContent = `${Math.round(state.imageSize * 100)}%`
    schedule()
  })
  elCaption.addEventListener('input', () => {
    state.caption = elCaption.value
    updateCaption(capAbove, capBelow)
  })
  elCapPos.addEventListener('change', () => {
    state.captionPos = elCapPos.value as 'above' | 'below'
    updateCaption(capAbove, capBelow)
  })

  elCapsize.addEventListener('input', () => {
    state.captionFontPx = Number(elCapsize.value)
    capsizeVal.textContent = `${state.captionFontPx}px`
    updateCaption(capAbove, capBelow)
  })
  elCapB.addEventListener('change', () => {
    state.captionBold = elCapB.checked
    updateCaption(capAbove, capBelow)
  })
  elCapI.addEventListener('change', () => {
    state.captionItalic = elCapI.checked
    updateCaption(capAbove, capBelow)
  })
  elCapU.addEventListener('change', () => {
    state.captionUnderline = elCapU.checked
    updateCaption(capAbove, capBelow)
  })

  elWeddingTheme.addEventListener('change', () => {
    state.weddingTheme = elWeddingTheme.value as WeddingThemeId
    if (state.weddingAutoPalette && state.weddingTheme !== 'none') {
      applyWeddingPaletteTheme(state.weddingTheme)
    }
    updateWeddingVisual()
  })
  elWeddingAutoPal.addEventListener('change', () => {
    state.weddingAutoPalette = elWeddingAutoPal.checked
  })
  btnWeddingPalette.addEventListener('click', () => {
    if (state.weddingTheme !== 'none') applyWeddingPaletteTheme(state.weddingTheme)
  })
  weddingQuickRow.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.wedding-quick-btn[data-phrase]')
    if (!b?.dataset.phrase) return
    elWeddingSub.value = b.dataset.phrase
    state.weddingSubline = elWeddingSub.value
    updateWeddingVisual()
  })
  elWeddingSub.addEventListener('input', () => {
    state.weddingSubline = elWeddingSub.value
    updateWeddingVisual()
  })
  elWeddingCorners.addEventListener('change', () => {
    state.weddingShowCorners = elWeddingCorners.checked
    updateWeddingVisual()
  })
  elWeddingExportFrame.addEventListener('change', () => {
    state.weddingExportOrnament = elWeddingExportFrame.checked
  })

  btnDl.addEventListener('click', async () => {
    const size = Number(elExpSize.value)
    const bgRadio = root.querySelector<HTMLInputElement>('input[name="exp-bg"]:checked')
    const capRadio = root.querySelector<HTMLInputElement>('input[name="exp-cap"]:checked')
    const canvasBg = bgRadio?.value === 'transparent' ? 'transparent' : 'editor'
    const includeCaption = capRadio?.value === 'with'

    const weddingSpec =
      state.weddingTheme === 'none'
        ? undefined
        : {
            theme: state.weddingTheme,
            subline: state.weddingSubline,
            drawOrnament: state.weddingExportOrnament,
          }

    await exportComposedQrPng(
      buildOptions(size, true),
      size,
      0.08,
      canvasBg,
      {
        gradient: state.bgGradient,
        c1: state.bg1,
        c2: state.bg2,
      },
      {
        include: includeCaption,
        text: state.caption,
        position: state.captionPos,
        fontPx: state.captionFontPx,
        bold: state.captionBold,
        italic: state.captionItalic,
        underline: state.captionUnderline,
        color: '#cbd5e1',
      },
      weddingSpec,
    )
  })

  langPl.addEventListener('click', () => {
    setLang('pl')
    document.documentElement.lang = 'pl'
    applyI18nLabels()
    refreshSelectLabels()
    updateCaption(capAbove, capBelow)
  })
  langEn.addEventListener('click', () => {
    setLang('en')
    document.documentElement.lang = 'en'
    applyI18nLabels()
    refreshSelectLabels()
    updateCaption(capAbove, capBelow)
  })

  document.documentElement.lang = getLang()

  updateWeddingVisual()
  updateCaption(capAbove, capBelow)
  syncQr(qrHost)
}

function updateCaption(above: HTMLElement, below: HTMLElement): void {
  const tx = state.caption.trim()
  const style = [
    `font-size: ${state.captionFontPx}px`,
    `font-weight: ${state.captionBold ? '700' : '500'}`,
    `font-style: ${state.captionItalic ? 'italic' : 'normal'}`,
    `text-decoration: ${state.captionUnderline ? 'underline' : 'none'}`,
    'color: #cbd5e1',
  ].join(';')

  const apply = (el: HTMLElement, show: boolean, text: string) => {
    if (!show || !text) {
      el.classList.add('hidden')
      el.textContent = ''
      return
    }
    el.textContent = text
    el.classList.remove('hidden')
    el.style.cssText = style
  }

  if (!tx) {
    above.classList.add('hidden')
    below.classList.add('hidden')
    return
  }
  if (state.captionPos === 'above') {
    apply(above, true, tx)
    apply(below, false, '')
  } else {
    apply(below, true, tx)
    apply(above, false, '')
  }
}

function syncQr(host: HTMLElement): void {
  const opts = buildOptions(PREVIEW_SIZE, false)
  host.innerHTML = ''
  const qr = new QRCodeStyling(opts)
  qr.append(host)
}

mount()
