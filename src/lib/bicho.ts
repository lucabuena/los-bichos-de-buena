// Generiert einen deterministischen Bicho-Avatar aus dem Namen
export type BichoAppearance = {
  color: string
  shape: 'round' | 'spiky' | 'blobby' | 'square'
  eyes: 'normal' | 'wide' | 'sleepy' | 'cross'
  accessory: 'none' | 'hat' | 'antenna' | 'crown' | 'horns'
  bodyColor: string
  eyeColor: string
}

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6', '#c77dff', '#ff9a3c', '#00f5d4']
const SHAPES: BichoAppearance['shape'][] = ['round', 'spiky', 'blobby', 'square']
const EYES: BichoAppearance['eyes'][] = ['normal', 'wide', 'sleepy', 'cross']
const ACCESSORIES: BichoAppearance['accessory'][] = ['none', 'hat', 'antenna', 'crown', 'horns']

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
  const hash = hashString(name)
  return {
    color: COLORS[hash % COLORS.length],
    bodyColor: COLORS[(hash >> 3) % COLORS.length],
    eyeColor: COLORS[(hash >> 6) % COLORS.length],
    shape: SHAPES[(hash >> 2) % SHAPES.length],
    eyes: EYES[(hash >> 4) % EYES.length],
    accessory: ACCESSORIES[(hash >> 5) % ACCESSORIES.length],
  }
}

export function BichoSVG({ appearance, size = 80 }: { appearance: BichoAppearance; size?: number }) {
  const { color, shape, eyes, accessory, eyeColor } = appearance
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38

  // Body shape
  let bodyPath = ''
  if (shape === 'round') {
    bodyPath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
  } else if (shape === 'spiky') {
    const pts = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const rad = i % 2 === 0 ? r : r * 0.65
      pts.push(`${cx + Math.cos(angle) * rad},${cy + Math.sin(angle) * rad}`)
    }
    bodyPath = `M ${pts.join(' L ')} Z`
  } else if (shape === 'blobby') {
    bodyPath = `M ${cx} ${cy - r} C ${cx + r * 1.3} ${cy - r * 0.5}, ${cx + r * 1.1} ${cy + r * 0.8}, ${cx} ${cy + r} C ${cx - r * 1.1} ${cy + r * 0.8}, ${cx - r * 1.3} ${cy - r * 0.5}, ${cx} ${cy - r} Z`
  } else {
    const s = r * 0.9
    bodyPath = `M ${cx - s} ${cy - s} L ${cx + s} ${cy - s} L ${cx + s} ${cy + s} L ${cx - s} ${cy + s} Z`
  }

  // Eyes
  const eyeY = cy - r * 0.1
  const eyeSpacing = r * 0.35
  let leftEye = null
  let rightEye = null

  if (eyes === 'normal') {
    leftEye = `<circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${r * 0.12}" fill="${eyeColor}" />`
    rightEye = `<circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${r * 0.12}" fill="${eyeColor}" />`
  } else if (eyes === 'wide') {
    leftEye = `<circle cx="${cx - eyeSpacing}" cy="${eyeY}" r="${r * 0.18}" fill="${eyeColor}" /><circle cx="${cx - eyeSpacing + r * 0.04}" cy="${eyeY - r * 0.04}" r="${r * 0.06}" fill="white" />`
    rightEye = `<circle cx="${cx + eyeSpacing}" cy="${eyeY}" r="${r * 0.18}" fill="${eyeColor}" /><circle cx="${cx + eyeSpacing + r * 0.04}" cy="${eyeY - r * 0.04}" r="${r * 0.06}" fill="white" />`
  } else if (eyes === 'sleepy') {
    leftEye = `<path d="M ${cx - eyeSpacing - r * 0.12} ${eyeY} Q ${cx - eyeSpacing} ${eyeY - r * 0.12} ${cx - eyeSpacing + r * 0.12} ${eyeY}" stroke="${eyeColor}" stroke-width="3" fill="none" />`
    rightEye = `<path d="M ${cx + eyeSpacing - r * 0.12} ${eyeY} Q ${cx + eyeSpacing} ${eyeY - r * 0.12} ${cx + eyeSpacing + r * 0.12} ${eyeY}" stroke="${eyeColor}" stroke-width="3" fill="none" />`
  } else if (eyes === 'cross') {
    const s = r * 0.1
    leftEye = `<path d="M ${cx - eyeSpacing - s} ${eyeY - s} L ${cx - eyeSpacing + s} ${eyeY + s} M ${cx - eyeSpacing + s} ${eyeY - s} L ${cx - eyeSpacing - s} ${eyeY + s}" stroke="${eyeColor}" stroke-width="3" />`
    rightEye = `<path d="M ${cx + eyeSpacing - s} ${eyeY - s} L ${cx + eyeSpacing + s} ${eyeY + s} M ${cx + eyeSpacing + s} ${eyeY - s} L ${cx + eyeSpacing - s} ${eyeY + s}" stroke="${eyeColor}" stroke-width="3" />`
  }

  // Accessory
  let accessoryEl = ''
  if (accessory === 'antenna') {
    accessoryEl = `<line x1="${cx}" y1="${cy - r}" x2="${cx + r * 0.2}" y2="${cy - r * 1.4}" stroke="${eyeColor}" stroke-width="2" /><circle cx="${cx + r * 0.2}" cy="${cy - r * 1.4}" r="${r * 0.1}" fill="${eyeColor}" />`
  } else if (accessory === 'hat') {
    accessoryEl = `<rect x="${cx - r * 0.5}" y="${cy - r * 1.35}" width="${r}" height="${r * 0.5}" fill="${eyeColor}" rx="3" /><rect x="${cx - r * 0.65}" y="${cy - r * 0.95}" width="${r * 1.3}" height="${r * 0.15}" fill="${eyeColor}" rx="2" />`
  } else if (accessory === 'crown') {
    accessoryEl = `<path d="M ${cx - r * 0.5} ${cy - r * 0.95} L ${cx - r * 0.5} ${cy - r * 1.3} L ${cx - r * 0.2} ${cy - r * 1.1} L ${cx} ${cy - r * 1.35} L ${cx + r * 0.2} ${cy - r * 1.1} L ${cx + r * 0.5} ${cy - r * 1.3} L ${cx + r * 0.5} ${cy - r * 0.95} Z" fill="${eyeColor}" />`
  } else if (accessory === 'horns') {
    accessoryEl = `<path d="M ${cx - r * 0.35} ${cy - r * 0.9} L ${cx - r * 0.5} ${cy - r * 1.35} L ${cx - r * 0.1} ${cy - r * 0.9}" fill="${eyeColor}" /><path d="M ${cx + r * 0.1} ${cy - r * 0.9} L ${cx + r * 0.5} ${cy - r * 1.35} L ${cx + r * 0.35} ${cy - r * 0.9}" fill="${eyeColor}" />`
  }

  const mouth = `<path d="M ${cx - r * 0.2} ${cy + r * 0.35} Q ${cx} ${cy + r * 0.5} ${cx + r * 0.2} ${cy + r * 0.35}" stroke="${eyeColor}" stroke-width="2.5" fill="none" stroke-linecap="round" />`

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <path d="${bodyPath}" fill="${color}" />
    ${accessoryEl}
    ${leftEye}
    ${rightEye}
    ${mouth}
  </svg>`
}
