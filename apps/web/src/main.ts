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
    <div class="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.22),transparent)] pointer-events-none"></div>
      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-8 sm:pt-12">
        <header class="text-center mb-10 sm:mb-14">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-violet-200/90 mb-4">
            <span class="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            <span id="chip-ec"></span>
          </div>
          <h1 class="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-center max-w-3xl mx-auto leading-snug">
            <span class="bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-transparent" id="brand-line"></span>
          </h1>
          <p class="mt-3 text-violet-300/70 text-xs sm:text-sm font-normal" id="brand-sub"></p>
          <div class="mt-6 flex justify-center gap-2">
            <button type="button" id="lang-pl" class="lang-btn rounded-lg px-4 py-2 text-sm font-medium border transition-colors"></button>
            <button type="button" id="lang-en" class="lang-btn rounded-lg px-4 py-2 text-sm font-medium border transition-colors"></button>
          </div>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-12 items-start">
          <section class="order-1 lg:order-1 space-y-4">
            <div id="preview-outer" class="${PREVIEW_FRAME_CLASS}">
              <p id="cap-above" class="hidden text-center text-slate-300 mb-3 max-w-[min(100%,320px)] mx-auto break-words"></p>
              <div id="qr-host" class="flex items-center justify-center [&_svg]:max-w-full [&_canvas]:max-w-full"></div>
              <p id="cap-below" class="hidden text-center text-slate-300 mt-3 max-w-[min(100%,320px)] mx-auto break-words"></p>
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
              <button type="button" id="btn-dl" class="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-fuchsia-500 transition"></button>
            </fieldset>
          </section>
        </main>
      </div>
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
    btnDl.textContent = t('download')

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

  btnDl.addEventListener('click', async () => {
    const size = Number(elExpSize.value)
    const bgRadio = root.querySelector<HTMLInputElement>('input[name="exp-bg"]:checked')
    const capRadio = root.querySelector<HTMLInputElement>('input[name="exp-cap"]:checked')
    const canvasBg = bgRadio?.value === 'transparent' ? 'transparent' : 'editor'
    const includeCaption = capRadio?.value === 'with'

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
