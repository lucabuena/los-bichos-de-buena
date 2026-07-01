export type BichoAppearance = {
  color: string
  bodyColor: string
  eyeColor: string
  shape: 'round' | 'spiky' | 'blobby' | 'tall' | 'wide' | 'pear'
  eyes: 'normal' | 'wide' | 'sleepy' | 'star' | 'spiral' | 'angry' | 'heart' | 'suspicious'
  mouth: 'smile' | 'grin' | 'laugh' | 'surprised' | 'tongue' | 'nervous' | 'frown'
  brows: 'none' | 'raised' | 'furrowed' | 'uneven'
  accessory: 'none' | 'hat' | 'antenna' | 'crown' | 'horns' | 'bow' | 'party' | 'bunny' | 'flower' | 'beanie'
  legs: 'stubby' | 'long' | 'round' | 'none'
  arms: 'up' | 'out' | 'tiny' | 'none'
  belly: 'none' | 'spots' | 'stripes' | 'patch' | 'heart'
  blush: boolean
}

const COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6',
  '#c77dff', '#ff9a3c', '#00f5d4', '#f72585', '#7209b7',
  '#3a86ff', '#fb5607', '#8ecae6', '#95d5b2', '#ffb703',
]
const SHAPES: BichoAppearance['shape'][] = ['round', 'spiky', 'blobby', 'tall', 'wide', 'pear']
const EYES: BichoAppearance['eyes'][] = ['normal', 'wide', 'sleepy', 'star', 'spiral', 'angry', 'heart', 'suspicious']
const MOUTHS: BichoAppearance['mouth'][] = ['smile', 'grin', 'laugh', 'surprised', 'tongue', 'nervous', 'frown']
const BROWS: BichoAppearance['brows'][] = ['none', 'raised', 'furrowed', 'uneven']
const ACCESSORIES: BichoAppearance['accessory'][] = ['none', 'hat', 'antenna', 'crown', 'horns', 'bow', 'party', 'bunny', 'flower', 'beanie']
const LEGS: BichoAppearance['legs'][] = ['stubby', 'long', 'round', 'none']
const ARMS: BichoAppearance['arms'][] = ['up', 'out', 'tiny', 'none']
const BELLIES: BichoAppearance['belly'][] = ['none', 'spots', 'stripes', 'patch', 'heart']

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function generateBicho(name: string): BichoAppearance {
  const h = hashString(name)
  return {
    color:       COLORS[h % COLORS.length],
    bodyColor:   COLORS[(h >> 3) % COLORS.length],
    eyeColor:    COLORS[(h >> 6) % COLORS.length],
    shape:       SHAPES[(h >> 2) % SHAPES.length],
    eyes:        EYES[(h >> 4) % EYES.length],
    mouth:       MOUTHS[(h >> 7) % MOUTHS.length],
    brows:       BROWS[(h >> 9) % BROWS.length],
    accessory:   ACCESSORIES[(h >> 5) % ACCESSORIES.length],
    legs:        LEGS[(h >> 8) % LEGS.length],
    arms:        ARMS[(h >> 10) % ARMS.length],
    belly:       BELLIES[(h >> 11) % BELLIES.length],
    blush:       (h >> 12) % 3 === 0,
  }
}

