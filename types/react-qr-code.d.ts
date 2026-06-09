/**
 * Ambient type declaration for `react-qr-code`. The package ships types at
 * `types/index.d.ts` but doesn't expose them through its package.json
 * `exports` field, so TypeScript's bundler/node16 module resolution can't
 * find them and falls back to `any`. Declaring the module here gives us
 * proper typings without forking the upstream package.
 *
 * This file is picked up automatically because the Next.js tsconfig
 * includes `**\/*.ts` (which matches `.d.ts` files anywhere in the project).
 */

declare module 'react-qr-code' {
  import { ComponentType, CSSProperties, SVGProps } from 'react'

  export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

  export interface QRCodeProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    /** The data string to encode in the QR code (URL, plain text, etc.). */
    value: string
    /** Pixel size of one edge of the square. Defaults to 256. */
    size?: number
    /** Error-correction level. Defaults to 'L'. */
    level?: ErrorCorrectionLevel
    /** CSS color for the background. Defaults to '#FFFFFF'. */
    bgColor?: string
    /** CSS color for the dark modules. Defaults to '#000000'. */
    fgColor?: string
    /** Accessible title for the rendered SVG. */
    title?: string
    /** SVG `viewBox` attribute. */
    viewBox?: string
    style?: CSSProperties
    className?: string
  }

  const QRCode: ComponentType<QRCodeProps>
  export default QRCode
}
