'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Pause, Play } from 'lucide-react'

// ---------------------------------------------------------------------------
// Story content
// ---------------------------------------------------------------------------

interface StorySegment {
  /**
   * `heading` — large H2 line at top of the column.
   * `body`    — regular prose paragraph.
   * `bold`    — bold navy paragraph used as a centerpiece statement.
   */
  kind: 'heading' | 'body' | 'bold'
  text: string
}

const HEADING_TEXT = 'Every Great Move of God Begins With a Question.'

/**
 * Story segments in reading order. The audio narrator reads these from top to
 * bottom; each rendered word can be highlighted by index.
 */
const STORY_SEGMENTS: StorySegment[] = [
  { kind: 'heading', text: HEADING_TEXT },
  {
    kind: 'body',
    text:
      "Ours began with this one: What if a church could be more than a Sunday gathering? What if it could be a place where people don't just attend but are furnished unto every good work, transformed within and without, and sent out to influence the world around them for Jesus Christ?",
  },
  {
    kind: 'body',
    text:
      "That question became a conviction, that conviction became a calling, and that calling became The RCCG Glory Tabernacle, planted in the heart of Barnstaple, North Devon, with a mandate to liberate God's people, thereby walking in absolute victory.",
  },
  {
    kind: 'body',
    text:
      "We are a people in pursuit of God's presence, His purpose, and His glory. We believe that every person who walks through our door carries a destiny too significant to be left unfinished. We believe that ordinary people, when they encounter an extraordinary God, they become extraordinary themselves.",
  },
  {
    kind: 'bold',
    text:
      'We build the Tabernacle, God fills it with His Glory. Because you are the TABERNACLE.',
  },
  {
    kind: 'body',
    text:
      "From our first gathering to where we stand today, one thing has never changed, our hunger for His presence. Because we have learned that when God's glory rests in a place, atmospheres shift, hearts are convicted unto conversion, thereby resulting to salvation and discipleship of many.",
  },
  {
    kind: 'body',
    text: 'This is not just our story, it is the beginning of yours.',
  },
  {
    kind: 'body',
    text:
      'You may have come broken, but you will not leave broken. You may have come small, but you cannot remain small because nothing small is found in the Tabernacle.',
  },
  { kind: 'bold', text: 'Welcome to RCCG GLORY TABERNACLE, Barnstaple' },
]

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------
//
// We need two things to drive karaoke-style highlighting:
//   1. A single utterance string in reading order (fed to SpeechSynthesisUtterance).
//   2. A list of WordTokens with their absolute character offsets in that
//      utterance — the SpeechSynthesis `boundary` event gives us a charIndex,
//      and we look up which token contains it.

interface WordToken {
  /** Visible word text. */
  text: string
  /** Inclusive char index in the (global) utterance string. */
  start: number
  /** Exclusive char index in the (global) utterance string. */
  end: number
  /** Inclusive char index in *just this segment's* text — used to look up the
   *  active word from a per-segment utterance's `onboundary.charIndex`. */
  segmentLocalStart: number
  /** Stable global index used as React key and active-word identifier. */
  globalIndex: number
}

interface TokenizedStory {
  utteranceText: string
  /** One inner array per segment, in segment order. */
  segmentTokens: WordToken[][]
  /** Flat list of every token, ordered by `start`. */
  allTokens: WordToken[]
}

