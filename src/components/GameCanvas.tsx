'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase, type Bicho } from '@/lib/supabase'
import { generateBicho } from '@/lib/bicho'
import { FLOORS, type Challenge, type Floor, ALL_CHALLENGE_IDS } from '@/lib/floors'
import { SOHO_UNLOCK_CHALLENGES } from '@/lib/questionPool'
import ChallengeDialog from './ChallengeDialog'
import EncounterDialog from './EncounterDialog'
import CompletionOverview from './CompletionOverview'
import MiniGameDialog, { type MiniGameType } from './MiniGameDialog'

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, w = 90, h = 55) {
  // Desktop surface
  ctx.fillStyle = '#8b6f47'
  drawRoundRect(ctx, x, y, w, h, 4)
  ctx.fill()
  ctx.strokeStyle = '#6b5437'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Monitor
  ctx.fillStyle = '#1a1a2e'
  drawRoundRect(ctx, x + w * 0.15, y + h * 0.1, w * 0.5, h * 0.55, 3)
  ctx.fill()
  ctx.fillStyle = '#1e3a5f'
  drawRoundRect(ctx, x + w * 0.17, y + h * 0.12, w * 0.46, h * 0.5, 2)
  ctx.fill()
  // Screen glow
  ctx.fillStyle = '#4488ff22'
  drawRoundRect(ctx, x + w * 0.17, y + h * 0.12, w * 0.46, h * 0.5, 2)
  ctx.fill()
  // Monitor stand
  ctx.fillStyle = '#333'
  ctx.fillRect(x + w * 0.35, y + h * 0.65, w * 0.12, h * 0.15)

  // Mouse
  ctx.fillStyle = '#555'
  ctx.beginPath()
  ctx.ellipse(x + w * 0.78, y + h * 0.45, 5, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  // Papers
  ctx.fillStyle = '#f5f5f0cc'
  ctx.fillRect(x + w * 0.68, y + h * 0.6, w * 0.22, h * 0.28)
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#3d3d5c'
  drawRoundRect(ctx, x - 14, y - 14, 28, 28, 5)
  ctx.fill()
  ctx.strokeStyle = '#5a5a7a'
  ctx.lineWidth = 1
  ctx.stroke()
  // Wheels hint
  ctx.fillStyle = '#222'
  ctx.beginPath()
  ctx.arc(x - 8, y + 16, 3, 0, Math.PI * 2)
  ctx.arc(x + 8, y + 16, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, large = false) {
  const s = large ? 1.8 : 1
  // Pot
  ctx.fillStyle = '#7c5c3a'
  ctx.beginPath()
  ctx.moveTo(x - 10 * s, y + 8 * s)
  ctx.lineTo(x + 10 * s, y + 8 * s)
  ctx.lineTo(x + 7 * s, y + 20 * s)
  ctx.lineTo(x - 7 * s, y + 20 * s)
  ctx.closePath()
  ctx.fill()
  // Leaves
  ctx.fillStyle = '#2d6a27'
  ctx.beginPath()
  ctx.arc(x, y - 5 * s, 14 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3d8a35'
  ctx.beginPath()
  ctx.arc(x - 6 * s, y - 8 * s, 10 * s, 0, Math.PI * 2)
  ctx.arc(x + 6 * s, y - 8 * s, 10 * s, 0, Math.PI * 2)
  ctx.fill()
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Frame
  ctx.fillStyle = '#555'
  ctx.fillRect(x, y, w, h)
  // Glass
  ctx.fillStyle = '#87ceeb55'
  ctx.fillRect(x + 4, y + 4, w / 2 - 6, h - 8)
  ctx.fillRect(x + w / 2 + 2, y + 4, w / 2 - 6, h - 8)
  // Reflection
  ctx.fillStyle = '#ffffff15'
  ctx.fillRect(x + 6, y + 6, 4, h - 12)
  ctx.fillRect(x + w / 2 + 4, y + 6, 4, h - 12)
  // Light from outside
  ctx.fillStyle = '#87ceeb08'
  ctx.fillRect(x, y + h, w, 60)
}

function drawCoffeeMachine(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#2a2a2a'
  drawRoundRect(ctx, x, y, 50, 60, 5)
  ctx.fill()
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1
  ctx.stroke()
  // Display
  ctx.fillStyle = '#ff6b3544'
  ctx.fillRect(x + 6, y + 8, 28, 16)
  ctx.fillStyle = '#ff6b35'
  ctx.font = 'bold 8px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('☕', x + 20, y + 21)
  // Buttons
  ctx.fillStyle = '#ff6b35'
  ctx.beginPath()
  ctx.arc(x + 38, y + 14, 5, 0, Math.PI * 2)
  ctx.fill()
  // Drip tray
  ctx.fillStyle = '#444'
  ctx.fillRect(x + 8, y + 46, 34, 8)
  // Cup
  ctx.fillStyle = '#fff'
  ctx.fillRect(x + 17, y + 40, 16, 14)
  ctx.fillStyle = '#7b4f2e'
  ctx.fillRect(x + 19, y + 43, 12, 8)
}

function drawFridge(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#d0d0d8'
  drawRoundRect(ctx, x, y, 60, 80, 4)
  ctx.fill()
  ctx.strokeStyle = '#aaa'
  ctx.lineWidth = 1
  ctx.stroke()
  // Divider
  ctx.strokeStyle = '#bbb'
  ctx.beginPath()
  ctx.moveTo(x + 2, y + 35)
  ctx.lineTo(x + 58, y + 35)
  ctx.stroke()
  // Handles
  ctx.fillStyle = '#888'
  ctx.fillRect(x + 48, y + 10, 6, 20)
  ctx.fillRect(x + 48, y + 42, 6, 20)
}

function drawBoardroomTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Shadow
  ctx.fillStyle = '#00000040'
  drawRoundRect(ctx, x + 6, y + 6, w, h, 12)
  ctx.fill()
  // Table surface
  ctx.fillStyle = '#4a2e0a'
  drawRoundRect(ctx, x, y, w, h, 12)
  ctx.fill()
  ctx.strokeStyle = '#6b4520'
  ctx.lineWidth = 2
  ctx.stroke()
  // Wood grain lines
  ctx.strokeStyle = '#5a3810'
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(x + 20, y + (i + 1) * (h / 6))
    ctx.lineTo(x + w - 20, y + (i + 1) * (h / 6))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  // Chairs around table
  const chairPositions = [
    // Top
    { cx: x + w * 0.2, cy: y - 22, r: 0 },
    { cx: x + w * 0.4, cy: y - 22, r: 0 },
    { cx: x + w * 0.6, cy: y - 22, r: 0 },
    { cx: x + w * 0.8, cy: y - 22, r: 0 },
    // Bottom
    { cx: x + w * 0.2, cy: y + h + 22, r: 0 },
    { cx: x + w * 0.4, cy: y + h + 22, r: 0 },
    { cx: x + w * 0.6, cy: y + h + 22, r: 0 },
    { cx: x + w * 0.8, cy: y + h + 22, r: 0 },
    // Left
    { cx: x - 22, cy: y + h * 0.35, r: 0 },
    { cx: x - 22, cy: y + h * 0.65, r: 0 },
    // Right
    { cx: x + w + 22, cy: y + h * 0.35, r: 0 },
    { cx: x + w + 22, cy: y + h * 0.65, r: 0 },
  ]
  for (const c of chairPositions) {
    ctx.fillStyle = '#1a1a2e'
    drawRoundRect(ctx, c.cx - 16, c.cy - 16, 32, 32, 6)
    ctx.fill()
    ctx.strokeStyle = '#2a2a4e'
    ctx.lineWidth = 1
    ctx.stroke()
  }
  // Name cards on table
  const cardPositions = [0.2, 0.4, 0.6, 0.8]
  for (const p of cardPositions) {
    ctx.fillStyle = '#f5f5f0cc'
    ctx.fillRect(x + w * p - 16, y + h / 2 - 8, 32, 16)
  }
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Frame
  ctx.fillStyle = '#888'
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8)
  // Board
  ctx.fillStyle = '#f8f8f2'
  ctx.fillRect(x, y, w, h)
  // Scribbles
  ctx.strokeStyle = '#3366cc'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + 10, y + 20)
  ctx.lineTo(x + w - 10, y + 20)
  ctx.stroke()
  ctx.strokeStyle = '#cc3333'
  ctx.beginPath()
  ctx.moveTo(x + 10, y + 40)
  ctx.lineTo(x + 60, y + 40)
  ctx.stroke()
  // Tray
  ctx.fillStyle = '#666'
  ctx.fillRect(x, y + h, w, 6)
}