export function BichoSVG({ appearance, size = 80, walkFrame = 0 }: { appearance: BichoAppearance; size?: number; walkFrame?: number }): string {
  const { color, shape, eyes, mouth, brows, accessory, eyeColor, legs, arms, belly, blush } = appearance
  const stepL = walkFrame === 1 ? -size * 0.06 : walkFrame === 3 ? size * 0.05 : 0
  const stepR = walkFrame === 1 ? size * 0.05 : walkFrame === 3 ? -size * 0.06 : 0

  const cx = size / 2
  const baseY = size * 0.54
  let bw = size * 0.38  // body half-width
  let bh = size * 0.36  // body half-height

  // Shape overrides
  if (shape === 'tall')  { bw = size * 0.28; bh = size * 0.44 }
  if (shape === 'wide')  { bw = size * 0.46; bh = size * 0.28 }
  if (shape === 'pear')  { bw = size * 0.40; bh = size * 0.38 }

  const top = baseY - bh
  const bot = baseY + bh

  // ── Body ──────────────────────────────────────────────────────────────────
  let bodyPath = ''
  if (shape === 'round' || shape === 'tall' || shape === 'wide') {
    bodyPath = `M ${cx} ${top} A ${bw} ${bh} 0 1 1 ${cx - 0.01} ${top} Z`
  } else if (shape === 'spiky') {
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
      const rad = i % 2 === 0 ? bw : bw * 0.62
      pts.push(`${cx + Math.cos(angle) * rad},${baseY + Math.sin(angle) * rad * (bh / bw)}`)
    }
    bodyPath = `M ${pts.join(' L ')} Z`
  } else if (shape === 'blobby') {
    const x1 = cx, y1 = top
    const x2 = cx + bw * 1.1, y2 = baseY
    const x3 = cx, y3 = bot
    const x4 = cx - bw * 1.1, y4 = baseY
    bodyPath = `M ${x1} ${y1} C ${cx + bw * 1.5} ${y1}, ${x2} ${y2 - bh * 0.8}, ${x2} ${y2} C ${x2} ${y2 + bh * 0.8}, ${cx + bw * 1.3} ${y3}, ${x3} ${y3} C ${cx - bw * 1.3} ${y3}, ${x4} ${y2 + bh * 0.8}, ${x4} ${y2} C ${x4} ${y2 - bh * 0.8}, ${cx - bw * 1.5} ${y1}, ${x1} ${y1} Z`
  } else if (shape === 'pear') {
    bodyPath = `M ${cx} ${top} C ${cx + bw * 0.7} ${top}, ${cx + bw * 1.15} ${baseY - bh * 0.2}, ${cx + bw * 1.0} ${baseY + bh * 0.3} C ${cx + bw * 0.9} ${bot}, ${cx - bw * 0.9} ${bot}, ${cx - bw * 1.0} ${baseY + bh * 0.3} C ${cx - bw * 1.15} ${baseY - bh * 0.2}, ${cx - bw * 0.7} ${top}, ${cx} ${top} Z`
  }

  // ── Legs ──────────────────────────────────────────────────────────────────
  let legsSVG = ''
  const legY = bot
  const legGap = bw * 0.45
  if (legs === 'stubby') {
    legsSVG = `
      <rect x="${cx - legGap - size*0.07}" y="${legY - size*0.02 + stepL}" width="${size*0.14}" height="${size*0.14}" rx="${size*0.05}" fill="${color}" />
      <rect x="${cx + legGap - size*0.07}" y="${legY - size*0.02 + stepR}" width="${size*0.14}" height="${size*0.14}" rx="${size*0.05}" fill="${color}" />
    `
  } else if (legs === 'long') {
    legsSVG = `
      <rect x="${cx - legGap - size*0.05}" y="${legY - size*0.02 + stepL}" width="${size*0.1}" height="${size*0.2}" rx="${size*0.04}" fill="${color}" />
      <rect x="${cx + legGap - size*0.05}" y="${legY - size*0.02 + stepR}" width="${size*0.1}" height="${size*0.2}" rx="${size*0.04}" fill="${color}" />
      <ellipse cx="${cx - legGap}" cy="${legY + size*0.2 + stepL}" rx="${size*0.07}" ry="${size*0.04}" fill="${eyeColor}" />
      <ellipse cx="${cx + legGap}" cy="${legY + size*0.2 + stepR}" rx="${size*0.07}" ry="${size*0.04}" fill="${eyeColor}" />
    `
  } else if (legs === 'round') {
    legsSVG = `
      <circle cx="${cx - legGap}" cy="${legY + size*0.06 + stepL}" r="${size*0.09}" fill="${color}" />
      <circle cx="${cx + legGap}" cy="${legY + size*0.06 + stepR}" r="${size*0.09}" fill="${color}" />
    `
  }

  // ── Arms ──────────────────────────────────────────────────────────────────
  let armsSVG = ''
  const armY = baseY - bh * 0.1
  if (arms === 'up') {
    armsSVG = `
      <path d="M ${cx - bw * 0.92} ${armY} C ${cx - bw * 1.4} ${armY - size*0.15}, ${cx - bw * 1.3} ${armY - size*0.28}, ${cx - bw * 1.05} ${armY - size*0.3}" stroke="${color}" stroke-width="${size*0.09}" stroke-linecap="round" fill="none"/>
      <path d="M ${cx + bw * 0.92} ${armY} C ${cx + bw * 1.4} ${armY - size*0.15}, ${cx + bw * 1.3} ${armY - size*0.28}, ${cx + bw * 1.05} ${armY - size*0.3}" stroke="${color}" stroke-width="${size*0.09}" stroke-linecap="round" fill="none"/>
    `
  } else if (arms === 'out') {
    armsSVG = `
      <path d="M ${cx - bw * 0.92} ${armY} L ${cx - bw * 1.5} ${armY + size*0.05}" stroke="${color}" stroke-width="${size*0.09}" stroke-linecap="round" fill="none"/>
      <path d="M ${cx + bw * 0.92} ${armY} L ${cx + bw * 1.5} ${armY + size*0.05}" stroke="${color}" stroke-width="${size*0.09}" stroke-linecap="round" fill="none"/>
    `
  } else if (arms === 'tiny') {
    armsSVG = `
      <circle cx="${cx - bw * 1.08}" cy="${armY}" r="${size*0.07}" fill="${color}" />
      <circle cx="${cx + bw * 1.08}" cy="${armY}" r="${size*0.07}" fill="${color}" />
    `
  }

  // ── Belly ─────────────────────────────────────────────────────────────────
  const bellyColor = `${eyeColor}55`
  let bellySVG = ''
  const bellyY = baseY + bh * 0.1
  if (belly === 'patch') {
    bellySVG = `<ellipse cx="${cx}" cy="${bellyY}" rx="${bw*0.55}" ry="${bh*0.45}" fill="${bellyColor}" />`
  } else if (belly === 'spots') {
    bellySVG = `
      <circle cx="${cx - bw*0.2}" cy="${bellyY - bh*0.1}" r="${size*0.06}" fill="${bellyColor}" />
      <circle cx="${cx + bw*0.2}" cy="${bellyY + bh*0.05}" r="${size*0.05}" fill="${bellyColor}" />
      <circle cx="${cx}" cy="${bellyY + bh*0.18}" r="${size*0.04}" fill="${bellyColor}" />
    `
  } else if (belly === 'stripes') {
    bellySVG = `
      <ellipse cx="${cx}" cy="${bellyY - bh*0.15}" rx="${bw*0.4}" ry="${size*0.04}" fill="${bellyColor}" />
      <ellipse cx="${cx}" cy="${bellyY + bh*0.08}" rx="${bw*0.35}" ry="${size*0.035}" fill="${bellyColor}" />
    `
  } else if (belly === 'heart') {
    const hx = cx, hy = bellyY - bh*0.05, hs = size*0.1
    bellySVG = `<path d="M ${hx} ${hy + hs*0.8} C ${hx - hs*1.2} ${hy + hs*0.3}, ${hx - hs*1.5} ${hy - hs*0.5}, ${hx} ${hy} C ${hx + hs*1.5} ${hy - hs*0.5}, ${hx + hs*1.2} ${hy + hs*0.3}, ${hx} ${hy + hs*0.8} Z" fill="${bellyColor}" />`
  }

  // ── Eyes ──────────────────────────────────────────────────────────────────
  const eyeY = baseY - bh * 0.28
  const eyeSpacing = bw * 0.4
  const er = size * 0.1  // eye radius
  let eyesSVG = ''

  if (eyes === 'normal') {
    eyesSVG = `
      <circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx - eyeSpacing + er*0.25}" cy="${eyeY + er*0.2}" r="${er*0.55}" fill="${eyeColor}" />
      <circle cx="${cx + eyeSpacing + er*0.25}" cy="${eyeY + er*0.2}" r="${er*0.55}" fill="${eyeColor}" />
      <circle cx="${cx - eyeSpacing + er*0.1}" cy="${eyeY - er*0.15}" r="${er*0.2}" fill="white" />
      <circle cx="${cx + eyeSpacing + er*0.1}" cy="${eyeY - er*0.15}" r="${er*0.2}" fill="white" />
    `
  } else if (eyes === 'wide') {
    eyesSVG = `
      <circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${er*1.35}" fill="white" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${er*1.35}" fill="white" />
      <circle cx="${cx - eyeSpacing + er*0.3}" cy="${eyeY + er*0.3}" r="${er*0.7}" fill="${eyeColor}" />
      <circle cx="${cx + eyeSpacing + er*0.3}" cy="${eyeY + er*0.3}" r="${er*0.7}" fill="${eyeColor}" />
      <circle cx="${cx - eyeSpacing}" cy="${eyeY - er*0.3}" r="${er*0.25}" fill="white" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY - er*0.3}" r="${er*0.25}" fill="white" />
    `
  } else if (eyes === 'sleepy') {
    eyesSVG = `
      <circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <path d="M ${cx - eyeSpacing - er} ${eyeY} Q ${cx - eyeSpacing} ${eyeY - er * 0.4} ${cx - eyeSpacing + er} ${eyeY}" fill="${color}" />
      <path d="M ${cx + eyeSpacing - er} ${eyeY} Q ${cx + eyeSpacing} ${eyeY - er * 0.4} ${cx + eyeSpacing + er} ${eyeY}" fill="${color}" />
      <circle cx="${cx - eyeSpacing}" cy="${eyeY + er*0.3}" r="${er*0.45}" fill="${eyeColor}" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY + er*0.3}" r="${er*0.45}" fill="${eyeColor}" />
    `
  } else if (eyes === 'star') {
    const starPts = (sx: number, sy: number) => {
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        const r2 = i % 2 === 0 ? er * 1.1 : er * 0.45
        pts.push(`${sx + Math.cos(a) * r2},${sy + Math.sin(a) * r2}`)
      }
      return pts.join(' ')
    }
    eyesSVG = `
      <polygon points="${starPts(cx - eyeSpacing, eyeY)}" fill="${eyeColor}" />
      <polygon points="${starPts(cx + eyeSpacing, eyeY)}" fill="${eyeColor}" />
    `
  } else if (eyes === 'spiral') {
    eyesSVG = `
      <circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <path d="M ${cx - eyeSpacing} ${eyeY} m ${er*0.6} 0 a ${er*0.6} ${er*0.6} 0 1 1 -${er*0.6} ${er*0.6} a ${er*0.3} ${er*0.3} 0 1 0 ${er*0.3} 0" stroke="${eyeColor}" stroke-width="${er*0.25}" fill="none" />
      <path d="M ${cx + eyeSpacing} ${eyeY} m ${er*0.6} 0 a ${er*0.6} ${er*0.6} 0 1 1 -${er*0.6} ${er*0.6} a ${er*0.3} ${er*0.3} 0 1 0 ${er*0.3} 0" stroke="${eyeColor}" stroke-width="${er*0.25}" fill="none" />
    `
  } else if (eyes === 'angry') {
    eyesSVG = `
      <circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx - eyeSpacing}" cy="${eyeY + er*0.3}" r="${er*0.55}" fill="${eyeColor}" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY + er*0.3}" r="${er*0.55}" fill="${eyeColor}" />
      <path d="M ${cx - eyeSpacing - er} ${eyeY - er*0.3} L ${cx - eyeSpacing + er} ${eyeY - er*0.7}" stroke="${eyeColor}" stroke-width="${er*0.4}" stroke-linecap="round" />
      <path d="M ${cx + eyeSpacing - er} ${eyeY - er*0.7} L ${cx + eyeSpacing + er} ${eyeY - er*0.3}" stroke="${eyeColor}" stroke-width="${er*0.4}" stroke-linecap="round" />
    `
  } else if (eyes === 'heart') {
    const heartEye = (hx: number, hy: number) => {
      const hs = er * 0.9
      return `<path d="M ${hx} ${hy + hs*0.5} C ${hx - hs} ${hy + hs*0.1}, ${hx - hs*1.1} ${hy - hs*0.6}, ${hx} ${hy - hs*0.15} C ${hx + hs*1.1} ${hy - hs*0.6}, ${hx + hs} ${hy + hs*0.1}, ${hx} ${hy + hs*0.5} Z" fill="${eyeColor}" />`
    }
    eyesSVG = heartEye(cx - eyeSpacing, eyeY) + heartEye(cx + eyeSpacing, eyeY)
  } else if (eyes === 'suspicious') {
    eyesSVG = `
      <circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${er}" fill="white" />
      <circle cx="${cx - eyeSpacing + er*0.4}" cy="${eyeY + er*0.3}" r="${er*0.55}" fill="${eyeColor}" />
      <circle cx="${cx + eyeSpacing + er*0.4}" cy="${eyeY + er*0.3}" r="${er*0.55}" fill="${eyeColor}" />
      <path d="M ${cx - eyeSpacing - er} ${eyeY + er*0.1} Q ${cx - eyeSpacing} ${eyeY - er*0.6} ${cx - eyeSpacing + er} ${eyeY + er*0.1}" fill="${color}" />
      <path d="M ${cx + eyeSpacing - er} ${eyeY + er*0.1} Q ${cx + eyeSpacing} ${eyeY - er*0.6} ${cx + eyeSpacing + er} ${eyeY + er*0.1}" fill="${color}" />
    `
  }

  // ── Brows ─────────────────────────────────────────────────────────────────
  const browY = eyeY - er * 1.3
  const browW = er * 1.0
  let browsSVG = ''
  if (brows === 'raised') {
    browsSVG = `
      <path d="M ${cx - eyeSpacing - browW} ${browY + er*0.3} Q ${cx - eyeSpacing} ${browY - er*0.1} ${cx - eyeSpacing + browW} ${browY + er*0.3}" stroke="${eyeColor}" stroke-width="${er*0.35}" fill="none" stroke-linecap="round" />
      <path d="M ${cx + eyeSpacing - browW} ${browY + er*0.3} Q ${cx + eyeSpacing} ${browY - er*0.1} ${cx + eyeSpacing + browW} ${browY + er*0.3}" stroke="${eyeColor}" stroke-width="${er*0.35}" fill="none" stroke-linecap="round" />
    `
  } else if (brows === 'furrowed') {
    browsSVG = `
      <path d="M ${cx - eyeSpacing - browW} ${browY} L ${cx - eyeSpacing + browW} ${browY + er*0.5}" stroke="${eyeColor}" stroke-width="${er*0.4}" stroke-linecap="round" />
      <path d="M ${cx + eyeSpacing - browW} ${browY + er*0.5} L ${cx + eyeSpacing + browW} ${browY}" stroke="${eyeColor}" stroke-width="${er*0.4}" stroke-linecap="round" />
    `
  } else if (brows === 'uneven') {
    browsSVG = `
      <path d="M ${cx - eyeSpacing - browW} ${browY} Q ${cx - eyeSpacing} ${browY + er*0.4} ${cx - eyeSpacing + browW} ${browY + er*0.3}" stroke="${eyeColor}" stroke-width="${er*0.35}" fill="none" stroke-linecap="round" />
      <path d="M ${cx + eyeSpacing - browW} ${browY + er*0.4} L ${cx + eyeSpacing + browW} ${browY - er*0.1}" stroke="${eyeColor}" stroke-width="${er*0.35}" stroke-linecap="round" />
    `
  }

  // ── Mouth ─────────────────────────────────────────────────────────────────
  const mouthY = baseY + bh * 0.25
  const mouthW = bw * 0.45
  let mouthSVG = ''
  if (mouth === 'smile') {
    mouthSVG = `<path d="M ${cx - mouthW} ${mouthY - size*0.02} Q ${cx} ${mouthY + size*0.07} ${cx + mouthW} ${mouthY - size*0.02}" stroke="${eyeColor}" stroke-width="${er*0.4}" fill="none" stroke-linecap="round" />`
  } else if (mouth === 'grin') {
    mouthSVG = `
      <path d="M ${cx - mouthW} ${mouthY - size*0.02} Q ${cx} ${mouthY + size*0.1} ${cx + mouthW} ${mouthY - size*0.02}" stroke="${eyeColor}" stroke-width="${er*0.4}" fill="none" stroke-linecap="round" />
      <path d="M ${cx - mouthW * 0.7} ${mouthY} Q ${cx} ${mouthY + size*0.09} ${cx + mouthW * 0.7} ${mouthY}" fill="white" />
    `
  } else if (mouth === 'laugh') {
    mouthSVG = `
      <ellipse cx="${cx}" cy="${mouthY + size*0.01}" rx="${mouthW * 0.85}" ry="${size*0.08}" fill="${eyeColor}" />
      <ellipse cx="${cx}" cy="${mouthY + size*0.01}" rx="${mouthW * 0.65}" ry="${size*0.055}" fill="white" />
    `
  } else if (mouth === 'surprised') {
    mouthSVG = `<ellipse cx="${cx}" cy="${mouthY}" rx="${mouthW * 0.45}" ry="${size*0.07}" fill="${eyeColor}" />`
  } else if (mouth === 'tongue') {
    mouthSVG = `
      <path d="M ${cx - mouthW * 0.6} ${mouthY - size*0.01} Q ${cx} ${mouthY + size*0.07} ${cx + mouthW * 0.6} ${mouthY - size*0.01}" stroke="${eyeColor}" stroke-width="${er*0.4}" fill="none" stroke-linecap="round" />
      <ellipse cx="${cx + mouthW*0.15}" cy="${mouthY + size*0.07}" rx="${size*0.08}" ry="${size*0.06}" fill="#ff6b9d" />
    `
  } else if (mouth === 'nervous') {
    mouthSVG = `<path d="M ${cx - mouthW * 0.7} ${mouthY} Q ${cx - mouthW*0.3} ${mouthY - size*0.04} ${cx} ${mouthY} Q ${cx + mouthW*0.3} ${mouthY + size*0.04} ${cx + mouthW*0.7} ${mouthY}" stroke="${eyeColor}" stroke-width="${er*0.4}" fill="none" stroke-linecap="round" />`
  } else if (mouth === 'frown') {
    mouthSVG = `<path d="M ${cx - mouthW * 0.7} ${mouthY + size*0.04} Q ${cx} ${mouthY - size*0.04} ${cx + mouthW * 0.7} ${mouthY + size*0.04}" stroke="${eyeColor}" stroke-width="${er*0.4}" fill="none" stroke-linecap="round" />`
  }

  // ── Blush ─────────────────────────────────────────────────────────────────
  const blushSVG = blush ? `
    <ellipse cx="${cx - bw * 0.55}" cy="${baseY + bh*0.05}" rx="${er*0.8}" ry="${er*0.45}" fill="#ff9a9a60" />
    <ellipse cx="${cx + bw * 0.55}" cy="${baseY + bh*0.05}" rx="${er*0.8}" ry="${er*0.45}" fill="#ff9a9a60" />
  ` : ''

  // ── Accessory ─────────────────────────────────────────────────────────────
  const headTop = top - bh * 0.05
  let accessorySVG = ''
  if (accessory === 'antenna') {
    accessorySVG = `
      <line x1="${cx + bw*0.15}" y1="${headTop}" x2="${cx + bw*0.35}" y2="${headTop - bh*0.65}" stroke="${eyeColor}" stroke-width="${er*0.3}" stroke-linecap="round" />
      <circle cx="${cx + bw*0.35}" cy="${headTop - bh*0.65}" r="${er*0.35}" fill="${eyeColor}" />
    `
  } else if (accessory === 'hat') {
    const hbw = bw * 0.75
    accessorySVG = `
      <rect x="${cx - hbw * 0.65}" y="${headTop - bh*0.7}" width="${hbw * 1.3}" height="${bh*0.55}" rx="${er*0.3}" fill="${eyeColor}" />
      <rect x="${cx - hbw}" y="${headTop - bh*0.18}" width="${hbw * 2}" height="${bh*0.2}" rx="${er*0.2}" fill="${eyeColor}" />
    `
  } else if (accessory === 'crown') {
    accessorySVG = `<path d="M ${cx - bw*0.55} ${headTop - bh*0.08} L ${cx - bw*0.55} ${headTop - bh*0.55} L ${cx - bw*0.2} ${headTop - bh*0.3} L ${cx} ${headTop - bh*0.6} L ${cx + bw*0.2} ${headTop - bh*0.3} L ${cx + bw*0.55} ${headTop - bh*0.55} L ${cx + bw*0.55} ${headTop - bh*0.08} Z" fill="${eyeColor}" />`
  } else if (accessory === 'horns') {
    accessorySVG = `
      <path d="M ${cx - bw*0.3} ${headTop} L ${cx - bw*0.5} ${headTop - bh*0.55} L ${cx - bw*0.1} ${headTop}" fill="${eyeColor}" />
      <path d="M ${cx + bw*0.1} ${headTop} L ${cx + bw*0.5} ${headTop - bh*0.55} L ${cx + bw*0.3} ${headTop}" fill="${eyeColor}" />
    `
  } else if (accessory === 'bow') {
    accessorySVG = `
      <path d="M ${cx - bw*0.45} ${headTop - bh*0.15} L ${cx - bw*0.1} ${headTop - bh*0.38} L ${cx - bw*0.45} ${headTop - bh*0.55} Z" fill="${eyeColor}" opacity="0.9" />
      <path d="M ${cx + bw*0.45} ${headTop - bh*0.15} L ${cx + bw*0.1} ${headTop - bh*0.38} L ${cx + bw*0.45} ${headTop - bh*0.55} Z" fill="${eyeColor}" opacity="0.9" />
      <circle cx="${cx}" cy="${headTop - bh*0.35}" r="${er*0.4}" fill="${eyeColor}" />
    `
  } else if (accessory === 'party') {
    accessorySVG = `
      <path d="M ${cx - bw*0.2} ${headTop - bh*0.05} L ${cx} ${headTop - bh*0.75} L ${cx + bw*0.2} ${headTop - bh*0.05} Z" fill="${eyeColor}" />
      <circle cx="${cx}" cy="${headTop - bh*0.78}" r="${er*0.3}" fill="#ffd93d" />
    `
  } else if (accessory === 'bunny') {
    accessorySVG = `
      <ellipse cx="${cx - bw*0.28}" cy="${headTop - bh*0.55}" rx="${er*0.35}" ry="${er*0.8}" fill="${eyeColor}" />
      <ellipse cx="${cx + bw*0.28}" cy="${headTop - bh*0.55}" rx="${er*0.35}" ry="${er*0.8}" fill="${eyeColor}" />
      <ellipse cx="${cx - bw*0.28}" cy="${headTop - bh*0.55}" rx="${er*0.18}" ry="${er*0.55}" fill="#ff9a9a" />
      <ellipse cx="${cx + bw*0.28}" cy="${headTop - bh*0.55}" rx="${er*0.18}" ry="${er*0.55}" fill="#ff9a9a" />
    `
  } else if (accessory === 'flower') {
    const petals = 6
    const pr = er * 0.4
    const fc = `${cx + bw*0.2}`
    const fy = headTop - bh*0.35
    let petSVG = ''
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2
      petSVG += `<ellipse cx="${parseFloat(fc) + Math.cos(a)*pr*1.8}" cy="${fy + Math.sin(a)*pr*1.8}" rx="${pr}" ry="${pr*0.6}" transform="rotate(${(i/petals)*360} ${parseFloat(fc) + Math.cos(a)*pr*1.8} ${fy + Math.sin(a)*pr*1.8})" fill="${eyeColor}" />`
    }
    accessorySVG = petSVG + `<circle cx="${fc}" cy="${fy}" r="${pr*0.9}" fill="#ffd93d" />`
  } else if (accessory === 'beanie') {
    accessorySVG = `
      <path d="M ${cx - bw*0.72} ${headTop - bh*0.05} Q ${cx} ${headTop - bh*0.75} ${cx + bw*0.72} ${headTop - bh*0.05} Z" fill="${eyeColor}" />
      <rect x="${cx - bw*0.72}" y="${headTop - bh*0.12}" width="${bw*1.44}" height="${bh*0.2}" rx="${er*0.2}" fill="${eyeColor}" opacity="0.8" />
      <circle cx="${cx}" cy="${headTop - bh*0.72}" r="${er*0.35}" fill="${eyeColor}" />
    `
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${legsSVG}
    ${armsSVG}
    <path d="${bodyPath}" fill="${color}" />
    ${bellySVG}
    ${browsSVG}
    ${eyesSVG}
    ${mouthSVG}
    ${blushSVG}
    ${accessorySVG}
  </svg>`
}