function tokenizeStory(segments: StorySegment[]): TokenizedStory {
  let utterance = ''
  let globalCharOffset = 0
  let globalIdx = 0
  const segmentTokens: WordToken[][] = []
  const allTokens: WordToken[] = []

  segments.forEach((seg, segIndex) => {
    const segTokens: WordToken[] = []
    for (const match of seg.text.matchAll(/\S+/g)) {
      const word = match[0]
      const localStart = match.index ?? 0
      const token: WordToken = {
        text: word,
        start: globalCharOffset + localStart,
        end: globalCharOffset + localStart + word.length,
        segmentLocalStart: localStart,
        globalIndex: globalIdx++,
      }
      segTokens.push(token)
      allTokens.push(token)
    }
    segmentTokens.push(segTokens)

    utterance += seg.text
    if (segIndex < segments.length - 1) {
      // Two newlines act as a paragraph break for the TTS engine; it pauses
      // briefly between segments, which sounds natural.
      utterance += '\n\n'
      globalCharOffset += seg.text.length + 2
    }
  })

  return { utteranceText: utterance, segmentTokens, allTokens }
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

export function OurStorySection() {
  const { segmentTokens } = useMemo(
    () => tokenizeStory(STORY_SEGMENTS),
    []
  )

  const [activeWordIndex, setActiveWordIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  // Chained-utterance state. We speak each segment as its own utterance and
  // chain via `onend`. This gives a hard sync point at every paragraph break.
  const activeSegmentIndexRef = useRef(0)
  const cancelChainRef = useRef(false)

  // Time-based fallback state — kicks in on browsers/voices that don't fire
  // word-boundary events (e.g. Edge "Natural" voices, iOS Safari). Reset
  // at the start of each segment so drift can never compound past one
  // paragraph.
  const lastBoundaryAtRef = useRef(0)
  const segmentStartTimeRef = useRef(0)
  const pausedAtRef = useRef(0)
  const pausedDurationRef = useRef(0)
  const segmentTokenEndTimingsRef = useRef<number[]>([])
  const activeSegmentTokensRef = useRef<WordToken[]>([])

  // ---------------------------------------------------------------------
  // Capability detection + voice preload + cleanup
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setIsSupported(false)
      return
    }

    function refreshVoices() {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    refreshVoices()
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)

    return () => {
      cancelChainRef.current = true
      window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices)
      window.speechSynthesis.cancel()
    }
  }, [])

  // ---------------------------------------------------------------------
  // Chrome 15-second cutoff workaround
  // Chrome stops long utterances after ~15s. Pausing and immediately
  // resuming while playing keeps it alive without affecting playback.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying) return
    const id = window.setInterval(() => {
      const synth = window.speechSynthesis
      if (synth.speaking && !synth.paused) {
        synth.pause()
        synth.resume()
      }
    }, 10_000)
    return () => window.clearInterval(id)
  }, [isPlaying])

  // ---------------------------------------------------------------------
  // Playback handlers
  // ---------------------------------------------------------------------

  function pickVoice(): SpeechSynthesisVoice | undefined {
    const voices = voicesRef.current
    if (!voices.length) return undefined

    // These voice-name patterns are known to fire word-boundary events
    // reliably across operating systems. We try them in priority order so the
    // karaoke highlight can ride real boundary events rather than the timer.
    //   Windows: "Microsoft Hazel Desktop" / "Zira Desktop" / "David Desktop"
    //   macOS:   "Samantha", "Daniel", "Karen", "Moira", "Tessa", "Veena", "Fiona"
    //   Chrome:  "Google UK English Female/Male", "Google US English"
    const KNOWN_GOOD: RegExp[] = [
      /Microsoft.+Desktop/i,
      /\b(Hazel|Libby|Sonia|Zira|David|Mark|George|Susan)\b/i,
      /\b(Samantha|Daniel|Karen|Moira|Tessa|Veena|Fiona|Alex)\b/i,
      /Google (UK|US) English/i,
    ]

    // Voices we should actively skip — they ignore the boundary event.
    const isBlocked = (v: SpeechSynthesisVoice) =>
      /natural|online|neural/i.test(v.name) ||
      /online/i.test(v.voiceURI ?? '')

    // Tier 1: en-GB known-good voice
    for (const pattern of KNOWN_GOOD) {
      const match = voices.find(
        (v) => v.lang === 'en-GB' && pattern.test(v.name) && !isBlocked(v)
      )
      if (match) return match
    }
    // Tier 2: any English known-good voice
    for (const pattern of KNOWN_GOOD) {
      const match = voices.find(
        (v) => v.lang.startsWith('en-') && pattern.test(v.name) && !isBlocked(v)
      )
      if (match) return match
    }
    // Tier 3: any local English voice
    const local =
      voices.find((v) => v.lang === 'en-GB' && v.localService && !isBlocked(v)) ??
      voices.find(
        (v) => v.lang.startsWith('en-') && v.localService && !isBlocked(v)
      )
    if (local) return local

    // Tier 4: anything English, even if it might not fire boundary events
    return (
      voices.find((v) => v.lang === 'en-GB' && !isBlocked(v)) ??
      voices.find((v) => v.lang.startsWith('en-') && !isBlocked(v)) ??
      voices.find((v) => v.lang.startsWith('en-'))
    )
  }

  // Estimated cumulative speech duration per WORD within a single segment,
  // in milliseconds. We compute per-segment (not whole-story) because each
  // segment is now its own utterance — so `onstart` gives a hard sync point
  // at every paragraph break and drift can never compound past one segment.
  //
  // Tuning: modern desktop voices breathe much shorter than older SAPI
  // voices. Especially at our rate (0.85) the actual pauses are tiny.
  function computeSegmentTokenEndTimings(
    tokens: WordToken[],
    rate: number
  ): number[] {
    const msPerChar = 68 / rate
    const wordPauseMs = 25 / rate
    const commaPauseMs = 65 / rate
    const sentencePauseMs = 130 / rate

    const result: number[] = []
    let acc = 0

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      acc += token.text.length * msPerChar
      const next = tokens[i + 1]
      if (!next) {
        result.push(acc)
        continue
      }

      const trailing = token.text.match(/[.,;:!?"”’)\]]+$/)?.[0] ?? ''
      if (/[.!?]/.test(trailing)) {
        acc += sentencePauseMs
      } else if (/[,;:]/.test(trailing)) {
        acc += commaPauseMs
      } else {
        acc += wordPauseMs
      }

      result.push(acc)
    }
    return result
  }

  // ---------------------------------------------------------------------
  // Chained per-segment playback
  //
  // We speak each segment as its own utterance and chain them via `onend`.
  // This gives the highlight a HARD SYNC POINT at every paragraph break:
  // the segment's `onstart` event fires when audio for that paragraph
  // genuinely begins, and we re-anchor `activeWordIndex` to its first word.
  // Drift can therefore never accumulate past one paragraph.
  // ---------------------------------------------------------------------

  const PLAYBACK_RATE = 0.85

  function speakSegment(segIdx: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (cancelChainRef.current) return
    if (segIdx >= STORY_SEGMENTS.length) {
      // All segments spoken — playback complete.
      setActiveWordIndex(-1)
      setIsPlaying(false)
      utteranceRef.current = null
      activeSegmentIndexRef.current = 0
      return
    }

    const segment = STORY_SEGMENTS[segIdx]
    const segTokens = segmentTokens[segIdx]
    activeSegmentIndexRef.current = segIdx
    activeSegmentTokensRef.current = segTokens
    segmentTokenEndTimingsRef.current = computeSegmentTokenEndTimings(
      segTokens,
      PLAYBACK_RATE
    )

    // Reset per-segment fallback state.
    lastBoundaryAtRef.current = 0
    pausedAtRef.current = 0
    pausedDurationRef.current = 0
    segmentStartTimeRef.current = 0

    const utterance = new SpeechSynthesisUtterance(segment.text)
    utterance.lang = 'en-GB'
    utterance.rate = PLAYBACK_RATE
    utterance.pitch = 1
    const voice = pickVoice()
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      segmentStartTimeRef.current = performance.now()
      // Hard sync: highlight the first word of this segment the instant the
      // browser tells us audio has begun. This is the linchpin of the
      // chained design — `onstart` is reliable across all voices/browsers,
      // unlike `onboundary`.
      if (segTokens.length > 0) {
        setActiveWordIndex(segTokens[0].globalIndex)
      }
    }

    utterance.onboundary = (event) => {
      if (event.name && event.name !== 'word') return

      lastBoundaryAtRef.current = performance.now()
      // charIndex is relative to THIS segment's text (not the global story).
      const charIndex = event.charIndex
      let idx = -1
      for (let i = 0; i < segTokens.length; i++) {
        if (segTokens[i].segmentLocalStart <= charIndex) idx = i
        else break
      }
      if (idx >= 0) setActiveWordIndex(segTokens[idx].globalIndex)
    }

    utterance.onend = () => {
      utteranceRef.current = null
      // Chain to next segment — unless the user cancelled.
      if (cancelChainRef.current) return
      speakSegment(segIdx + 1)
    }

    utterance.onerror = () => {
      utteranceRef.current = null
      setActiveWordIndex(-1)
      setIsPlaying(false)
      cancelChainRef.current = true
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  function startSpeaking() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    cancelChainRef.current = false
    setIsPlaying(true)
    speakSegment(0)
  }

  function togglePlayback() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis

    if (isPlaying) {
      // Pause the current segment's utterance. The chain is preserved —
      // when we resume, the same utterance continues from where it stopped.
      pausedAtRef.current = performance.now()
      synth.pause()
      setIsPlaying(false)
      return
    }

    // Resume mid-segment.
    if (synth.paused && utteranceRef.current) {
      if (pausedAtRef.current > 0) {
        pausedDurationRef.current += performance.now() - pausedAtRef.current
        pausedAtRef.current = 0
      }
      synth.resume()
      setIsPlaying(true)
      return
    }

    startSpeaking()
  }

  // ---------------------------------------------------------------------
  // Per-segment fallback timer
  //
  // While playing, advances `activeWordIndex` based on estimated word
  // durations within the CURRENT segment only. If native boundary events
  // are firing for this voice (within the last ~700ms), the timer stands
  // down. Either way, drift is bounded by one paragraph — the next
  // segment's `onstart` event re-anchors the highlight to the right word.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying) return

    const id = window.setInterval(() => {
      const sinceBoundary = performance.now() - lastBoundaryAtRef.current
      if (lastBoundaryAtRef.current > 0 && sinceBoundary < 700) return

      const start = segmentStartTimeRef.current
      if (start === 0) return

      const elapsed = performance.now() - start - pausedDurationRef.current
      const cumulative = segmentTokenEndTimingsRef.current
      const segTokens = activeSegmentTokensRef.current
      if (cumulative.length === 0 || segTokens.length === 0) return

      // Find the first token whose end-time is greater than elapsed.
      let localIdx = -1
      for (let i = 0; i < cumulative.length; i++) {
        if (cumulative[i] > elapsed) {
          localIdx = i
          break
        }
      }
      if (localIdx >= 0) {
        const globalIdx = segTokens[localIdx].globalIndex
        setActiveWordIndex((current) => (current === globalIdx ? current : globalIdx))
      }
    }, 90)

    return () => window.clearInterval(id)
  }, [isPlaying])

  // ---------------------------------------------------------------------
  // Word rendering
  // ---------------------------------------------------------------------

  function renderWords(
    tokens: WordToken[],
    variant: 'heading' | 'body'
  ) {
    return tokens.map((token, i) => {
      const isActive = activeWordIndex === token.globalIndex

      let activeStyle: CSSProperties | undefined
      if (isActive) {
        if (variant === 'heading') {
          // Headings are already very large; a full pill background would shift
          // line height. We just recolor the word in church-green instead.
          activeStyle = { color: 'var(--church-green)' }
        } else {
          activeStyle = {
            backgroundColor: 'var(--church-green)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '6px',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            fontWeight: 600,
          }
        }
      }

      return (
        <span key={token.globalIndex}>
          <span className="transition-colors duration-150" style={activeStyle}>
            {token.text}
          </span>
          {i < tokens.length - 1 ? ' ' : ''}
        </span>
      )
    })
  }

  const headingTokens = segmentTokens[0]
  const bodySegments = STORY_SEGMENTS.slice(1).map((seg, i) => ({
    seg,
    tokens: segmentTokens[i + 1],
  }))

  return (
    <section className="bg-white px-[var(--section-padding-x)] py-20 md:py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.95fr_1fr] lg:gap-20">
          <div className="relative">
            <div
              className="absolute left-0 top-0 h-full w-4 rounded-l-lg"
              style={{ backgroundColor: 'var(--church-green)' }}
              aria-hidden="true"
            />
            <div className="ml-4 overflow-hidden rounded-lg bg-[#000666] shadow-[0_32px_70px_rgba(0,6,102,0.18)]">
              <div className="relative flex min-h-[38rem] items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(180deg,#07184a_0%,#000666_100%)] p-10 md:min-h-[54rem]">
                <Image
                  src="/logo.png"
                  alt="RCCG Glory Tabernacle"
                  width={620}
                  height={620}
                  className="h-auto w-full max-w-[34rem] object-contain opacity-95"
                  sizes="(max-width: 1024px) 85vw, 42vw"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-10 flex flex-wrap items-center gap-4">
              <p
                className="text-base font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--church-red)' }}
              >
                Our Story
              </p>

              {isSupported && (
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="group inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--church-green)]"
                  style={{
                    backgroundColor: 'rgba(0, 6, 102, 1)',
                  }}
                  aria-label={isPlaying ? 'Pause the story' : 'Listen to the story'}
                  aria-pressed={isPlaying}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 'var(--church-green)',
                      color: '#ffffff',
                    }}
                    aria-hidden="true"
                  >
                    {isPlaying ? (
                      <Pause className="h-3.5 w-3.5" fill="currentColor" />
                    ) : (
                      <Play
                        className="h-3.5 w-3.5"
                        fill="currentColor"
                        style={{ transform: 'translateX(1px)' }}
                      />
                    )}
                  </span>
                  {isPlaying ? 'Pause' : 'Listen'}
                </button>
              )}
            </div>

            <h2
              className="max-w-[54rem] text-5xl font-extrabold leading-[1.03] tracking-normal md:text-6xl xl:text-7xl"
              style={{ color: 'rgba(0, 6, 102, 1)' }}
            >
              {renderWords(headingTokens, 'heading')}
            </h2>

            <div className="mt-12 space-y-8 text-sm leading-[1.85] text-[#555864] md:text-[0.95rem]">
              {bodySegments.map(({ seg, tokens }, idx) => (
                <p
                  key={idx}
                  className={seg.kind === 'bold' ? 'font-extrabold' : undefined}
                  style={
                    seg.kind === 'bold'
                      ? { color: 'rgba(0, 6, 102, 1)' }
                      : undefined
                  }
                >
                  {renderWords(tokens, 'body')}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