function drawStairs(ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'up' | 'down', label: string, accentColor: string) {
  const steps = 6
  const sw = 80
  const sh = 80
  for (let i = 0; i < steps; i++) {
    const frac = i / steps
    ctx.fillStyle = `hsl(0,0%,${20 + frac * 25}%)`
    ctx.fillRect(x + frac * sw * 0.3, y + i * (sh / steps), sw - frac * sw * 0.3, sh / steps - 1)
  }
  ctx.strokeStyle = accentColor + '80'
  ctx.lineWidth = 2
  ctx.strokeRect(x - 2, y - 2, sw + 4, sh + 4)
  ctx.font = 'bold 10px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = accentColor
  ctx.fillText(label, x + sw / 2, y - 8)
  ctx.fillText(direction === 'up' ? '▲' : '▼', x + sw / 2, y + sh + 14)
}

function drawElevator(ctx: CanvasRenderingContext2D, x: number, y: number, accentColor: string) {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(x, y, 70, 100)
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, 70, 100)
  // Doors
  ctx.fillStyle = '#333'
  ctx.fillRect(x + 4, y + 4, 28, 88)
  ctx.fillRect(x + 38, y + 4, 28, 88)
  // Door gap
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 35, y + 4)
  ctx.lineTo(x + 35, y + 92)
  ctx.stroke()
  // Panel
  ctx.fillStyle = '#222'
  ctx.fillRect(x + 50, y + 30, 15, 40)
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.arc(x + 57, y + 45, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = 'bold 9px monospace'
  ctx.fillStyle = accentColor
  ctx.textAlign = 'center'
  ctx.fillText('🛗', x + 35, y - 10)
}

function drawGameRoom(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, gameType: string, accentColor: string, nearPlayer: boolean) {
  const glow = nearPlayer ? accentColor : '#444'
  const glowAlpha = nearPlayer ? '60' : '20'

  // Booth body
  ctx.fillStyle = '#1a1a2a'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = glow
  ctx.lineWidth = nearPlayer ? 2.5 : 1.5
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.stroke()

  // Glow aura when nearby
  if (nearPlayer) {
    ctx.strokeStyle = accentColor + '30'
    ctx.lineWidth = 8
    drawRoundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10)
    ctx.stroke()
  }

  // Glass door panel
  ctx.fillStyle = '#87ceeb' + glowAlpha
  drawRoundRect(ctx, x + 6, y + 20, w - 12, h - 28, 3)
  ctx.fill()
  ctx.strokeStyle = accentColor + '80'
  ctx.lineWidth = 1
  drawRoundRect(ctx, x + 6, y + 20, w - 12, h - 28, 3)
  ctx.stroke()

  // Top bar
  ctx.fillStyle = accentColor
  drawRoundRect(ctx, x, y, w, 16, 6)
  ctx.fill()

  // Icon inside
  ctx.font = '18px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(gameType === 'tenant_or_colleague' ? '🏠' : gameType === 'kiez_sorting' ? '🗺️' : '⚡', x + w / 2, y + h / 2 + 8)

  // Label below
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = nearPlayer ? accentColor : '#555'
  ctx.textAlign = 'center'
  const label = gameType === 'tenant_or_colleague' ? 'MIETER?' : gameType === 'kiez_sorting' ? 'KIEZ?' : 'SPEED'
  ctx.fillText(label, x + w / 2, y + h + 12)

  if (nearPlayer) {
    ctx.font = '9px monospace'
    ctx.fillStyle = accentColor
    ctx.fillText('[E] Enter', x + w / 2, y + h + 24)
  }
}

