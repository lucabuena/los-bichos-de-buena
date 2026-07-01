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
import AmongUsOverlay from './AmongUsOverlay'
import AmongUsHUD from './AmongUsHUD'
import { useAmongUs } from '@/hooks/useAmongUs'

// ─── Avatar image cache ───────────────────────────────────────────────────────

const avatarImageCache = new Map<string, HTMLImageElement | null>()

function loadAvatarImage(url: string): HTMLImageElement | null {
  if (avatarImageCache.has(url)) return avatarImageCache.get(url) ?? null
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => avatarImageCache.set(url, img)
  img.onerror = () => avatarImageCache.set(url, null)
  img.src = url
  return null // not loaded yet
}

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
  ctx.fillStyle = '#8b6f47'
  drawRoundRect(ctx, x, y, w, h, 4)
  ctx.fill()
  ctx.strokeStyle = '#6b5437'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#1a1a2e'
  drawRoundRect(ctx, x + w * 0.15, y + h * 0.1, w * 0.5, h * 0.55, 3)
  ctx.fill()
  ctx.fillStyle = '#1e3a5f'
  drawRoundRect(ctx, x + w * 0.17, y + h * 0.12, w * 0.46, h * 0.5, 2)
  ctx.fill()
  // Monitor glow (blue light on desk)
  ctx.fillStyle = '#4488ff18'
  drawRoundRect(ctx, x + w * 0.17, y + h * 0.12, w * 0.46, h * 0.5, 2)
  ctx.fill()
  ctx.fillStyle = '#333'
  ctx.fillRect(x + w * 0.35, y + h * 0.65, w * 0.12, h * 0.15)
  ctx.fillStyle = '#555'
  ctx.beginPath()
  ctx.ellipse(x + w * 0.78, y + h * 0.45, 5, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  // Sticky notes
  ctx.fillStyle = '#fde68a'
  ctx.fillRect(x + w * 0.68, y + h * 0.55, 14, 14)
  ctx.fillStyle = '#fed7aa'
  ctx.fillRect(x + w * 0.84, y + h * 0.55, 12, 12)
  // Coffee cup
  ctx.fillStyle = '#fff'
  ctx.fillRect(x + w * 0.68, y + h * 0.6 + 12, 12, 10)
  ctx.fillStyle = '#7b4f2e'
  ctx.fillRect(x + w * 0.69, y + h * 0.6 + 14, 10, 6)
  // Papers
  ctx.fillStyle = '#f5f5f0cc'
  ctx.fillRect(x + w * 0.68, y + h * 0.72, w * 0.22, h * 0.22)
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#3d3d5c'
  drawRoundRect(ctx, x - 14, y - 14, 28, 28, 5)
  ctx.fill()
  ctx.strokeStyle = '#5a5a7a'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = '#222'
  ctx.beginPath()
  ctx.arc(x - 8, y + 16, 3, 0, Math.PI * 2)
  ctx.arc(x + 8, y + 16, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, large = false) {
  const s = large ? 1.8 : 1
  ctx.fillStyle = '#7c5c3a'
  ctx.beginPath()
  ctx.moveTo(x - 10 * s, y + 8 * s)
  ctx.lineTo(x + 10 * s, y + 8 * s)
  ctx.lineTo(x + 7 * s, y + 20 * s)
  ctx.lineTo(x - 7 * s, y + 20 * s)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#2d6a27'
  ctx.beginPath()
  ctx.arc(x, y - 5 * s, 14 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3d8a35'
  ctx.beginPath()
  ctx.arc(x - 6 * s, y - 8 * s, 10 * s, 0, Math.PI * 2)
  ctx.arc(x + 6 * s, y - 8 * s, 10 * s, 0, Math.PI * 2)
  ctx.fill()
  // Plant shadow on floor
  ctx.fillStyle = '#00000020'
  ctx.beginPath()
  ctx.ellipse(x, y + 20 * s, 12 * s, 4 * s, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#555'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#87ceeb55'
  ctx.fillRect(x + 4, y + 4, w / 2 - 6, h - 8)
  ctx.fillRect(x + w / 2 + 2, y + 4, w / 2 - 6, h - 8)
  ctx.fillStyle = '#ffffff15'
  ctx.fillRect(x + 6, y + 6, 4, h - 12)
  ctx.fillRect(x + w / 2 + 4, y + 6, 4, h - 12)
  ctx.fillStyle = '#87ceeb08'
  ctx.fillRect(x, y + h, w, 60)
}

function drawWindowNight(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Dark city view frame
  ctx.fillStyle = '#444'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6)
  // City lights
  const lightDots = [
    [x+8,y+10],[x+20,y+8],[x+35,y+14],[x+50,y+7],[x+65,y+12],
    [x+12,y+25],[x+28,y+22],[x+44,y+28],[x+60,y+20],[x+75,y+26],
    [x+6,y+38],[x+22,y+35],[x+40,y+40],[x+58,y+33],[x+72,y+38],
  ]
  for (const [lx, ly] of lightDots) {
    ctx.fillStyle = `hsl(${40+Math.random()*40},80%,70%)`
    ctx.fillRect(lx, ly, 2, 2)
  }
  // Window reflection
  ctx.fillStyle = '#ffffff06'
  ctx.fillRect(x + 4, y + 4, 3, h - 8)
}

function drawCoffeeMachine(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#2a2a2a'
  drawRoundRect(ctx, x, y, 50, 60, 5)
  ctx.fill()
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = '#ff6b3544'
  ctx.fillRect(x + 6, y + 8, 28, 16)
  ctx.fillStyle = '#ff6b35'
  ctx.font = 'bold 8px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('☕', x + 20, y + 21)
  ctx.fillStyle = '#ff6b35'
  ctx.beginPath()
  ctx.arc(x + 38, y + 14, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#444'
  ctx.fillRect(x + 8, y + 46, 34, 8)
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
  ctx.strokeStyle = '#bbb'
  ctx.beginPath()
  ctx.moveTo(x + 2, y + 35)
  ctx.lineTo(x + 58, y + 35)
  ctx.stroke()
  ctx.fillStyle = '#888'
  ctx.fillRect(x + 48, y + 10, 6, 20)
  ctx.fillRect(x + 48, y + 42, 6, 20)
}

function drawBoardroomTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#00000040'
  drawRoundRect(ctx, x + 6, y + 6, w, h, 12)
  ctx.fill()
  ctx.fillStyle = '#4a2e0a'
  drawRoundRect(ctx, x, y, w, h, 12)
  ctx.fill()
  ctx.strokeStyle = '#6b4520'
  ctx.lineWidth = 2
  ctx.stroke()
  // Table reflection
  ctx.fillStyle = '#ffffff08'
  drawRoundRect(ctx, x + 10, y + h * 0.55, w - 20, h * 0.35, 8)
  ctx.fill()
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
  const chairPositions = [
    { cx: x + w * 0.2, cy: y - 22 },
    { cx: x + w * 0.4, cy: y - 22 },
    { cx: x + w * 0.6, cy: y - 22 },
    { cx: x + w * 0.8, cy: y - 22 },
    { cx: x + w * 0.2, cy: y + h + 22 },
    { cx: x + w * 0.4, cy: y + h + 22 },
    { cx: x + w * 0.6, cy: y + h + 22 },
    { cx: x + w * 0.8, cy: y + h + 22 },
    { cx: x - 22, cy: y + h * 0.35 },
    { cx: x - 22, cy: y + h * 0.65 },
    { cx: x + w + 22, cy: y + h * 0.35 },
    { cx: x + w + 22, cy: y + h * 0.65 },
  ]
  for (const c of chairPositions) {
    ctx.fillStyle = '#1a1a2e'
    drawRoundRect(ctx, c.cx - 16, c.cy - 16, 32, 32, 6)
    ctx.fill()
    ctx.strokeStyle = '#2a2a4e'
    ctx.lineWidth = 1
    ctx.stroke()
  }
  const cardPositions = [0.2, 0.4, 0.6, 0.8]
  for (const p of cardPositions) {
    ctx.fillStyle = '#f5f5f0cc'
    ctx.fillRect(x + w * p - 16, y + h / 2 - 8, 32, 16)
  }
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#888'
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8)
  ctx.fillStyle = '#f8f8f2'
  ctx.fillRect(x, y, w, h)
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
  ctx.fillStyle = '#666'
  ctx.fillRect(x, y + h, w, 6)
}

function drawStairs(ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'up' | 'down', label: string, accentColor: string) {
  const w = 70, h = 85
  // Door frame
  ctx.fillStyle = '#1a1a2a'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = accentColor + 'aa'
  ctx.lineWidth = 2
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.stroke()

  // Door arch top
  ctx.fillStyle = accentColor + '22'
  ctx.beginPath()
  ctx.arc(x + w / 2, y + 28, 18, Math.PI, 0)
  ctx.lineTo(x + w / 2 + 18, y + 42)
  ctx.lineTo(x + w / 2 - 18, y + 42)
  ctx.fill()
  ctx.strokeStyle = accentColor + '88'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x + w / 2, y + 28, 18, Math.PI, 0)
  ctx.stroke()

  // Arrow
  ctx.font = 'bold 18px monospace'
  ctx.fillStyle = accentColor
  ctx.textAlign = 'center'
  ctx.fillText(direction === 'up' ? '↑' : '↓', x + w / 2, y + 62)

  // Label above
  ctx.font = 'bold 9px monospace'
  ctx.fillStyle = accentColor
  ctx.fillText(label, x + w / 2, y - 7)
}

