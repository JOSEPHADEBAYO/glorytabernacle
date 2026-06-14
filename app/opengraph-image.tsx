import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Default Open Graph image for every page in the app.
 *
 * Next.js auto-attaches this to every route under /app that doesn't supply
 * its own `metadata.openGraph.images`. So WhatsApp / iMessage / Slack /
 * Facebook / Twitter / LinkedIn all show the same branded card when anyone
 * shares a link from this site — instead of falling back to the favicon.
 *
 * Routes that override it (currently /inaugural-service/register and
 * /inaugural-service/programme — they show the programme poster) keep
 * their custom image. New routes inherit this one automatically; no
 * per-page metadata work needed.
 *
 * Generated at request time on the Node runtime via Vercel's `next/og`
 * (Satori under the hood). Satori has tight CSS limits — only flex
 * layout, every node with children needs `display:flex`, no Tailwind by
 * default — which is why the JSX below uses inline styles.
 */

export const runtime = 'nodejs'

export const alt =
  'RCCG Glory Tabernacle, Barnstaple — Furnish · Transform · Influence'

export const size = { width: 1200, height: 630 }

export const contentType = 'image/png'

export default async function OpengraphImage() {
  // Inline the logo as base64 so Satori doesn't have to fetch it across
  // the network at render time. Node runtime is required for fs access.
  const logoBuffer = await readFile(
    join(process.cwd(), 'public', 'logo.png')
  )
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Two-stop navy gradient — slightly lighter top-left, deepest at
          // bottom-right — gives the flat brand colour a bit of depth.
          background:
            'linear-gradient(135deg, #07184a 0%, #000666 50%, #00041f 100%)',
          position: 'relative',
          padding: 80,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Glow accent — top-right, light green (matches the church's
            light-green accent used across the site and emails). */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              'radial-gradient(circle, rgba(163,246,156,0.18) 0%, rgba(0,6,102,0) 70%)',
            display: 'flex',
          }}
        />
        {/* Glow accent — bottom-left, soft white, for visual balance. */}
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -200,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(0,6,102,0) 70%)',
            display: 'flex',
          }}
        />

        {/* Subtle accent stripe under the logo block — light green. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <img
            src={logoSrc}
            width={300}
            height={300}
            alt=""
            style={{ marginBottom: 36 }}
          />

          {/* Hairline divider */}
          <div
            style={{
              display: 'flex',
              width: 96,
              height: 3,
              background: 'rgba(163,246,156,1)',
              borderRadius: 2,
              marginBottom: 28,
            }}
          />

          {/* Church name — main display text */}
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -1,
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 24,
              padding: '0 40px',
            }}
          >
            RCCG Glory Tabernacle, Barnstaple
          </div>

          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 700,
              color: 'rgba(163,246,156,1)',
              letterSpacing: 8,
              textTransform: 'uppercase',
            }}
          >
            Furnish · Transform · Influence
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