function drawKitchenCounter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#e8dcc8'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = '#c8b898'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, w, h)
  // Sink
  if (w > 80) {
    ctx.fillStyle = '#aaa'
    ctx.fillRect(x + w - 70, y + 8, 55, h - 16)
    ctx.fillStyle = '#888'
    ctx.fillRect(x + w - 65, y + 12, 45, h - 24)
    // Faucet
    ctx.fillStyle = '#bbb'
    ctx.fillRect(x + w - 46, y + 4, 6, 12)
  }
}

function drawLunchTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Shadow
  ctx.fillStyle = '#00000030'
  drawRoundRect(ctx, x + 4, y + 4, w, h, 6)
  ctx.fill()
  // Table
  ctx.fillStyle = '#d4a96a'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = '#b8904a'
  ctx.lineWidth = 1.5
  ctx.stroke()
  // Plates
  const plateX = [x + 30, x + w / 2, x + w - 50]
  for (const px of plateX) {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(px, y + h / 2, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 1
    ctx.stroke()
  }
  // Chairs
  for (const px of plateX) {
    ctx.fillStyle = '#7a6a4a'
    drawRoundRect(ctx, px - 14, y - 22, 28, 18, 4)
    ctx.fill()
    drawRoundRect(ctx, px - 14, y + h + 4, 28, 18, 4)
    ctx.fill()
  }
}

function drawReceptionDesk(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Main desk (L-shape feel)
  ctx.fillStyle = '#f0ebe0'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = '#d0c8b0'
  ctx.lineWidth = 2
  ctx.stroke()
  // Front panel
  ctx.fillStyle = '#e0d8c0'
  ctx.fillRect(x, y + h - 20, w, 20)
  // Monitor
  ctx.fillStyle = '#1a1a2e'
  drawRoundRect(ctx, x + w / 2 - 25, y + 10, 50, 35, 3)
  ctx.fill()
  ctx.fillStyle = '#1e3a5f'
  drawRoundRect(ctx, x + w / 2 - 23, y + 12, 46, 31, 2)
  ctx.fill()
  // Name plate
  ctx.fillStyle = '#c8a84a'
  ctx.fillRect(x + 10, y + h - 38, 80, 14)
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'center'
  ctx.fillText('BUENA', x + 50, y + h - 28)
  // Plant on desk
  drawPlant(ctx, x + w - 25, y + 5)
}

function drawCouch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Back
  ctx.fillStyle = '#4a4a6a'
  drawRoundRect(ctx, x, y, w, h * 0.4, 5)
  ctx.fill()
  // Seat
  ctx.fillStyle = '#5a5a7a'
  drawRoundRect(ctx, x, y + h * 0.35, w, h * 0.65, 5)
  ctx.fill()
  // Cushions
  ctx.fillStyle = '#6a6a8a'
  drawRoundRect(ctx, x + 8, y + h * 0.38, w / 2 - 12, h * 0.55, 4)
  ctx.fill()
  drawRoundRect(ctx, x + w / 2 + 4, y + h * 0.38, w / 2 - 12, h * 0.55, 4)
  ctx.fill()
  // Armrests
  ctx.fillStyle = '#3a3a5a'
  ctx.fillRect(x, y + h * 0.35, 12, h * 0.65)
  ctx.fillRect(x + w - 12, y + h * 0.35, 12, h * 0.65)
}

// ─── Bicho rendering ──────────────────────────────────────────────────────────