function drawElevator(ctx: CanvasRenderingContext2D, x: number, y: number, accentColor: string) {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(x, y, 70, 100)
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, 70, 100)
  ctx.fillStyle = '#333'
  ctx.fillRect(x + 4, y + 4, 28, 88)
  ctx.fillRect(x + 38, y + 4, 28, 88)
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 35, y + 4)
  ctx.lineTo(x + 35, y + 92)
  ctx.stroke()
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

function drawGameRoom(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, gameType: string, accentColor: string, nearPlayer: boolean, now: number) {
  const cx = x + w / 2
  const cy = y + h / 2

  // Nearness glow aura (subtle, works for any furniture style)
  if (nearPlayer) {
    const pulse = 0.08 + Math.sin(now / 350) * 0.06
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 12
    ctx.globalAlpha = pulse
    drawRoundRect(ctx, x - 6, y - 6, w + 12, h + 12, 10)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  if (gameType === 'plunger_challenge') {
    // ── Toilet (top-down view) ────────────────────────────────────────────
    // Tank (back rectangle)
    ctx.fillStyle = '#e8e0d8'
    ctx.strokeStyle = '#c0b8b0'
    ctx.lineWidth = 2
    drawRoundRect(ctx, x + 4, y + 2, w - 8, h * 0.38, 4)
    ctx.fill(); ctx.stroke()
    // Bowl (front oval)
    ctx.fillStyle = '#f0ece8'
    ctx.strokeStyle = '#c0b8b0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx, y + h * 0.68, w * 0.42, h * 0.32, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
    // Water in bowl
    ctx.fillStyle = '#b8d4e8'
    ctx.beginPath()
    ctx.ellipse(cx, y + h * 0.7, w * 0.3, h * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()
    // Seat outline
    ctx.strokeStyle = '#a8a098'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(cx, y + h * 0.68, w * 0.42, h * 0.32, 0, 0, Math.PI * 2)
    ctx.stroke()
    // Flush button on tank
    ctx.fillStyle = '#d0c8c0'
    ctx.beginPath()
    ctx.arc(cx, y + h * 0.19, 5, 0, Math.PI * 2)
    ctx.fill()

  } else if (gameType === 'tenant_or_colleague') {
    // ── Bulletin board / notice board ────────────────────────────────────
    ctx.fillStyle = '#8b6f47'
    drawRoundRect(ctx, x, y, w, h, 5)
    ctx.fill()
    ctx.strokeStyle = '#6b5030'
    ctx.lineWidth = 3
    drawRoundRect(ctx, x, y, w, h, 5)
    ctx.stroke()
    // Cork surface
    ctx.fillStyle = '#c8a870'
    drawRoundRect(ctx, x + 5, y + 5, w - 10, h - 10, 3)
    ctx.fill()
    // Pinned notes (3 small colored papers)
    const notes = [
      { nx: x + 10, ny: y + 10, nw: w * 0.38, nh: h * 0.3, col: '#fde68a' },
      { nx: x + w * 0.5, ny: y + 8, nw: w * 0.38, nh: h * 0.28, col: '#fca5a5' },
      { nx: x + 8, ny: y + h * 0.48, nw: w * 0.42, nh: h * 0.32, col: '#a5f3fc' },
      { nx: x + w * 0.48, ny: y + h * 0.44, nw: w * 0.4, nh: h * 0.38, col: '#bbf7d0' },
    ]
    for (const n of notes) {
      ctx.fillStyle = n.col
      ctx.fillRect(n.nx, n.ny, n.nw, n.nh)
      ctx.fillStyle = '#00000022'
      ctx.fillRect(n.nx + 1, n.ny + 1, n.nw, n.nh)
      // Pin dot
      ctx.fillStyle = '#e74c3c'
      ctx.beginPath()
      ctx.arc(n.nx + n.nw / 2, n.ny + 3, 3, 0, Math.PI * 2)
      ctx.fill()
      // Lines on note
      ctx.strokeStyle = '#00000030'
      ctx.lineWidth = 1
      for (let li = 0; li < 3; li++) {
        ctx.beginPath()
        ctx.moveTo(n.nx + 4, n.ny + 8 + li * 5)
        ctx.lineTo(n.nx + n.nw - 4, n.ny + 8 + li * 5)
        ctx.stroke()
      }
    }

  } else if (gameType === 'kiez_sorting') {
    // ── Berlin map on wall ────────────────────────────────────────────────
    ctx.fillStyle = '#2a3a4a'
    drawRoundRect(ctx, x, y, w, h, 5)
    ctx.fill()
    ctx.strokeStyle = '#4a6a8a'
    ctx.lineWidth = 2
    drawRoundRect(ctx, x, y, w, h, 5)
    ctx.stroke()
    // Map surface
    ctx.fillStyle = '#d4c9b0'
    drawRoundRect(ctx, x + 4, y + 4, w - 8, h - 8, 3)
    ctx.fill()
    // Colored districts
    const districts = [
      { col: '#ff6b6b55', ex: x+6,  ey: y+6,  ew: 22, eh: 20 },
      { col: '#4d96ff55', ex: x+30, ey: y+8,  ew: 18, eh: 18 },
      { col: '#6bcb7755', ex: x+8,  ey: y+28, ew: 20, eh: 22 },
      { col: '#ffd93d55', ex: x+30, ey: y+28, ew: 22, eh: 18 },
      { col: '#ff6bd655', ex: x+10, ey: y+52, ew: 38, eh: 14 },
    ]
    for (const d of districts) {
      ctx.fillStyle = d.col
      ctx.fillRect(d.ex, d.ey, d.ew, d.eh)
    }
    // Grid lines
    ctx.strokeStyle = '#00000020'
    ctx.lineWidth = 0.5
    for (let gx = x + 4; gx < x + w - 4; gx += 12) {
      ctx.beginPath(); ctx.moveTo(gx, y + 4); ctx.lineTo(gx, y + h - 4); ctx.stroke()
    }

  } else {
    // ── Speed round: stopwatch on desk ────────────────────────────────────
    ctx.fillStyle = '#2a2a3a'
    drawRoundRect(ctx, x, y, w, h, 6)
    ctx.fill()
    ctx.strokeStyle = '#c084fc'
    ctx.lineWidth = 2
    drawRoundRect(ctx, x, y, w, h, 6)
    ctx.stroke()
    ctx.font = '28px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('⚡', cx, cy + 10)
  }

  // Label below object
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = nearPlayer ? accentColor : '#888'
  ctx.textAlign = 'center'
  const label = gameType === 'tenant_or_colleague' ? 'Notice Board' : gameType === 'kiez_sorting' ? 'Berlin Map' : gameType === 'plunger_challenge' ? 'Toilet' : 'Speed Round'
  ctx.fillText(label, cx, y + h + 12)

  if (nearPlayer) {
    ctx.globalAlpha = 1
  }
}

function drawKitchenCounter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#e8dcc8'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = '#c8b898'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, w, h)
  if (w > 80) {
    ctx.fillStyle = '#aaa'
    ctx.fillRect(x + w - 70, y + 8, 55, h - 16)
    ctx.fillStyle = '#888'
    ctx.fillRect(x + w - 65, y + 12, 45, h - 24)
    ctx.fillStyle = '#bbb'
    ctx.fillRect(x + w - 46, y + 4, 6, 12)
  }
}

function drawLunchTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#00000030'
  drawRoundRect(ctx, x + 4, y + 4, w, h, 6)
  ctx.fill()
  ctx.fillStyle = '#d4a96a'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = '#b8904a'
  ctx.lineWidth = 1.5
  ctx.stroke()
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
  for (const px of plateX) {
    ctx.fillStyle = '#7a6a4a'
    drawRoundRect(ctx, px - 14, y - 22, 28, 18, 4)
    ctx.fill()
    drawRoundRect(ctx, px - 14, y + h + 4, 28, 18, 4)
    ctx.fill()
  }
}

function drawReceptionDesk(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#f0ebe0'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = '#d0c8b0'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#e0d8c0'
  ctx.fillRect(x, y + h - 20, w, 20)
  ctx.fillStyle = '#1a1a2e'
  drawRoundRect(ctx, x + w / 2 - 25, y + 10, 50, 35, 3)
  ctx.fill()
  ctx.fillStyle = '#1e3a5f'
  drawRoundRect(ctx, x + w / 2 - 23, y + 12, 46, 31, 2)
  ctx.fill()
  ctx.fillStyle = '#c8a84a'
  ctx.fillRect(x + 10, y + h - 38, 80, 14)
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'center'
  ctx.fillText('BUENA', x + 50, y + h - 28)
  drawPlant(ctx, x + w - 25, y + 5)
}

function drawCouch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#4a4a6a'
  drawRoundRect(ctx, x, y, w, h * 0.4, 5)
  ctx.fill()
  ctx.fillStyle = '#5a5a7a'
  drawRoundRect(ctx, x, y + h * 0.35, w, h * 0.65, 5)
  ctx.fill()
  ctx.fillStyle = '#6a6a8a'
  drawRoundRect(ctx, x + 8, y + h * 0.38, w / 2 - 12, h * 0.55, 4)
  ctx.fill()
  drawRoundRect(ctx, x + w / 2 + 4, y + h * 0.38, w / 2 - 12, h * 0.55, 4)
  ctx.fill()
  ctx.fillStyle = '#3a3a5a'
  ctx.fillRect(x, y + h * 0.35, 12, h * 0.65)
  ctx.fillRect(x + w - 12, y + h * 0.35, 12, h * 0.65)
}

function drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Stand
  ctx.fillStyle = '#888'
  ctx.fillRect(x - 8, y + 40, 16, 20)
  // Body
  ctx.fillStyle = '#d0d8e0'
  drawRoundRect(ctx, x - 15, y, 30, 45, 4)
  ctx.fill()
  ctx.strokeStyle = '#b0b8c0'
  ctx.lineWidth = 1
  ctx.stroke()
  // Water bottle (blue)
  ctx.fillStyle = '#93c5fd80'
  drawRoundRect(ctx, x - 10, y - 25, 20, 30, 8)
  ctx.fill()
  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 1
  ctx.stroke()
  // Spout
  ctx.fillStyle = '#60a5fa'
  ctx.beginPath()
  ctx.arc(x, y + 28, 4, 0, Math.PI * 2)
  ctx.fill()
  // Cup dispenser
  ctx.fillStyle = '#aaa'
  ctx.fillRect(x + 8, y + 20, 8, 16)
}

function drawNoticeboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, now: number) {
  // Board frame
  ctx.fillStyle = '#5c3d1e'
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8)
  // Corkboard
  ctx.fillStyle = '#c8a06a'
  ctx.fillRect(x, y, w, h)
  // Pin pattern texture
  ctx.fillStyle = '#b8905a'
  for (let nx = x + 10; nx < x + w - 10; nx += 20) {
    for (let ny = y + 10; ny < y + h - 10; ny += 20) {
      ctx.fillRect(nx, ny, 1, 1)
    }
  }
  // Announcements (3 notes)
  const notes = [
    { text: 'Free pizza Friday!', color: '#fef3c7', pin: '#ef4444' },
    { text: "Whose cup is this?", color: '#dbeafe', pin: '#3b82f6' },
    { text: 'AC fixed! Finally.', color: '#dcfce7', pin: '#22c55e' },
  ]
  // Subtle wobble on the active note
  const wobble = Math.sin(now / 1200) * 1.5
  notes.forEach((note, i) => {
    const nx = x + 8 + i * (w / 3) + (i === 1 ? wobble : 0)
    const ny = y + 8
    ctx.save()
    ctx.translate(nx + (w / 3 - 14) / 2, ny + (h - 20) / 2)
    ctx.rotate((i - 1) * 0.05)
    ctx.fillStyle = note.color
    ctx.fillRect(-(w / 3 - 14) / 2, -(h - 20) / 2, w / 3 - 14, h - 20)
    ctx.fillStyle = note.pin
    ctx.beginPath()
    ctx.arc(0, -(h - 20) / 2 + 4, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a1a'
    ctx.font = '6px monospace'
    ctx.textAlign = 'center'
    // Wrap text
    const words = note.text.split(' ')
    let line = ''
    let lineY = -(h - 20) / 2 + 16
    for (const word of words) {
      const test = line + word + ' '
      if (ctx.measureText(test).width > w / 3 - 18) {
        ctx.fillText(line.trim(), 0, lineY)
        line = word + ' '
        lineY += 9
      } else {
        line = test
      }
    }
    ctx.fillText(line.trim(), 0, lineY)
    ctx.restore()
  })
}

function drawProjectorScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, now: number) {
  // Screen border
  ctx.fillStyle = '#555'
  ctx.fillRect(x - 5, y - 5, w + 10, h + 10)
  // Screen bg
  ctx.fillStyle = '#e8eaf0'
  ctx.fillRect(x, y, w, h)
  // Title bar
  ctx.fillStyle = '#1e3a5f'
  ctx.fillRect(x, y, w, 22)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 9px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Q3 RESULTS — BUENA', x + w / 2, y + 14)
  // Fake bar chart
  const bars = [0.4, 0.65, 0.55, 0.8, 0.7, 0.9]
  const bw = (w - 20) / bars.length
  bars.forEach((bh, i) => {
    const barH = (h - 40) * bh
    const bx = x + 10 + i * bw
    const by = y + h - 8 - barH
    // Animated highlight — last bar grows
    const animH = i === bars.length - 1 ? barH * (0.85 + Math.sin(now / 800) * 0.15) : barH
    ctx.fillStyle = i === bars.length - 1 ? '#4ade80' : '#4d96ff'
    ctx.fillRect(bx, y + h - 8 - animH, bw - 4, animH)
    ctx.fillStyle = i === bars.length - 1 ? '#22c55e' : '#2d7dd2'
    ctx.fillRect(bx, y + h - 8 - animH, bw - 4, 3)
  })
  // X-axis
  ctx.fillStyle = '#666'
  ctx.fillRect(x + 8, y + h - 8, w - 16, 1)
  // Projector mount
  ctx.fillStyle = '#444'
  ctx.fillRect(x + w/2 - 4, y - 16, 8, 12)
}

function drawTrophyShelf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, topBichos: Array<{name: string, color: string, score: number}>) {
  // Shelf
  ctx.fillStyle = '#4a2e0a'
  ctx.fillRect(x, y + h - 12, w, 12)
  ctx.fillStyle = '#6b4520'
  ctx.fillRect(x, y + h - 14, w, 3)
  // Bracket
  ctx.fillStyle = '#333'
  ctx.fillRect(x + 5, y, 3, h - 12)
  ctx.fillRect(x + w - 8, y, 3, h - 12)
  // Trophies
  const trophyColors = ['#ffd700', '#c0c0c0', '#cd7f32']
  for (let i = 0; i < Math.min(3, topBichos.length); i++) {
    const tx = x + 10 + i * (w - 20) / 3
    const ty = y + h - 45
    // Cup
    ctx.fillStyle = trophyColors[i]
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.bezierCurveTo(tx - 10, ty + 5, tx - 10, ty + 20, tx, ty + 22)
    ctx.bezierCurveTo(tx + 10, ty + 20, tx + 10, ty + 5, tx, ty)
    ctx.fill()
    // Stem
    ctx.fillStyle = trophyColors[i]
    ctx.fillRect(tx - 3, ty + 22, 6, 8)
    // Base
    ctx.fillRect(tx - 8, ty + 28, 16, 4)
  }
}

function drawDJBooth(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, now: number) {
  // Booth table
  ctx.fillStyle = '#1a0a1a'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = '#f472b640'
  ctx.lineWidth = 2
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.stroke()
  // Turntable platter
  const cx2 = x + w * 0.3
  const cy2 = y + h * 0.5
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(cx2, cy2, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.stroke()
  // Spinning record lines
  const spin = now / 500
  for (let ri = 0; ri < 4; ri++) {
    ctx.strokeStyle = `hsl(${300 + ri * 20},60%,30%)`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx2, cy2, 8 + ri * 3.5, spin, spin + Math.PI * 1.5)
    ctx.stroke()
  }
  ctx.fillStyle = '#f472b6'
  ctx.beginPath()
  ctx.arc(cx2, cy2, 4, 0, Math.PI * 2)
  ctx.fill()
  // EQ bars (animated BPM)
  const bpm = now / 400
  const eqBars = 8
  for (let ei = 0; ei < eqBars; ei++) {
    const bh = (Math.sin(bpm + ei * 0.8) * 0.4 + 0.6) * (h * 0.6)
    const bx2 = x + w * 0.55 + ei * ((w * 0.4) / eqBars)
    const hue = 280 + ei * 10
    ctx.fillStyle = `hsl(${hue},80%,60%)`
    ctx.fillRect(bx2, y + h - 8 - bh, (w * 0.4) / eqBars - 2, bh)
  }
  // Label
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = '#f472b6'
  ctx.textAlign = 'center'
  ctx.fillText('DJ BOOTH', x + w / 2, y - 6)
}

function drawVIPRope(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Posts
  ctx.fillStyle = '#c8a84a'
  ctx.fillRect(x - 4, y, 8, 40)
  ctx.fillRect(x + w - 4, y, 8, 40)
  // Ball tops
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(x, y, 6, 0, Math.PI * 2)
  ctx.arc(x + w, y, 6, 0, Math.PI * 2)
  ctx.fill()
  // Velvet rope (curved)
  ctx.strokeStyle = '#8b0000'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y + 10)
  ctx.quadraticCurveTo(x + w / 2, y + 30, x + w, y + 10)
  ctx.stroke()
  // VIP label
  ctx.font = 'bold 9px monospace'
  ctx.fillStyle = '#ffd700'
  ctx.textAlign = 'center'
  ctx.fillText('VIP', x + w / 2, y - 8)
}

