'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

// ---------------------------------------------------------------------------
// Story content
// ---------------------------------------------------------------------------
//
// Plain reading copy, rendered in the right-hand column. The audio narration
// is a pre-recorded MP4 in /public (About_us.mp4) — the Listen button starts /
// pauses it. We deliberately do NOT sync word-by-word highlighting to the
// audio: that worked when the browser's Web Speech API exposed `boundary`
// events, but with a static audio file there's no reliable boundary signal,
// and time-based estimates always drift. Cleaner to let the narrator carry it.

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
      "That question became a conviction, that conviction became a calling, and that calling became The RCCG Glory Tabernacle, Barnstaple, planted in the heart of Barnstaple, North Devon, with a mandate to liberate God's people, thereby walking in absolute victory.",
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
  { kind: 'bold', text: 'Welcome to RCCG Glory Tabernacle,' },
]

// Single source of truth for the narration file path. Lives in /public so
// Next.js serves it at the root. The filename is case-sensitive on Linux —
// keep the capital A in "About_us.mp4" matching the file on disk.
const NARRATION_SRC = '/About_us.mp4'

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

export function OurStorySection() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Keep React state in sync with the audio element's own events — covers
  // the case where playback ends naturally, the user pauses via OS media
  // controls, or autoplay is blocked and play() rejects.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      return
    }

    // play() returns a promise that may reject (e.g. mobile autoplay rules
    // before the first user gesture — but this IS a user gesture, so it
    // should always resolve). Catch defensively so we don't strand the
    // button in a "playing" state if it ever fails.
    void audio.play().catch(() => setIsPlaying(false))
  }

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
                  alt="RCCG Glory Tabernacle, Barnstaple"
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

              <button
                type="button"
                onClick={togglePlayback}
                className="group inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--church-green)]"
                style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
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

              {/* Hidden narration element. `preload="metadata"` fetches just
                  enough to know the duration without downloading the whole
                  file up front. Browsers ignore the missing controls UI
                  because we drive playback from the button above. */}
              <audio ref={audioRef} src={NARRATION_SRC} preload="metadata" />
            </div>

            <h2
              className="max-w-[54rem] text-5xl font-extrabold leading-[1.03] tracking-normal md:text-6xl xl:text-7xl"
              style={{ color: 'rgba(0, 6, 102, 1)' }}
            >
              {HEADING_TEXT}
            </h2>

            <div className="mt-12 space-y-8 text-sm leading-[1.85] text-[#555864] md:text-[0.95rem]">
              {STORY_SEGMENTS.slice(1).map((seg, idx) => (
                <p
                  key={idx}
                  className={seg.kind === 'bold' ? 'font-extrabold' : undefined}
                  style={
                    seg.kind === 'bold'
                      ? { color: 'rgba(0, 6, 102, 1)' }
                      : undefined
                  }
                >
                  {seg.text}
                </p>
              ))}
            </div>
            <p
              className="mt-1 text-sm font-extrabold md:text-[0.95rem]"
              style={{ color: 'rgba(0, 6, 102, 1)' }}
            >
              Barnstaple, England
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