function drawBicho(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string, shape: string,
  size: number, name: string,
  isPlayer: boolean, score: number,
  bobOffset = 0
) {
  ctx.save()
  const py = y + bobOffset
  ctx.shadowColor = color
  ctx.shadowBlur = isPlayer ? 14 : 6

  ctx.beginPath()
  if (shape === 'spiky') {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const r = i % 2 === 0 ? size : size * 0.65
      const px = x + Math.cos(angle) * r
      const bpy = py + Math.sin(angle) * r
      i === 0 ? ctx.moveTo(px, bpy) : ctx.lineTo(px, bpy)
    }
    ctx.closePath()
  } else if (shape === 'square') {
    ctx.rect(x - size * 0.85, py - size * 0.85, size * 1.7, size * 1.7)
  } else {
    ctx.arc(x, py, size, 0, Math.PI * 2)
  }
  ctx.fillStyle = color
  ctx.fill()
  ctx.shadowBlur = 0

  // Eyes
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(x - size * 0.32, py - size * 0.1, size * 0.13, 0, Math.PI * 2)
  ctx.arc(x + size * 0.32, py - size * 0.1, size * 0.13, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(x - size * 0.28, py - size * 0.14, size * 0.055, 0, Math.PI * 2)
  ctx.arc(x + size * 0.36, py - size * 0.14, size * 0.055, 0, Math.PI * 2)
  ctx.fill()

  // Mouth
  ctx.beginPath()
  ctx.strokeStyle = '#00000088'
  ctx.lineWidth = 1.5
  ctx.arc(x, py + size * 0.28, size * 0.22, 0, Math.PI)
  ctx.stroke()

  // Player ring
  if (isPlayer) {
    ctx.beginPath()
    ctx.arc(x, py, size + 6, 0, Math.PI * 2)
    ctx.strokeStyle = color + 'aa'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Shadow on floor
  ctx.fillStyle = '#00000030'
  ctx.beginPath()
  ctx.ellipse(x, y + size + 2, size * 0.8, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Name
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 6
  ctx.font = `bold ${isPlayer ? 11 : 10}px monospace`
  ctx.textAlign = 'center'
  ctx.fillStyle = isPlayer ? '#fff' : '#ccc'
  ctx.fillText(name.split(' ')[0], x, py + size + 18)
  if (score > 0) {
    ctx.font = '9px monospace'
    ctx.fillStyle = '#f472b6'
    ctx.fillText(`⚡${score}`, x, py + size + 30)
  }
  ctx.restore()
}

// ─── Floor drawing ────────────────────────────────────────────────────────────

function drawFloor(ctx: CanvasRenderingContext2D, floor: Floor, W: number, H: number, completedChallenges: Set<string>, sohoUnlocked = false, px = 0, py = 0) {
  const f = floor

  // Background fill
  ctx.fillStyle = f.bgColor
  ctx.fillRect(0, 0, W, H)

  // Floor tile pattern
  ctx.fillStyle = f.floorColor
  ctx.fillRect(60, 60, W - 120, H - 120)

  // Subtle tile grid
  ctx.strokeStyle = '#00000015'
  ctx.lineWidth = 0.5
  for (let tx = 60; tx < W - 60; tx += 40) {
    ctx.beginPath(); ctx.moveTo(tx, 60); ctx.lineTo(tx, H - 60); ctx.stroke()
  }
  for (let ty = 60; ty < H - 60; ty += 40) {
    ctx.beginPath(); ctx.moveTo(60, ty); ctx.lineTo(W - 120, ty); ctx.stroke()
  }

  // Outer walls
  ctx.fillStyle = '#2d2d2d'
  ctx.fillRect(0, 0, 60, H)          // left wall
  ctx.fillRect(W - 60, 0, 60, H)     // right wall
  ctx.fillRect(0, 0, W, 60)          // top wall
  ctx.fillRect(0, H - 60, W, 60)     // bottom wall

  // Wall texture
  ctx.strokeStyle = '#ffffff08'
  ctx.lineWidth = 1
  for (let i = 0; i < H; i += 30) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(60, i); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W - 60, i); ctx.lineTo(W, i); ctx.stroke()
  }

  // ── B: Kitchen ───────────────────────────────────────────────────────────
  if (f.id === 0) {
    // Ceiling lights
    for (let lx = 200; lx < W - 100; lx += 200) {
      ctx.fillStyle = '#ffffffcc'
      ctx.fillRect(lx, 62, 60, 6)
      ctx.fillStyle = '#ffffffee'
      ctx.fillRect(lx + 5, 62, 50, 4)
      // Light cone
      ctx.fillStyle = '#ffffff08'
      ctx.beginPath()
      ctx.moveTo(lx, 68); ctx.lineTo(lx + 60, 68)
      ctx.lineTo(lx + 100, H - 60); ctx.lineTo(lx - 40, H - 60)
      ctx.closePath(); ctx.fill()
    }
    // Top counter (along top wall)
    drawKitchenCounter(ctx, 80, 65, 420, 70)
    // Coffee machine on counter
    drawCoffeeMachine(ctx, 120, 70)
    // Fridge
    drawFridge(ctx, 230, 65)
    // Microwave area
    ctx.fillStyle = '#888'
    drawRoundRect(ctx, 340, 72, 60, 45, 3); ctx.fill()
    ctx.fillStyle = '#aaa'
    drawRoundRect(ctx, 343, 75, 54, 38, 2); ctx.fill()
    // Right side counter
    drawKitchenCounter(ctx, 80, H - 140, W - 200, 70)
    // Lunch tables
    drawLunchTable(ctx, 460, 230, 180, 90)
    drawLunchTable(ctx, 710, 230, 180, 90)
    // Floor mat
    ctx.fillStyle = '#4a7a4a'
    ctx.fillRect(80, H - 145, 60, 6)
  }

  // ── GF: Reception ───────────────────────────────────────────────────────
  if (f.id === 1) {
    // Windows along top
    drawWindow(ctx, 200, 62, 100, 55)
    drawWindow(ctx, 370, 62, 100, 55)
    drawWindow(ctx, 600, 62, 100, 55)

    // Reception desk
    drawReceptionDesk(ctx, 300, 160, 220, 80)

    // Waiting area
    drawCouch(ctx, 720, 240, 170, 80)
    drawPlant(ctx, 680, 195, true)
    drawPlant(ctx, 900, 360)

    // Company logo on wall
    ctx.font = 'bold 28px monospace'
    ctx.fillStyle = '#ffffff15'
    ctx.textAlign = 'center'
    ctx.fillText('BUENA', W / 2, 110)

    // Floor mat at entrance
    ctx.fillStyle = '#4a4a8a'
    ctx.fillRect(W / 2 - 60, H - 68, 120, 10)

    // Ceiling lights
    for (let lx = 180; lx < W - 100; lx += 220) {
      ctx.fillStyle = '#ffffffcc'
      ctx.fillRect(lx, 62, 50, 5)
    }
  }

  // ── 1F: Cubicles ─────────────────────────────────────────────────────────
  if (f.id === 2) {
    // Carpet
    ctx.fillStyle = f.carpetColor
    ctx.fillRect(60, 60, W - 120, H - 120)

    // Cubicle dividers
    const divColor = '#7a8a9a'
    ctx.fillStyle = divColor
    // Horizontal dividers
    ctx.fillRect(80, 240, W - 200, 8)
    ctx.fillRect(80, 370, W - 200, 8)
    // Vertical dividers in rows
    for (let vx = 80; vx < 600; vx += 130) {
      ctx.fillRect(vx, 80, 8, 165)
      ctx.fillRect(vx, 245, 8, 128)
    }

    // Desks in cubicles
    const deskPositions = [
      { x: 100, y: 100 }, { x: 230, y: 100 }, { x: 360, y: 100 }, { x: 490, y: 100 },
      { x: 650, y: 100 }, { x: 780, y: 100 },
      { x: 100, y: 265 }, { x: 230, y: 265 }, { x: 360, y: 265 }, { x: 490, y: 265 },
      { x: 650, y: 265 }, { x: 780, y: 265 },
    ]
    for (const d of deskPositions) {
      drawDesk(ctx, d.x, d.y)
      drawChair(ctx, d.x + 30, d.y + 75)
    }

    // Printer station
    ctx.fillStyle = '#888'
    drawRoundRect(ctx, 870, 160, 60, 70, 4); ctx.fill()
    ctx.fillStyle = '#555'
    drawRoundRect(ctx, 873, 163, 54, 64, 3); ctx.fill()
    ctx.fillStyle = '#4ade80'
    ctx.beginPath(); ctx.arc(906, 185, 4, 0, Math.PI * 2); ctx.fill()
    ctx.font = '9px monospace'
    ctx.fillStyle = '#aaa'
    ctx.textAlign = 'center'
    ctx.fillText('Printer', 900, 248)

    // Windows
    drawWindow(ctx, 200, 62, 90, 50)
    drawWindow(ctx, 500, 62, 90, 50)

    // Plant
    drawPlant(ctx, 850, 350, true)
    drawPlant(ctx, 140, 410)
  }

  // ── 2F: Boardroom ────────────────────────────────────────────────────────
  if (f.id === 3) {
    // Dark wood floor
    ctx.fillStyle = '#2a1a08'
    ctx.fillRect(60, 60, W - 120, H - 120)
    // Wood planks
    ctx.strokeStyle = '#3a2510'
    ctx.lineWidth = 1
    for (let wy = 80; wy < H - 60; wy += 20) {
      ctx.beginPath(); ctx.moveTo(60, wy); ctx.lineTo(W - 60, wy); ctx.stroke()
    }

    // Whiteboard
    drawWhiteboard(ctx, 100, 80, 160, 90)

    // Panorama windows
    drawWindow(ctx, 350, 65, 80, 55)
    drawWindow(ctx, 460, 65, 80, 55)
    drawWindow(ctx, 570, 65, 80, 55)
    // City lights effect
    ctx.fillStyle = '#87ceeb05'
    ctx.fillRect(340, 120, 330, 80)

    // Big boardroom table
    drawBoardroomTable(ctx, 200, 200, 450, 180)

    // Soho House door (right side)
    // sohoUnlocked passed as param
    ctx.fillStyle = sohoUnlocked ? '#c8a84a' : '#2a1a1a'
    drawRoundRect(ctx, W - 200, 80, 130, H - 140, 8)
    ctx.fill()
    ctx.strokeStyle = sohoUnlocked ? '#c8a84a' : '#444'
    ctx.lineWidth = 2
    ctx.stroke()
    // Door label
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#f472b6'
    ctx.fillText('SOHO', W - 135, H / 2 - 10)
    ctx.fillText('HOUSE', W - 135, H / 2 + 8)
    ctx.font = '10px monospace'
    ctx.fillStyle = '#666'
    ctx.fillText(sohoUnlocked ? '🚪 Enter' : 'Finish office', W - 135, H / 2 + 28)

    // Plants
    drawPlant(ctx, 170, 200, true)
    drawPlant(ctx, 700, 200, true)
  }

  // ── Soho House ───────────────────────────────────────────────────────────
  if (f.id === 4) {
    // Dark moody floor
    ctx.fillStyle = '#1a0a1a'
    ctx.fillRect(60, 60, W - 120, H - 120)

    // Ambient glow circles
    const gradient1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 200)
    gradient1.addColorStop(0, '#f472b620')
    gradient1.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient1
    ctx.fillRect(0, 0, W, H)

    const gradient2 = ctx.createRadialGradient(W - 200, H - 150, 0, W - 200, H - 150, 250)
    gradient2.addColorStop(0, '#c084fc15')
    gradient2.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient2
    ctx.fillRect(0, 0, W, H)

    // Bar counter
    ctx.fillStyle = '#3a1a2a'
    drawRoundRect(ctx, 100, 80, 320, 75, 6); ctx.fill()
    ctx.fillStyle = '#5a2a3a'
    drawRoundRect(ctx, 104, 84, 312, 50, 4); ctx.fill()
    // Bar stools
    for (let bx = 130; bx < 400; bx += 55) {
      ctx.fillStyle = '#8b3a5a'
      ctx.beginPath(); ctx.arc(bx, 175, 14, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#5a2040'
      ctx.beginPath(); ctx.arc(bx, 175, 14, 0, Math.PI); ctx.fill()
      ctx.fillStyle = '#3a1a2a'
      ctx.fillRect(bx - 3, 175, 6, 30)
    }
    // Bottles on bar
    const bottleColors = ['#f472b6', '#c084fc', '#60a5fa', '#4ade80', '#fb923c']
    for (let bi = 0; bi < 8; bi++) {
      const bx = 115 + bi * 38
      ctx.fillStyle = bottleColors[bi % bottleColors.length] + '88'
      ctx.fillRect(bx, 85, 12, 40)
      ctx.fillStyle = bottleColors[bi % bottleColors.length]
      ctx.fillRect(bx + 3, 82, 6, 8)
    }

    // Dancefloor
    ctx.fillStyle = '#0f0f0f'
    drawRoundRect(ctx, 260, 260, 340, 200, 4); ctx.fill()
    const tileSize = 34
    const colors = ['#f472b6', '#c084fc', '#fb923c', '#60a5fa', '#4ade80', '#fde68a']
    for (let tx = 0; tx < 10; tx++) {
      for (let ty = 0; ty < 6; ty++) {
        const c = colors[(tx + ty) % colors.length]
        ctx.fillStyle = c + '30'
        ctx.fillRect(262 + tx * tileSize, 262 + ty * tileSize, tileSize - 2, tileSize - 2)
      }
    }
    // Dancefloor glow
    ctx.strokeStyle = '#f472b640'
    ctx.lineWidth = 2
    drawRoundRect(ctx, 258, 258, 344, 204, 5); ctx.stroke()

    // Booths (right side)
    ctx.fillStyle = '#2a1020'
    drawRoundRect(ctx, W - 240, 100, 170, 130, 8); ctx.fill()
    ctx.fillStyle = '#3a1830'
    drawRoundRect(ctx, W - 236, 104, 162, 90, 6); ctx.fill()
    // Booth table
    ctx.fillStyle = '#4a2040'
    drawRoundRect(ctx, W - 190, 130, 80, 45, 3); ctx.fill()

    // Ambient lights on ceiling (disco-ish)
    const spotColors = ['#f472b6', '#c084fc', '#fb923c', '#60a5fa']
    for (let si = 0; si < 4; si++) {
      const sx = 200 + si * 160
      ctx.fillStyle = '#333'
      ctx.beginPath(); ctx.arc(sx, 68, 8, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = spotColors[si] + '40'
      ctx.beginPath(); ctx.arc(sx, 68, 6, 0, Math.PI * 2); ctx.fill()
    }

    // Floor label
    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = '#f472b660'
    ctx.textAlign = 'center'
    ctx.fillText('🍸 SOHO HOUSE', W / 2, 50)
  }

  // ── Interactive objects highlight ─────────────────────────────────────────
  for (const obj of f.objects) {
    if (obj.type === 'stairs_up' || obj.type === 'stairs_down') continue
    if (obj.type === 'elevator') continue

    const ch = f.challenges.find(c => c.targetObject === obj.id)
    if (!ch) continue
    const done = completedChallenges.has(ch.id)
    if (done) {
      ctx.strokeStyle = '#4ade8060'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      drawRoundRect(ctx, obj.x - 4, obj.y - 4, obj.w + 8, obj.h + 8, 6)
      ctx.stroke()
      ctx.setLineDash([])
      // Checkmark
      ctx.font = '14px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#4ade80'
      ctx.fillText('✓', obj.x + obj.w / 2, obj.y - 12)
    }
  }

  // ── Stairs, Elevator & Game Rooms ────────────────────────────────────────
  for (const obj of f.objects) {
    if (obj.type === 'stairs_up') {
      drawStairs(ctx, obj.x, obj.y, 'up', obj.label, f.accentColor)
    } else if (obj.type === 'stairs_down') {
      drawStairs(ctx, obj.x, obj.y, 'down', obj.label, f.accentColor)
    } else if (obj.type === 'elevator') {
      drawElevator(ctx, obj.x, obj.y, f.accentColor)
    } else if (obj.type === 'game_room' && obj.gameType) {
      const dx = px - (obj.x + obj.w / 2)
      const dy = py - (obj.y + obj.h / 2)
      const near = Math.sqrt(dx * dx + dy * dy) < 80
      drawGameRoom(ctx, obj.x, obj.y, obj.w, obj.h, obj.gameType, f.accentColor, near)
    }
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

type OtherBicho = {
  id: string; name: string; x: number; y: number
  color: string; shape: string; bicho_score: number
  targetX: number; targetY: number; lastMove: number
}

export default function GameCanvas({ myBicho }: { myBicho: Bicho }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    px: FLOORS[0].spawnX,
    py: FLOORS[0].spawnY,
    speed: 200,
    keys: new Set<string>(),
    others: [] as OtherBicho[],
    bobOffset: 0,
    floorIndex: 0,
    transitioning: false,
    transitionAlpha: 0,
    interactPrompt: null as string | null,
    nearObject: null as string | null,
    completedChallenges: new Set<string>(),
  })
  const [floorIndex, setFloorIndex] = useState(0)
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set())
  // Keep stateRef in sync so the keydown handler (captured in closure) can read the latest value
  stateRef.current.completedChallenges = completedChallenges
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)
  const [activeEncounter, setActiveEncounter] = useState<Bicho | null>(null)
  const [activeMiniGame, setActiveMiniGame] = useState<{ type: MiniGameType; withBicho: Bicho | null } | null>(null)
  const [encounterCooldowns] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(myBicho.bicho_score)
  const [interactHint, setInteractHint] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const sohoUnlocked = SOHO_UNLOCK_CHALLENGES.every(id => completedChallenges.has(id))
  const animRef = useRef<number>(0)
  const myAppearance = generateBicho(myBicho.name)

  // Load completed challenges from Supabase
  useEffect(() => {
    supabase.from('answers').select('question_key').eq('bicho_id', myBicho.id)
      .then(({ data }) => {
        if (data) setCompletedChallenges(new Set(data.map((a: { question_key: string }) => a.question_key)))
      })
    supabase.from('bichos').select('*').neq('id', myBicho.id).then(({ data }) => {
      if (!data) return
      stateRef.current.others = data.map((b, i) => ({
        id: b.id, name: b.name,
        x: 200 + (i % 5) * 120, y: 300 + Math.floor(i / 5) * 80,
        color: b.bicho_color, shape: b.bicho_shape,
        bicho_score: b.bicho_score,
        targetX: 200 + (i % 5) * 120, targetY: 300 + Math.floor(i / 5) * 80,
        lastMove: 0,
      }))
    })
  }, [myBicho.id])

  const changeFloor = useCallback((newFloorIndex: number) => {
    const s = stateRef.current
    if (s.transitioning) return
    s.transitioning = true
    s.transitionAlpha = 0
    const newFloor = FLOORS[newFloorIndex]
    const fadeIn = () => {
      s.transitionAlpha = Math.min(s.transitionAlpha + 0.08, 1)
      if (s.transitionAlpha < 1) { requestAnimationFrame(fadeIn); return }
      s.floorIndex = newFloorIndex
      s.px = newFloor.spawnX
      s.py = newFloor.spawnY
      setFloorIndex(newFloorIndex)
      const fadeOut = () => {
        s.transitionAlpha = Math.max(s.transitionAlpha - 0.08, 0)
        if (s.transitionAlpha > 0) { requestAnimationFrame(fadeOut); return }
        s.transitioning = false
      }
      requestAnimationFrame(fadeOut)
    }
    requestAnimationFrame(fadeIn)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const onKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys.add(e.key)
      if (e.key === 'e' || e.key === 'E') {
        const s = stateRef.current
        const floor = FLOORS[s.floorIndex]
        // Check interaction
        for (const obj of floor.objects) {
          const dx = s.px - (obj.x + obj.w / 2)
          const dy = s.py - (obj.y + obj.h / 2)
          if (Math.sqrt(dx * dx + dy * dy) < 70) {
            if (obj.type === 'stairs_up' || obj.type === 'stairs_down' || obj.type === 'elevator') {
              if (obj.targetFloor !== undefined) {
                const toSoho = obj.targetFloor === 4
                const unlocked = SOHO_UNLOCK_CHALLENGES.every(id => stateRef.current.completedChallenges.has(id))
                if (!toSoho || unlocked) changeFloor(obj.targetFloor)
              }
            } else if (obj.type === 'game_room' && obj.gameType) {
              setActiveMiniGame({ type: obj.gameType as MiniGameType, withBicho: null })
            } else {
              const ch = floor.challenges.find(c => c.targetObject === obj.id)
              if (ch) setActiveChallenge(ch)
            }
          }
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => stateRef.current.keys.delete(e.key)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    let last = 0
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const s = stateRef.current
      const floor = FLOORS[s.floorIndex]
      const W = canvas.width
      const H = canvas.height

      s.bobOffset = Math.sin(now / 380) * 3.5

      if (!activeChallenge && !activeEncounter && !activeMiniGame && !s.transitioning) {
        const spd = s.speed * dt
        if (s.keys.has('ArrowLeft') || s.keys.has('a')) s.px -= spd
        if (s.keys.has('ArrowRight') || s.keys.has('d')) s.px += spd
        if (s.keys.has('ArrowUp') || s.keys.has('w')) s.py -= spd
        if (s.keys.has('ArrowDown') || s.keys.has('s')) s.py += spd
        s.px = Math.max(80, Math.min(W - 80, s.px))
        s.py = Math.max(80, Math.min(H - 80, s.py))
      }

      // NPC wander
      for (const npc of s.others) {
        const dx = npc.targetX - npc.x
        const dy = npc.targetY - npc.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > 2) { npc.x += (dx / d) * 50 * dt; npc.y += (dy / d) * 50 * dt }
        else if (now - npc.lastMove > 4000 + Math.random() * 5000) {
          npc.targetX = 120 + Math.random() * (W - 240)
          npc.targetY = 120 + Math.random() * (H - 240)
          npc.lastMove = now
        }
      }

      // NPC proximity — encounter trigger
      if (!activeChallenge && !activeEncounter && !activeMiniGame) {
        for (const npc of s.others) {
          const dx = s.px - npc.x
          const dy = s.py - npc.y
          if (Math.sqrt(dx * dx + dy * dy) < 60 && !encounterCooldowns.has(npc.id)) {
            encounterCooldowns.add(npc.id)
            setTimeout(() => encounterCooldowns.delete(npc.id), 90000)
            const bichoData: Bicho = {
              id: npc.id, name: npc.name, email: '',
              bicho_color: npc.color, bicho_shape: npc.shape, bicho_eyes: 'normal',
              current_level: 0, bicho_score: npc.bicho_score, created_at: '',
            }
            setActiveEncounter(bichoData)
            break
          }
        }
      }

      // Find nearby object for interact hint
      let hint = null
      let nearObj = null
      for (const obj of floor.objects) {
        const dx = s.px - (obj.x + obj.w / 2)
        const dy = s.py - (obj.y + obj.h / 2)
        if (Math.sqrt(dx * dx + dy * dy) < 70) {
          if (obj.type === 'stairs_up' || obj.type === 'stairs_down' || obj.type === 'elevator') {
            hint = `[E] ${obj.label}`
          } else {
            const ch = floor.challenges.find(c => c.targetObject === obj.id)
            if (ch) {
              const done = completedChallenges.has(ch.id)
              hint = done ? `[E] ${obj.label} (repeat)` : `[E] ${obj.label}`
            }
          }
          nearObj = obj.id
          break
        }
      }
      if (hint !== s.interactPrompt) {
        s.interactPrompt = hint
        s.nearObject = nearObj
        setInteractHint(hint)
      }

      // Draw
      ctx.clearRect(0, 0, W, H)
      drawFloor(ctx, floor, W, H, completedChallenges, sohoUnlocked, s.px, s.py)

      // NPCs
      for (const npc of s.others) {
        const bob = Math.sin(now / 400 + npc.id.charCodeAt(0)) * 2
        drawBicho(ctx, npc.x, npc.y, npc.color, npc.shape, 11, npc.name, false, npc.bicho_score, bob)
      }

      // Player
      drawBicho(ctx, s.px, s.py, myAppearance.color, myAppearance.shape, 14, myBicho.name, true, score, s.bobOffset)

      // Transition overlay
      if (s.transitionAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${s.transitionAlpha})`
        ctx.fillRect(0, 0, W, H)
      }

      // Floor label (fades in)
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#ffffff20'
      ctx.fillText(floor.name, 80, H - 72)

      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [myBicho, myAppearance, activeChallenge, activeEncounter, activeMiniGame, encounterCooldowns, completedChallenges, score, changeFloor])

  async function handleChallengeComplete(answer: string, matchScore: number) {
    if (!activeChallenge) return
    await supabase.from('answers').insert({
      bicho_id: myBicho.id,
      level: floorIndex,
      question_key: activeChallenge.id,
      answer_text: answer || '(approached)',
    })
    const total = score + activeChallenge.score + matchScore
    await supabase.from('bichos').update({
      bicho_score: total,
      current_level: Math.max(myBicho.current_level, floorIndex + 1),
    }).eq('id', myBicho.id)
    myBicho.bicho_score = total
    setScore(total)
    setCompletedChallenges(prev => {
      const next = new Set([...prev, activeChallenge!.id])
      if (ALL_CHALLENGE_IDS.every(id => next.has(id))) {
        setTimeout(() => setShowCompletion(true), 800)
      }
      return next
    })
    setActiveChallenge(null)
  }

  const floor = FLOORS[floorIndex]
  const floorChallenges = floor.challenges
  const doneCount = floorChallenges.filter(c => completedChallenges.has(c.id)).length

  const handleMobileMove = (key: string, down: boolean) => {
    if (down) stateRef.current.keys.add(key)
    else stateRef.current.keys.delete(key)
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="block" />

      {/* Floor indicator */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 font-mono pointer-events-none">
        <div className="flex gap-1">
          {FLOORS.map((f, i) => (
            <div
              key={f.id}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: i === floorIndex ? f.accentColor + '30' : '#111',
                color: i === floorIndex ? f.accentColor : '#444',
                border: `1px solid ${i === floorIndex ? f.accentColor + '60' : '#222'}`,
              }}
            >
              {f.shortName}
            </div>
          ))}
        </div>
      </div>

      {/* Player HUD */}
      <div className="fixed top-4 left-4 font-mono flex flex-col gap-2">
        <div className="bg-black/70 border border-gray-800 rounded-xl px-4 py-2 text-xs pointer-events-none">
          <span className="font-bold" style={{ color: floor.accentColor }}>{myBicho.name}</span>
          <span className="text-gray-700 mx-2">·</span>
          <span className="text-[#f472b6]">⚡ {score}</span>
        </div>
        {ALL_CHALLENGE_IDS.every(id => completedChallenges.has(id)) && (
          <button
            onClick={() => setShowCompletion(true)}
            className="bg-[#f472b620] border border-[#f472b640] rounded-xl px-4 py-2 text-xs text-[#f472b6] font-bold hover:bg-[#f472b630] transition-colors text-left"
          >
            🏆 View your profile
          </button>
        )}
      </div>

      {/* Todo list */}
      <div className="fixed top-4 right-4 font-mono pointer-events-none max-w-[220px]">
        <div className="bg-black/75 border border-gray-800 rounded-xl p-3">
          <p className="text-xs font-bold mb-2" style={{ color: floor.accentColor }}>
            {floor.name} — {doneCount}/{floorChallenges.length}
          </p>
          <div className="space-y-1.5">
            {floorChallenges.map(ch => {
              const done = completedChallenges.has(ch.id)
              return (
                <div key={ch.id} className="flex items-center gap-2 text-xs">
                  <span className={done ? 'text-[#4ade80]' : 'text-gray-700'}>
                    {done ? '✓' : '○'}
                  </span>
                  <span className={done ? 'text-gray-600 line-through' : 'text-gray-300'}>
                    {ch.text}
                  </span>
                </div>
              )
            })}
          </div>
          {doneCount === floorChallenges.length && (
            <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-center" style={{ color: floor.accentColor }}>
              Floor complete! ↑
            </div>
          )}
        </div>
      </div>

      {/* Interact hint */}
      {interactHint && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 font-mono pointer-events-none">
          <div
            className="px-4 py-2 rounded-xl text-sm font-bold border animate-bounce"
            style={{
              backgroundColor: floor.accentColor + '20',
              color: floor.accentColor,
              borderColor: floor.accentColor + '60',
            }}
          >
            {interactHint}
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="fixed bottom-4 left-4 font-mono pointer-events-none">
        <p className="text-gray-800 text-xs">WASD · Arrow Keys · E = Interact</p>
      </div>

      {/* Mobile controls */}
      <div className="fixed bottom-8 right-6 grid grid-cols-3 gap-2 sm:hidden">
        {[
          { key: 'ArrowUp', label: '▲', col: 2, row: 1 },
          { key: 'ArrowLeft', label: '◀', col: 1, row: 2 },
          { key: 'ArrowDown', label: '▼', col: 2, row: 2 },
          { key: 'ArrowRight', label: '▶', col: 3, row: 2 },
        ].map(btn => (
          <button
            key={btn.key}
            onPointerDown={() => handleMobileMove(btn.key, true)}
            onPointerUp={() => handleMobileMove(btn.key, false)}
            onPointerLeave={() => handleMobileMove(btn.key, false)}
            className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl text-white font-bold active:bg-white/25 select-none"
            style={{ gridColumn: btn.col, gridRow: btn.row }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Challenge dialog */}
      {activeChallenge && (
        <ChallengeDialog
          challenge={activeChallenge}
          floorName={floor.name}
          myBichoId={myBicho.id}
          onComplete={handleChallengeComplete}
          onClose={() => setActiveChallenge(null)}
        />
      )}

      {/* Completion overview */}
      {showCompletion && (
        <CompletionOverview
          myBicho={myBicho}
          onClose={() => setShowCompletion(false)}
        />
      )}

      {/* Encounter dialog */}
      {activeEncounter && !activeChallenge && (
        <EncounterDialog
          withBicho={activeEncounter}
          zone={(['kitchen', 'kitchen', 'office', 'boardroom', 'soho'] as const)[floorIndex]}
          myBichoId={myBicho.id}
          onComplete={(gained) => {
            const newW = score + gained
            setScore(newW)
            myBicho.bicho_score = newW
            supabase.from('bichos').update({ bicho_score: newW }).eq('id', myBicho.id)
            setActiveEncounter(null)
          }}
          onSkip={() => setActiveEncounter(null)}
        />
      )}

      {/* Mini-game dialog */}
      {activeMiniGame && !activeChallenge && (
        <MiniGameDialog
          gameType={activeMiniGame.type}
          currentBicho={myBicho}
          encounteredBicho={activeMiniGame.withBicho}
          onComplete={(points) => {
            const newW = score + points
            setScore(newW)
            myBicho.bicho_score = newW
            supabase.from('bichos').update({ bicho_score: newW }).eq('id', myBicho.id)
            setActiveMiniGame(null)
          }}
          onClose={() => setActiveMiniGame(null)}
        />
      )}
    </div>
  )
}