function drawNeonSign(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, now: number) {
  const flicker = Math.random() > 0.995 ? 0.3 : 1
  const glow = (Math.sin(now / 2000) * 0.2 + 0.8) * flicker
  ctx.save()
  ctx.globalAlpha = glow
  // Outer glow
  ctx.shadowColor = color
  ctx.shadowBlur = 20
  ctx.font = 'bold 16px monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
  // Inner bright
  ctx.shadowBlur = 6
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = glow * 0.6
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawDigitalBoard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, now: number) {
  ctx.fillStyle = '#0a0a1a'
  drawRoundRect(ctx, x, y, w, h, 4)
  ctx.fill()
  ctx.strokeStyle = '#1e3a5f'
  ctx.lineWidth = 2
  drawRoundRect(ctx, x, y, w, h, 4)
  ctx.stroke()
  // Header
  ctx.fillStyle = '#1e3a5f'
  ctx.fillRect(x, y, w, 18)
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = '#60a5fa'
  ctx.textAlign = 'center'
  ctx.fillText('TODAY AT BUENA', x + w / 2, y + 12)
  // Content
  ctx.font = '7px monospace'
  ctx.textAlign = 'left'
  const lines = [
    { label: 'Meetings', val: '7', color: '#fde68a' },
    { label: 'Calls', val: '12', color: '#86efac' },
    { label: 'Coffees', val: '∞', color: '#fb923c' },
  ]
  lines.forEach((line, i) => {
    const ly = y + 28 + i * 14
    ctx.fillStyle = '#4a5568'
    ctx.fillText(line.label, x + 8, ly)
    ctx.fillStyle = line.color
    // Blinking cursor on last item
    const display = i === 2 ? line.val + (Math.floor(now / 500) % 2 ? '|' : '') : line.val
    ctx.textAlign = 'right'
    ctx.fillText(display, x + w - 8, ly)
    ctx.textAlign = 'left'
  })
}

function drawWallOfFame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  topBichos: Array<{ name: string; color: string; score: number; avatar_url?: string }>
) {
  // Board
  ctx.fillStyle = '#1a1a2e'
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = '#c8a84a'
  ctx.lineWidth = 2
  drawRoundRect(ctx, x, y, w, h, 6)
  ctx.stroke()
  // Title
  ctx.font = 'bold 9px monospace'
  ctx.fillStyle = '#c8a84a'
  ctx.textAlign = 'center'
  ctx.fillText('★ WALL OF FAME ★', x + w / 2, y + 14)
  // Portraits
  const cols = Math.min(topBichos.length, 5)
  const spacing = w / (cols + 1)
  topBichos.slice(0, 5).forEach((b, i) => {
    const px2 = x + spacing * (i + 1)
    const py2 = y + h / 2 + 4
    const radius = 14
    // Try avatar
    const img = b.avatar_url ? loadAvatarImage(b.avatar_url) : null
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(px2, py2, radius, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, px2 - radius, py2 - radius, radius * 2, radius * 2)
      ctx.restore()
    } else {
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.arc(px2, py2, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    // Ring
    ctx.strokeStyle = b.color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(px2, py2, radius + 1, 0, Math.PI * 2)
    ctx.stroke()
    // Name
    ctx.font = '6px monospace'
    ctx.fillStyle = '#aaa'
    ctx.textAlign = 'center'
    ctx.fillText(b.name.split(' ')[0].slice(0, 6), px2, py2 + radius + 8)
    // Score
    ctx.fillStyle = '#f472b6'
    ctx.fillText(`⚡${b.score}`, px2, py2 + radius + 16)
  })
}

// ─── Bicho / Avatar rendering ─────────────────────────────────────────────────

function darkenColor(hex: string, amount = 0.25): string {
  // Parse hex color and return a darker version
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0,2), 16)
  const g = parseInt(c.slice(2,4), 16)
  const b = parseInt(c.slice(4,6), 16)
  const dr = Math.max(0, Math.floor(r * (1 - amount)))
  const dg = Math.max(0, Math.floor(g * (1 - amount)))
  const db = Math.max(0, Math.floor(b * (1 - amount)))
  return `rgb(${dr},${dg},${db})`
}

function drawBichoFallback(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, _color: string, _shape: string, bobY = 0, name = '', walkFrame = 0) {
  const appearance = generateBicho(name || _color)
  const { color, eyeColor, accessory } = appearance
  const py = y + bobY

  // Rock body on walk frames (Among Us crewmate waddle)
  const lean = walkFrame === 1 ? 0.1 : walkFrame === 3 ? -0.1 : 0

  ctx.save()
  ctx.translate(x, py)
  ctx.rotate(lean)

  const bw = size * 1.35
  const bh = size * 2.1

  // ── Legs (two round bumps at bottom, drawn behind body) ─────────────────
  const legR = size * 0.35
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(-size * 0.38, bh / 2 - legR * 0.4, legR, legR * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = darkenColor(color, 0.3)
  ctx.lineWidth = size * 0.09
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(size * 0.38, bh / 2 - legR * 0.4, legR, legR * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // ── Backpack (right side bump) ───────────────────────────────────────────
  ctx.fillStyle = darkenColor(color, 0.18)
  ctx.beginPath()
  ctx.ellipse(bw / 2 - size * 0.08, size * 0.08, size * 0.33, size * 0.52, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = darkenColor(color, 0.32)
  ctx.lineWidth = size * 0.09
  ctx.stroke()

  // ── Body (bean/egg shape) ────────────────────────────────────────────────
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = darkenColor(color, 0.3)
  ctx.lineWidth = size * 0.12
  ctx.stroke()

  // ── Visor (dark window in upper body) ───────────────────────────────────
  const vx = -size * 0.18
  const vy = -bh * 0.16
  const vw = size * 0.9
  const vh = size * 0.62
  ctx.fillStyle = '#0d1b2a'
  ctx.beginPath()
  ctx.ellipse(vx, vy, vw / 2, vh / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  // Visor shine highlight
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.beginPath()
  ctx.ellipse(vx - vw * 0.14, vy - vh * 0.22, vw * 0.24, vh * 0.18, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // ── Accessory on top of body ─────────────────────────────────────────────
  const accY = -bh / 2

  if (accessory === 'hat') {
    ctx.fillStyle = eyeColor
    ctx.fillRect(-size * 0.6, accY - size * 0.7, size * 1.2, size * 0.55)   // brim
    ctx.fillRect(-size * 0.4, accY - size * 1.35, size * 0.8, size * 0.72)  // top
    ctx.strokeStyle = darkenColor(eyeColor, 0.25)
    ctx.lineWidth = size * 0.08
    ctx.strokeRect(-size * 0.4, accY - size * 1.35, size * 0.8, size * 0.72)
  } else if (accessory === 'crown') {
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.moveTo(-size * 0.6, accY)
    ctx.lineTo(-size * 0.6, accY - size * 0.7)
    ctx.lineTo(-size * 0.2, accY - size * 0.38)
    ctx.lineTo(0, accY - size * 0.78)
    ctx.lineTo(size * 0.2, accY - size * 0.38)
    ctx.lineTo(size * 0.6, accY - size * 0.7)
    ctx.lineTo(size * 0.6, accY)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = darkenColor('#ffd700', 0.25)
    ctx.lineWidth = size * 0.08
    ctx.stroke()
  } else if (accessory === 'antenna') {
    ctx.strokeStyle = eyeColor
    ctx.lineWidth = size * 0.13
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(size * 0.18, accY)
    ctx.lineTo(size * 0.52, accY - size * 0.82)
    ctx.stroke()
    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.arc(size * 0.52, accY - size * 0.88, size * 0.2, 0, Math.PI * 2)
    ctx.fill()
  } else if (accessory === 'bunny') {
    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.ellipse(-size * 0.3, accY - size * 0.62, size * 0.2, size * 0.5, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(size * 0.3, accY - size * 0.62, size * 0.2, size * 0.5, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff9a9a'
    ctx.beginPath()
    ctx.ellipse(-size * 0.3, accY - size * 0.62, size * 0.1, size * 0.3, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(size * 0.3, accY - size * 0.62, size * 0.1, size * 0.3, 0.2, 0, Math.PI * 2)
    ctx.fill()
  } else if (accessory === 'bow') {
    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.moveTo(-size * 0.55, accY - size * 0.55)
    ctx.lineTo(-size * 0.1, accY - size * 0.3)
    ctx.lineTo(-size * 0.55, accY - size * 0.05)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(size * 0.55, accY - size * 0.55)
    ctx.lineTo(size * 0.1, accY - size * 0.3)
    ctx.lineTo(size * 0.55, accY - size * 0.05)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, accY - size * 0.3, size * 0.18, 0, Math.PI * 2)
    ctx.fill()
  } else if (accessory === 'party') {
    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.moveTo(-size * 0.28, accY)
    ctx.lineTo(0, accY - size * 0.92)
    ctx.lineTo(size * 0.28, accY)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffd93d'
    ctx.beginPath()
    ctx.arc(0, accY - size * 0.97, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
  } else if (accessory === 'horns') {
    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.moveTo(-size * 0.5, accY)
    ctx.lineTo(-size * 0.65, accY - size * 0.78)
    ctx.lineTo(-size * 0.2, accY)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(size * 0.2, accY)
    ctx.lineTo(size * 0.65, accY - size * 0.78)
    ctx.lineTo(size * 0.5, accY)
    ctx.closePath()
    ctx.fill()
  } else if (accessory === 'flower') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.fillStyle = eyeColor
      ctx.beginPath()
      ctx.ellipse(Math.cos(a) * size * 0.3, accY - size * 0.4 + Math.sin(a) * size * 0.3, size * 0.2, size * 0.15, a, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ffd93d'
    ctx.beginPath()
    ctx.arc(0, accY - size * 0.4, size * 0.2, 0, Math.PI * 2)
    ctx.fill()
  } else if (accessory === 'beanie') {
    ctx.fillStyle = eyeColor
    ctx.beginPath()
    ctx.ellipse(0, accY - size * 0.3, size * 0.65, size * 0.45, 0, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(-size * 0.65, accY - size * 0.13, size * 1.3, size * 0.22)
    ctx.beginPath()
    ctx.arc(0, accY - size * 0.74, size * 0.18, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawPlayerAvatar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  color: string, shape: string,
  avatarUrl: string | undefined,
  name: string,
  isPlayer: boolean,
  score: number,
  bobOffset = 0,
  walkFrame = 0
) {
  ctx.save()
  const py = y + bobOffset
  const img = avatarUrl ? loadAvatarImage(avatarUrl) : null
  const hasPhoto = img && img.complete && img.naturalWidth > 0

  // Drop shadow on floor (under feet, not body center)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(x, y + size * 1.5, size * 0.9, size * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  if (hasPhoto) {
    // Colored ring
    if (isPlayer) {
      ctx.shadowColor = color
      ctx.shadowBlur = 14
    }
    ctx.strokeStyle = color
    ctx.lineWidth = isPlayer ? 3 : 2
    ctx.beginPath()
    ctx.arc(x, py, size + 3, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    // Circular photo
    ctx.beginPath()
    ctx.arc(x, py, size, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img!, x - size, py - size, size * 2, size * 2)
  } else {
    // Fallback bicho shape
    if (isPlayer) {
      ctx.shadowColor = color
      ctx.shadowBlur = 14
    }
    drawBichoFallback(ctx, x, py, size, color, shape, 0, name, walkFrame)
    ctx.shadowBlur = 0

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
  }

  ctx.restore()

  // Name badge — sits above the head top (head is at py - size*1.0, radius size*0.75)
  const firstName = name.split(' ')[0]
  ctx.font = `bold ${isPlayer ? 11 : 10}px monospace`
  const tw = ctx.measureText(firstName).width
  const badgeW = tw + 14
  const badgeH = 18
  const bx = x - badgeW / 2
  const headTop = py - size * 1.75   // top of head for bicho characters
  const by = (hasPhoto ? py - size - 10 : headTop) - badgeH - 4

  ctx.fillStyle = 'rgba(0,0,0,0.72)'
  drawRoundRect(ctx, bx, by, badgeW, badgeH, 5)
  ctx.fill()
  ctx.strokeStyle = color + '60'
  ctx.lineWidth = 1
  drawRoundRect(ctx, bx, by, badgeW, badgeH, 5)
  ctx.stroke()

  ctx.fillStyle = isPlayer ? color : '#cccccc'
  ctx.textAlign = 'center'
  ctx.fillText(firstName, x, by + badgeH - 4)

  // Score badge
  if (score > 0) {
    ctx.font = '9px monospace'
    ctx.fillStyle = '#f472b6'
    ctx.textAlign = 'center'
    ctx.fillText(`⚡${score}`, x, by - 4)
  }
}

// ─── Steam particles ──────────────────────────────────────────────────────────

type SteamParticle = { x: number; y: number; vy: number; alpha: number; r: number; dx: number }
const steamParticles: SteamParticle[] = []

function updateSteam(sourceX: number, sourceY: number, now: number) {
  // Spawn
  if (Math.floor(now / 200) !== Math.floor((now - 16) / 200)) {
    for (let i = 0; i < 2; i++) {
      steamParticles.push({
        x: sourceX + (Math.random() - 0.5) * 10,
        y: sourceY,
        vy: -(0.3 + Math.random() * 0.4),
        alpha: 0.6,
        r: 3 + Math.random() * 3,
        dx: (Math.random() - 0.5) * 0.3,
      })
    }
  }
  // Keep max 30
  if (steamParticles.length > 30) steamParticles.splice(0, steamParticles.length - 30)
}

function drawSteam(ctx: CanvasRenderingContext2D) {
  for (const p of steamParticles) {
    p.y += p.vy
    p.x += p.dx
    p.alpha -= 0.008
    p.r += 0.04
    if (p.alpha <= 0) continue
    ctx.save()
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // Remove faded
  for (let i = steamParticles.length - 1; i >= 0; i--) {
    if (steamParticles[i].alpha <= 0) steamParticles.splice(i, 1)
  }
}

// ─── Disco mirror ball ────────────────────────────────────────────────────────

function drawMirrorBallDots(ctx: CanvasRenderingContext2D, W: number, H: number, now: number) {
  const angle = now / 2000
  const colors = ['#f472b6', '#c084fc', '#60a5fa', '#4ade80', '#fde68a']
  for (let i = 0; i < 16; i++) {
    const a = angle + (i / 16) * Math.PI * 2
    const rx = Math.cos(a) * (W * 0.35)
    const ry = Math.sin(a * 0.7) * (H * 0.25)
    const dotX = W / 2 + rx
    const dotY = H * 0.65 + ry
    const sz = 4 + Math.sin(a * 3) * 2
    ctx.save()
    ctx.globalAlpha = 0.35 + Math.sin(a) * 0.15
    ctx.fillStyle = colors[i % colors.length]
    ctx.shadowColor = colors[i % colors.length]
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(dotX, dotY, sz, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ─── Floor drawing ────────────────────────────────────────────────────────────

function drawFloor(
  ctx: CanvasRenderingContext2D,
  floor: Floor, W: number, H: number,
  completedChallenges: Set<string>,
  sohoUnlocked: boolean,
  px: number, py: number,
  now: number,
  topBichos: Array<{ name: string; color: string; score: number; avatar_url?: string }>
) {
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
  ctx.fillRect(0, 0, 60, H)
  ctx.fillRect(W - 60, 0, 60, H)
  ctx.fillRect(0, 0, W, 60)
  ctx.fillRect(0, H - 60, W, 60)
  ctx.strokeStyle = '#ffffff08'
  ctx.lineWidth = 1
  for (let i = 0; i < H; i += 30) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(60, i); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W - 60, i); ctx.lineTo(W, i); ctx.stroke()
  }

  // ── B: Kitchen ───────────────────────────────────────────────────────────
  if (f.id === 0) {
    // Warm tungsten lighting overlay
    const tungsten = ctx.createRadialGradient(W / 2, 0, 0, W / 2, H / 2, H)
    tungsten.addColorStop(0, 'rgba(255,200,80,0.10)')
    tungsten.addColorStop(1, 'rgba(255,140,0,0.04)')
    ctx.fillStyle = tungsten
    ctx.fillRect(0, 0, W, H)

    // Checkered floor tiles
    for (let tx = 60; tx < W - 60; tx += 40) {
      for (let ty = 60; ty < H - 60; ty += 40) {
        if ((Math.floor(tx / 40) + Math.floor(ty / 40)) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.025)'
          ctx.fillRect(tx, ty, 40, 40)
        }
      }
    }

    // Ceiling lights
    for (let lx = 200; lx < W - 100; lx += 200) {
      ctx.fillStyle = '#ffffffcc'
      ctx.fillRect(lx, 62, 60, 6)
      ctx.fillStyle = '#ffffffee'
      ctx.fillRect(lx + 5, 62, 50, 4)
      // Warm cone
      const cone = ctx.createLinearGradient(lx + 30, 68, lx + 30, H - 60)
      cone.addColorStop(0, 'rgba(255,200,80,0.10)')
      cone.addColorStop(1, 'rgba(255,200,80,0.00)')
      ctx.fillStyle = cone
      ctx.beginPath()
      ctx.moveTo(lx, 68); ctx.lineTo(lx + 60, 68)
      ctx.lineTo(lx + 110, H - 60); ctx.lineTo(lx - 50, H - 60)
      ctx.closePath(); ctx.fill()
    }

    // Top counter
    drawKitchenCounter(ctx, 80, 65, 420, 70)
    drawCoffeeMachine(ctx, 120, 70)
    // Steam from coffee machine
    updateSteam(145, 70, now)
    drawSteam(ctx)
    drawFridge(ctx, 230, 65)
    ctx.fillStyle = '#888'
    drawRoundRect(ctx, 340, 72, 60, 45, 3); ctx.fill()
    ctx.fillStyle = '#aaa'
    drawRoundRect(ctx, 343, 75, 54, 38, 2); ctx.fill()

    // Right side counter
    drawKitchenCounter(ctx, 80, H - 140, W - 200, 70)

    // Grease splatter near counter (subtle)
    ctx.fillStyle = '#5a3a1a15'
    for (let si = 0; si < 6; si++) {
      ctx.beginPath()
      ctx.ellipse(90 + si * 60, H - 148, 8 + si * 2, 3, 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Lunch tables
    drawLunchTable(ctx, 460, 230, 180, 90)
    drawLunchTable(ctx, 710, 230, 180, 90)

    // Noticeboard on wall
    drawNoticeboard(ctx, W - 240, 70, 160, 120, now)

    // Water cooler
    drawWaterCooler(ctx, W - 160, H - 200)

    // Floor mat
    ctx.fillStyle = '#4a7a4a'
    ctx.fillRect(80, H - 145, 60, 6)
  }

  // ── GF: Reception ───────────────────────────────────────────────────────
  if (f.id === 1) {
    // Blue professional light tint
    const blueLight = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.8)
    blueLight.addColorStop(0, 'rgba(100,160,255,0.06)')
    blueLight.addColorStop(1, 'transparent')
    ctx.fillStyle = blueLight
    ctx.fillRect(0, 0, W, H)

    // Marble floor (light gray with veins)
    ctx.fillStyle = '#f8f8f8'
    ctx.fillRect(60, 60, W - 120, H - 120)
    ctx.strokeStyle = '#e0e0e8'
    ctx.lineWidth = 0.5
    for (let tx = 60; tx < W - 60; tx += 60) {
      ctx.beginPath(); ctx.moveTo(tx, 60); ctx.lineTo(tx, H - 60); ctx.stroke()
    }
    for (let ty = 60; ty < H - 60; ty += 60) {
      ctx.beginPath(); ctx.moveTo(60, ty); ctx.lineTo(W - 60, ty); ctx.stroke()
    }
    // Marble veins
    ctx.strokeStyle = '#d8d8e890'
    ctx.lineWidth = 0.8
    for (let vi = 0; vi < 8; vi++) {
      ctx.beginPath()
      ctx.moveTo(100 + vi * 120, 60)
      ctx.bezierCurveTo(80 + vi * 120, H * 0.3, 130 + vi * 120, H * 0.6, 110 + vi * 120, H - 60)
      ctx.stroke()
    }

    // Windows + morning light shafts
    drawWindow(ctx, 200, 62, 100, 55)
    drawWindow(ctx, 370, 62, 100, 55)
    drawWindow(ctx, 600, 62, 100, 55)
    // Morning light shafts
    const shaftAlpha = 0.06 + Math.sin(now / 4000) * 0.02
    for (const wx of [250, 420, 650]) {
      ctx.save()
      ctx.globalAlpha = shaftAlpha
      const shaft = ctx.createLinearGradient(wx, 120, wx + 60, H - 60)
      shaft.addColorStop(0, '#ffe8a0')
      shaft.addColorStop(1, 'transparent')
      ctx.fillStyle = shaft
      ctx.beginPath()
      ctx.moveTo(wx, 120); ctx.lineTo(wx + 60, 120)
      ctx.lineTo(wx + 130, H - 60); ctx.lineTo(wx - 70, H - 60)
      ctx.closePath(); ctx.fill()
      ctx.restore()
    }

    // Reception desk
    drawReceptionDesk(ctx, 300, 160, 220, 80)

    // Digital display board
    drawDigitalBoard(ctx, 680, 170, 160, 70, now)

    // Animated RECEPTION neon sign
    drawNeonSign(ctx, W / 2, 110, 'BUENA', '#4d96ff', now)

    // Waiting area
    drawCouch(ctx, 720, 240, 170, 80)
    drawPlant(ctx, 680, 195, true)
    drawPlant(ctx, 900, 360)

    // NPC decoration bichos sitting (just shapes)
    ctx.fillStyle = '#5a5a8a'
    ctx.beginPath(); ctx.arc(745, 265, 10, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#8a5a5a'
    ctx.beginPath(); ctx.arc(800, 265, 10, 0, Math.PI * 2); ctx.fill()

    // Floor mat
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
    ctx.fillStyle = f.carpetColor
    ctx.fillRect(60, 60, W - 120, H - 120)

    // Fluorescent cold white flicker (very subtle)
    const flickerAlpha = 0.03 + Math.sin(now / 100) * 0.005
    ctx.fillStyle = `rgba(200,220,255,${flickerAlpha})`
    ctx.fillRect(60, 60, W - 120, H - 120)

    // Cubicle dividers
    const divColor = '#7a8a9a'
    ctx.fillStyle = divColor
    ctx.fillRect(80, 240, W - 200, 8)
    ctx.fillRect(80, 370, W - 200, 8)
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
      // Monitor glow on carpet (blue puddle of light)
      const gx = ctx.createRadialGradient(d.x + 45, d.y + 90, 0, d.x + 45, d.y + 90, 35)
      gx.addColorStop(0, 'rgba(68,136,255,0.12)')
      gx.addColorStop(1, 'transparent')
      ctx.fillStyle = gx
      ctx.beginPath()
      ctx.ellipse(d.x + 45, d.y + 90, 35, 15, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Printer
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

    // "MEETING ROOM FULL" sign
    ctx.fillStyle = '#1a1a2e'
    drawRoundRect(ctx, 850, 70, 120, 22, 3); ctx.fill()
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 7px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('● MEETING ROOM FULL', 910, 85)

    // Wall of Fame
    if (topBichos.length > 0) {
      drawWallOfFame(ctx, W - 320, H - 180, 250, 120, topBichos)
    }

    // Windows
    drawWindow(ctx, 200, 62, 90, 50)
    drawWindow(ctx, 500, 62, 90, 50)

    // Plants casting shadow
    drawPlant(ctx, 850, 350, true)
    drawPlant(ctx, 140, 410)
  }

  // ── 2F: Boardroom ────────────────────────────────────────────────────────
  if (f.id === 3) {
    ctx.fillStyle = '#2a1a08'
    ctx.fillRect(60, 60, W - 120, H - 120)
    ctx.strokeStyle = '#3a2510'
    ctx.lineWidth = 1
    for (let wy = 80; wy < H - 60; wy += 20) {
      ctx.beginPath(); ctx.moveTo(60, wy); ctx.lineTo(W - 60, wy); ctx.stroke()
    }

    // Dramatic warm spotlights over table
    const tableX = 200 + 450 / 2
    const tableY = 200 + 180 / 2
    const spotIntensity = 0.15 + Math.sin(now / 3000) * 0.03
    const spotlight = ctx.createRadialGradient(tableX, tableY - 50, 0, tableX, tableY, 280)
    spotlight.addColorStop(0, `rgba(255,200,100,${spotIntensity})`)
    spotlight.addColorStop(1, 'transparent')
    ctx.fillStyle = spotlight
    ctx.fillRect(0, 0, W, H)

    // Whiteboard
    drawWhiteboard(ctx, 100, 80, 160, 90)

    // "DO NOT DISTURB" sign
    ctx.fillStyle = '#1a0a0a'
    drawRoundRect(ctx, 280, 80, 200, 24, 3); ctx.fill()
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 7px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🔴 DO NOT DISTURB — MEETING IN PROGRESS', 380, 96)

    // Panorama windows — night city view
    drawWindowNight(ctx, 350, 65, 80, 55)
    drawWindowNight(ctx, 460, 65, 80, 55)
    drawWindowNight(ctx, 570, 65, 80, 55)

    // Big boardroom table
    drawBoardroomTable(ctx, 200, 200, 450, 180)

    // Projector screen
    drawProjectorScreen(ctx, 680, 80, 160, 110, now)

    // Trophy shelf
    drawTrophyShelf(ctx, 100, 380, 100, 90, topBichos)

    // Soho House door
    ctx.fillStyle = sohoUnlocked ? '#c8a84a' : '#2a1a1a'
    drawRoundRect(ctx, W - 200, 80, 130, H - 140, 8)
    ctx.fill()
    ctx.strokeStyle = sohoUnlocked ? '#c8a84a' : '#444'
    ctx.lineWidth = 2
    ctx.stroke()
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
    ctx.fillStyle = '#1a0a1a'
    ctx.fillRect(60, 60, W - 120, H - 120)

    // Animated colored ambient lights
    const hueShift = (now / 30) % 360
    const ambient1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 250)
    ambient1.addColorStop(0, `hsla(${hueShift},70%,50%,0.12)`)
    ambient1.addColorStop(1, 'transparent')
    ctx.fillStyle = ambient1
    ctx.fillRect(0, 0, W, H)

    const ambient2 = ctx.createRadialGradient(W - 200, H - 150, 0, W - 200, H - 150, 300)
    ambient2.addColorStop(0, `hsla(${(hueShift + 150) % 360},70%,50%,0.10)`)
    ambient2.addColorStop(1, 'transparent')
    ctx.fillStyle = ambient2
    ctx.fillRect(0, 0, W, H)

    // Mirror ball disco dots
    drawMirrorBallDots(ctx, W, H, now)

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
    // Bottles
    const bottleColors = ['#f472b6', '#c084fc', '#60a5fa', '#4ade80', '#fb923c']
    for (let bi = 0; bi < 8; bi++) {
      const bx = 115 + bi * 38
      ctx.fillStyle = bottleColors[bi % bottleColors.length] + '88'
      ctx.fillRect(bx, 85, 12, 40)
      ctx.fillStyle = bottleColors[bi % bottleColors.length]
      ctx.fillRect(bx + 3, 82, 6, 8)
    }

    // Dancefloor with fog
    ctx.fillStyle = '#0f0f0f'
    drawRoundRect(ctx, 260, 260, 340, 200, 4); ctx.fill()
    const tileSize = 34
    const dColors = ['#f472b6', '#c084fc', '#fb923c', '#60a5fa', '#4ade80', '#fde68a']
    for (let tx = 0; tx < 10; tx++) {
      for (let ty = 0; ty < 6; ty++) {
        const c = dColors[(tx + ty) % dColors.length]
        const pulse = 0.15 + Math.sin(now / 800 + tx * 0.5 + ty * 0.3) * 0.10
        ctx.fillStyle = c + Math.round(pulse * 255).toString(16).padStart(2, '0')
        ctx.fillRect(262 + tx * tileSize, 262 + ty * tileSize, tileSize - 2, tileSize - 2)
      }
    }
    // Dancefloor glow
    ctx.strokeStyle = '#f472b640'
    ctx.lineWidth = 2
    drawRoundRect(ctx, 258, 258, 344, 204, 5); ctx.stroke()

    // Fog effect on dance floor
    for (let fi = 0; fi < 5; fi++) {
      const fogX = 270 + fi * 60 + Math.sin(now / 1500 + fi) * 20
      const fogY = 380 + Math.cos(now / 2000 + fi * 0.7) * 20
      ctx.save()
      ctx.globalAlpha = 0.06 + Math.sin(now / 1800 + fi) * 0.03
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(fogX, fogY, 40 + fi * 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Neon sign
    drawNeonSign(ctx, W / 2, 50, 'SOHO HOUSE', '#f472b6', now)

    // DJ booth
    drawDJBooth(ctx, 100, 280, 130, 80, now)

    // VIP rope
    drawVIPRope(ctx, W - 300, 220, 200)

    // Booths (right side)
    ctx.fillStyle = '#2a1020'
    drawRoundRect(ctx, W - 240, 100, 170, 130, 8); ctx.fill()
    ctx.fillStyle = '#3a1830'
    drawRoundRect(ctx, W - 236, 104, 162, 90, 6); ctx.fill()
    ctx.fillStyle = '#4a2040'
    drawRoundRect(ctx, W - 190, 130, 80, 45, 3); ctx.fill()

    // Ceiling spot lights
    const spotColors = ['#f472b6', '#c084fc', '#fb923c', '#60a5fa']
    for (let si = 0; si < 4; si++) {
      const sx = 200 + si * 160
      const sHue = (hueShift + si * 60) % 360
      ctx.fillStyle = '#333'
      ctx.beginPath(); ctx.arc(sx, 68, 8, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = `hsla(${sHue},80%,60%,0.5)`
      ctx.beginPath(); ctx.arc(sx, 68, 6, 0, Math.PI * 2); ctx.fill()
      // Beam
      ctx.save()
      const beam = ctx.createLinearGradient(sx, 68, sx + 30, H - 60)
      beam.addColorStop(0, `hsla(${sHue},80%,60%,0.12)`)
      beam.addColorStop(1, 'transparent')
      ctx.fillStyle = beam
      ctx.globalAlpha = 0.5 + Math.sin(now / 1000 + si) * 0.3
      ctx.beginPath()
      ctx.moveTo(sx - 4, 76); ctx.lineTo(sx + 4, 76)
      ctx.lineTo(sx + 80, H - 60); ctx.lineTo(sx - 80, H - 60)
      ctx.closePath(); ctx.fill()
      ctx.restore()
    }

    // Floor label
    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = '#f472b620'
    ctx.textAlign = 'center'
    ctx.fillText('🍸 SOHO HOUSE', W / 2, 80)
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
      drawGameRoom(ctx, obj.x, obj.y, obj.w, obj.h, obj.gameType, f.accentColor, near, now)
    }
  }

}

// ─── Main component ───────────────────────────────────────────────────────────

type OtherBicho = {
  id: string; name: string; x: number; y: number
  color: string; shape: string; bicho_score: number
  targetX: number; targetY: number; lastMove: number
  avatar_url?: string
}

type ScorePopup = { id: number; x: number; y: number; pts: number; createdAt: number }

export default function GameCanvas({ myBicho }: { myBicho: Bicho }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    px: FLOORS[0].spawnX,
    py: FLOORS[0].spawnY,
    speed: 200,
    keys: new Set<string>(),
    others: [] as OtherBicho[],
    bobOffset: 0,
    walkFrame: 0,
    lastWalkToggle: 0,
    isMoving: false,
    floorIndex: 0,
    transitioning: false,
    transitionAlpha: 0,
    interactPrompt: null as string | null,
    nearObject: null as string | null,
    completedChallenges: new Set<string>(),
    topBichos: [] as Array<{ name: string; color: string; score: number; avatar_url?: string }>,
  })
  const [floorIndex, setFloorIndex] = useState(0)
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set())
  stateRef.current.completedChallenges = completedChallenges
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)
  const [activeEncounter, setActiveEncounter] = useState<Bicho | null>(null)
  const [activeMiniGame, setActiveMiniGame] = useState<{ type: MiniGameType; withBicho: Bicho | null } | null>(null)
  const [encounterCooldowns] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(myBicho.bicho_score)
  const [interactHint, setInteractHint] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([])
  const popupIdRef = useRef(0)
  const sohoUnlocked = SOHO_UNLOCK_CHALLENGES.every(id => completedChallenges.has(id))
  const animRef = useRef<number>(0)
  const myAppearance = generateBicho(myBicho.name)

  // Among Us
  const {
    session: amongSession,
    myPlayer: amongMyPlayer,
    allPlayers: amongAllPlayers,
    bodies: amongBodies,
    chatMessages: amongChat,
    votes: amongVotes,
    myVote: amongMyVote,
    startGame: amongStartGame,
    beginTasksPhase: amongBeginTasks,
    killPlayer: amongKillPlayer,
    reportBody: amongReportBody,
    callEmergencyMeeting: amongEmergency,
    sendChatMessage: amongSendChat,
    castVote: amongCastVote,
  } = useAmongUs(myBicho.id, myBicho.name, myBicho.bicho_color)

  const [canKill, setCanKill] = useState(false)
  const [nearBodyId, setNearBodyId] = useState<string | null>(null)
  const nearVictimRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const amongSessionRef = useRef(amongSession)
  const amongMyPlayerRef = useRef(amongMyPlayer)
  const amongBodiesRef = useRef(amongBodies)
  const prevPhaseRef = useRef<import('@/hooks/useAmongUs').GamePhase | null>(null)
  amongSessionRef.current = amongSession
  amongMyPlayerRef.current = amongMyPlayer
  amongBodiesRef.current = amongBodies

  function spawnScorePopup(pts: number) {
    const s = stateRef.current
    const id = ++popupIdRef.current
    setScorePopups(prev => [...prev, { id, x: s.px, y: s.py - 30, pts, createdAt: Date.now() }])
    setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== id)), 1800)
  }

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
        avatar_url: b.avatar_url ?? undefined,
        targetX: 200 + (i % 5) * 120, targetY: 300 + Math.floor(i / 5) * 80,
        lastMove: 0,
      }))
    })
    // Fetch top 5 bichos for wall of fame
    supabase.from('bichos').select('name, bicho_color, bicho_score, avatar_url')
      .order('bicho_score', { ascending: false }).limit(5)
      .then(({ data }) => {
        if (data) stateRef.current.topBichos = data.map(b => ({
          name: b.name,
          color: b.bicho_color,
          score: b.bicho_score,
          avatar_url: b.avatar_url ?? undefined,
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
      // Among Us: K = kill, R = report
      if (e.key === 'k' || e.key === 'K') {
        const victim = nearVictimRef.current
        const player = amongMyPlayerRef.current
        const sess = amongSessionRef.current
        if (victim && player?.role === 'impostor' && player.is_alive && sess?.phase === 'tasks') {
          amongKillPlayer(victim.id, stateRef.current.floorIndex, victim.x, victim.y)
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        const bodies = amongBodiesRef.current
        const s = stateRef.current
        const player = amongMyPlayerRef.current
        const sess = amongSessionRef.current
        if (player?.is_alive && sess?.phase === 'tasks') {
          for (const body of bodies) {
            if (body.floor_index === s.floorIndex) {
              const dx = s.px - body.x
              const dy = s.py - body.y
              if (Math.sqrt(dx * dx + dy * dy) < 80) {
                amongReportBody(body.id)
                break
              }
            }
          }
        }
      }
      if (e.key === 'e' || e.key === 'E') {
        const s = stateRef.current
        const floor = FLOORS[s.floorIndex]
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

      const moving = s.keys.has('ArrowLeft') || s.keys.has('a') || s.keys.has('ArrowRight') || s.keys.has('d') || s.keys.has('ArrowUp') || s.keys.has('w') || s.keys.has('ArrowDown') || s.keys.has('s')
      s.isMoving = moving
      s.bobOffset = moving ? Math.sin(now / 180) * 4 : Math.sin(now / 600) * 1.5
      // Walk cycle: toggle every ~200ms while moving
      if (moving && now - s.lastWalkToggle > 200) {
        s.walkFrame = (s.walkFrame + 1) % 4
        s.lastWalkToggle = now
      } else if (!moving) {
        s.walkFrame = 0
      }

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

      // Among Us: kill detection + body detection
      {
        const sess = amongSessionRef.current
        const amPlayer = amongMyPlayerRef.current
        const bodies = amongBodiesRef.current
        const aliveOtherIds = new Set(
          (sess?.phase === 'tasks' || sess?.phase === 'meeting')
            ? [] // populated below
            : []
        )
        // Kill range detection (impostor only)
        let foundVictim: { id: string; x: number; y: number } | null = null
        if (amPlayer?.role === 'impostor' && amPlayer.is_alive && sess?.phase === 'tasks') {
          for (const npc of s.others) {
            const dx = s.px - npc.x
            const dy = s.py - npc.y
            if (Math.sqrt(dx * dx + dy * dy) < 60) {
              foundVictim = { id: npc.id, x: npc.x, y: npc.y }
              break
            }
          }
        }
        nearVictimRef.current = foundVictim
        const newCanKill = foundVictim !== null
        if (newCanKill !== canKill) setCanKill(newCanKill)

        // Body proximity detection
        let foundBodyId: string | null = null
        if (amPlayer?.is_alive && sess?.phase === 'tasks') {
          for (const body of bodies) {
            if (body.floor_index === s.floorIndex) {
              const dx = s.px - body.x
              const dy = s.py - body.y
              if (Math.sqrt(dx * dx + dy * dy) < 80) {
                foundBodyId = body.id
                break
              }
            }
          }
        }
        if (foundBodyId !== nearBodyId) setNearBodyId(foundBodyId)
        void aliveOtherIds
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
              avatar_url: npc.avatar_url,
            }
            setActiveEncounter(bichoData)
            break
          }
        }
      }

      // Interact hint
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
      drawFloor(ctx, floor, W, H, completedChallenges, sohoUnlocked, s.px, s.py, now, s.topBichos)

      // Among Us: draw bodies on current floor
      {
        const sess = amongSessionRef.current
        const bodies = amongBodiesRef.current
        if (sess && sess.phase !== 'lobby') {
          for (const body of bodies) {
            if (body.floor_index === s.floorIndex) {
              const bx = body.x
              const by = body.y
              const bc = body.victim_color || '#888'
              ctx.save()
              ctx.globalAlpha = 0.85
              ctx.translate(bx, by)
              ctx.rotate(Math.PI / 4)
              ctx.beginPath()
              ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2)
              ctx.fillStyle = bc
              ctx.fill()
              ctx.strokeStyle = 'rgba(0,0,0,0.6)'
              ctx.lineWidth = 1.5
              ctx.stroke()
              ctx.restore()
              // Draw X over body
              ctx.save()
              ctx.globalAlpha = 0.9
              ctx.strokeStyle = '#ff2222'
              ctx.lineWidth = 2.5
              ctx.beginPath()
              ctx.moveTo(bx - 8, by - 8); ctx.lineTo(bx + 8, by + 8)
              ctx.moveTo(bx + 8, by - 8); ctx.lineTo(bx - 8, by + 8)
              ctx.stroke()
              ctx.restore()
            }
          }
        }
      }

      // NPCs — filter dead players to ghosts in Among Us tasks phase
      {
        const sess = amongSessionRef.current
        const isAmongActive = sess && (sess.phase === 'tasks' || sess.phase === 'meeting')
        for (const npc of s.others) {
          const bob = Math.sin(now / 400 + npc.id.charCodeAt(0)) * 2
          const npcFrame = Math.floor(now / 300 + npc.id.charCodeAt(0)) % 4
          // Check if this NPC is dead in Among Us
          const isDeadInGame = isAmongActive &&
            amongAllPlayers.find(p => p.bicho_id === npc.id && !p.is_alive)
          ctx.save()
          if (isDeadInGame) ctx.globalAlpha = 0.25
          drawPlayerAvatar(ctx, npc.x, npc.y, 22, npc.color, npc.shape, npc.avatar_url, npc.name, false, npc.bicho_score, bob, npcFrame)
          ctx.restore()
        }
      }

      // Player
      {
        const amPlayer = amongMyPlayerRef.current
        const sess = amongSessionRef.current
        const isDead = amPlayer && !amPlayer.is_alive && sess && sess.phase !== 'lobby' && sess.phase !== 'ended'
        ctx.save()
        if (isDead) ctx.globalAlpha = 0.4
        drawPlayerAvatar(ctx, s.px, s.py, 28, myAppearance.color, myAppearance.shape, myBicho.avatar_url, myBicho.name, true, score, s.bobOffset, s.walkFrame)
        ctx.restore()
      }

      // Transition overlay
      if (s.transitionAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${s.transitionAlpha})`
        ctx.fillRect(0, 0, W, H)
      }

      // Floor label
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
  }, [myBicho, myAppearance, activeChallenge, activeEncounter, activeMiniGame, encounterCooldowns, completedChallenges, score, changeFloor, sohoUnlocked, canKill, nearBodyId, amongAllPlayers, amongKillPlayer, amongReportBody])

  async function handleChallengeComplete(answer: string, matchScore: number) {
    if (!activeChallenge) return
    await supabase.from('answers').insert({
      bicho_id: myBicho.id,
      level: floorIndex,
      question_key: activeChallenge.id,
      answer_text: answer || '(approached)',
    })
    const gained = activeChallenge.score + matchScore
    const total = score + gained
    await supabase.from('bichos').update({
      bicho_score: total,
      current_level: Math.max(myBicho.current_level, floorIndex + 1),
    }).eq('id', myBicho.id)
    myBicho.bicho_score = total
    setScore(total)
    spawnScorePopup(gained)
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

      {/* Floor indicator — glassmorphism */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 font-mono pointer-events-none">
        <div
          className="flex gap-1 px-2 py-2 rounded-2xl border"
          style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          {FLOORS.map((f, i) => (
            <div
              key={f.id}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: i === floorIndex ? f.accentColor + '30' : 'transparent',
                color: i === floorIndex ? f.accentColor : '#444',
                border: `1px solid ${i === floorIndex ? f.accentColor + '60' : 'transparent'}`,
              }}
            >
              {f.shortName}
            </div>
          ))}
        </div>
      </div>

      {/* Player HUD — glassmorphism card */}
      <div className="fixed top-4 left-4 font-mono flex flex-col gap-2">
        <div
          className="rounded-xl px-4 py-2.5 text-xs pointer-events-none border flex items-center gap-3"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          {/* Avatar thumbnail */}
          {myBicho.avatar_url ? (
            <img
              src={myBicho.avatar_url}
              alt={myBicho.name}
              className="w-7 h-7 rounded-full object-cover"
              style={{ outline: `1.5px solid ${floor.accentColor}` }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: myAppearance.color + '30', color: myAppearance.color }}
            >
              {myBicho.name[0]}
            </div>
          )}
          <div>
            <div className="font-bold" style={{ color: floor.accentColor }}>{myBicho.name.split(' ')[0]}</div>
            <div className="text-[#f472b6] text-xs">⚡ {score}</div>
          </div>
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

      {/* Todo list — glassmorphism */}
      <div className="fixed top-4 right-4 font-mono pointer-events-none max-w-[220px]">
        <div
          className="rounded-xl p-3 border"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-xs font-bold mb-1.5" style={{ color: floor.accentColor }}>
            {floor.name}
          </p>
          {/* Progress bar */}
          <div className="h-1 rounded-full bg-white/10 mb-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${floorChallenges.length > 0 ? (doneCount / floorChallenges.length) * 100 : 0}%`,
                backgroundColor: floor.accentColor,
              }}
            />
          </div>
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
          <div className="mt-1.5 text-xs text-gray-700 text-right">{doneCount}/{floorChallenges.length}</div>
          {doneCount === floorChallenges.length && (
            <div className="mt-2 pt-2 border-t border-white/10 text-xs text-center" style={{ color: floor.accentColor }}>
              Floor complete! ↑
            </div>
          )}
        </div>
      </div>

      {/* Interact hint */}
      {interactHint && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 font-mono pointer-events-none z-40">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: `1px solid ${floor.accentColor}40` }}>
            <span className="px-2 py-0.5 rounded-md text-xs font-black" style={{ background: floor.accentColor, color: '#000' }}>E</span>
            <span className="text-sm font-bold" style={{ color: '#fff' }}>{interactHint.replace('[E] ', '')}</span>
          </div>
        </div>
      )}

      {/* Score pop-up animations */}
      {scorePopups.map(popup => {
        const age = Date.now() - popup.createdAt
        const progress = age / 1800
        return (
          <div
            key={popup.id}
            className="fixed font-mono font-black pointer-events-none select-none"
            style={{
              left: popup.x,
              top: popup.y - progress * 60,
              transform: 'translateX(-50%)',
              color: '#4ade80',
              fontSize: '18px',
              opacity: Math.max(0, 1 - progress * 1.2),
              textShadow: '0 0 12px #4ade8080',
              transition: 'none',
            }}
          >
            +{popup.pts}
          </div>
        )
      })}

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

      {/* Among Us HUD */}
      <AmongUsHUD
        myPlayer={amongMyPlayer}
        session={amongSession}
        canKill={canKill}
        nearBody={nearBodyId !== null}
        onKill={() => {
          const victim = nearVictimRef.current
          if (victim && amongMyPlayer?.role === 'impostor' && amongMyPlayer.is_alive) {
            amongKillPlayer(victim.id, stateRef.current.floorIndex, victim.x, victim.y)
          }
        }}
        onReport={() => {
          if (nearBodyId) amongReportBody(nearBodyId)
        }}
        onEmergency={amongEmergency}
        onCallMeeting={amongEmergency}
      />

      {/* Among Us Overlay */}
      <AmongUsOverlay
        session={amongSession}
        myPlayer={amongMyPlayer}
        allPlayers={amongAllPlayers}
        chatMessages={amongChat}
        votes={amongVotes}
        myVote={amongMyVote}
        myBichoId={myBicho.id}
        onSendChat={amongSendChat}
        onCastVote={amongCastVote}
        onBeginTasks={amongBeginTasks}
        onStartGame={amongStartGame}
        prevPhase={prevPhaseRef.current}
      />

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
            spawnScorePopup(gained)
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
            if (points > 0) spawnScorePopup(points)
            setActiveMiniGame(null)
          }}
          onClose={() => setActiveMiniGame(null)}
        />
      )}
    </div>
  )
}
