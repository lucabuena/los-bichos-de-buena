'use client'

import { useEffect, useState } from 'react'
import type { GamePlayer, GameSession } from '@/hooks/useAmongUs'

interface AmongUsHUDProps {
  myPlayer: GamePlayer | null
  session: GameSession | null
  canKill: boolean
  nearBody: boolean
  onKill: () => void
  onReport: () => void
  onEmergency: () => void
  onCallMeeting: () => void
}

const EMERGENCY_COOLDOWN_KEY = 'among_us_emergency_cooldown'
const EMERGENCY_COOLDOWN_MS = 60000

export default function AmongUsHUD({
  myPlayer,
  session,
  canKill,
  nearBody,
  onKill,
  onReport,
  onEmergency,
  onCallMeeting,
}: AmongUsHUDProps) {
  const [emergencyCooldown, setEmergencyCooldown] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem(EMERGENCY_COOLDOWN_KEY)
    if (stored) {
      const remaining = Math.max(0, Math.ceil((parseInt(stored) - Date.now()) / 1000))
      if (remaining > 0) setEmergencyCooldown(remaining)
    }
  }, [])

  useEffect(() => {
    if (emergencyCooldown <= 0) return
    const id = setInterval(() => {
      setEmergencyCooldown(prev => {
        const next = Math.max(0, prev - 1)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [emergencyCooldown])

  const handleEmergency = () => {
    if (emergencyCooldown > 0) return
    const expiresAt = Date.now() + EMERGENCY_COOLDOWN_MS
    localStorage.setItem(EMERGENCY_COOLDOWN_KEY, String(expiresAt))
    setEmergencyCooldown(60)
    onEmergency()
    onCallMeeting()
  }

  if (!session || session.phase === 'lobby' || session.phase === 'ended') return null
  if (session.phase !== 'tasks') return null

  const isImpostor = myPlayer?.role === 'impostor'
  const isAlive = myPlayer?.is_alive ?? true
  const progress = session.task_bar_progress ?? 0

  return (
    <>
      {/* Role badge — top left */}
      <div
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 200,
          background: isImpostor ? 'rgba(80,0,0,0.9)' : 'rgba(0,20,50,0.9)',
          border: `1px solid ${isImpostor ? '#ff4444' : '#4488ff'}`,
          borderRadius: 8, padding: '6px 14px',
          fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold',
          color: isImpostor ? '#ff4444' : '#4488ff',
          userSelect: 'none',
        }}
      >
        {isImpostor ? '🔴 IMPOSTOR' : '🔵 CREWMATE'}
        {!isAlive && ' — 👻 DEAD'}
      </div>

      {/* Task progress bar — bottom left */}
      <div
        style={{
          position: 'fixed', bottom: 80, left: 16, zIndex: 200,
          background: 'rgba(10,10,20,0.85)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, padding: '8px 14px',
          fontFamily: 'monospace', fontSize: 11, color: '#888',
          width: 180,
        }}
      >
        <div style={{ marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Tasks</div>
        <div style={{
          height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${Math.min(100, progress * 100)}%`,
            background: 'linear-gradient(90deg, #44ff88, #00cc66)',
            borderRadius: 4, transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ marginTop: 4, color: '#44ff88', fontSize: 12 }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Action buttons */}
      {isAlive && (
        <div
          style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 200, display: 'flex', gap: 12, alignItems: 'center',
          }}
        >
          {/* Kill button — impostor only */}
          {isImpostor && (
            <button
              onClick={onKill}
              disabled={!canKill}
              style={{
                padding: '10px 20px',
                background: canKill ? '#660000' : '#2a0000',
                color: canKill ? '#ff4444' : '#440000',
                border: `2px solid ${canKill ? '#ff4444' : '#330000'}`,
                borderRadius: 8, fontFamily: 'monospace', fontSize: 14,
                fontWeight: 'bold', cursor: canKill ? 'pointer' : 'not-allowed',
                animation: canKill ? 'killPulse 1s ease-in-out infinite' : 'none',
                transition: 'all 0.2s',
              }}
            >
              🔪 KILL [K]
            </button>
          )}

          {/* Report button */}
          {nearBody && (
            <button
              onClick={onReport}
              style={{
                padding: '10px 20px',
                background: '#4a0000',
                color: '#ffaaaa',
                border: '2px solid #ff6666',
                borderRadius: 8, fontFamily: 'monospace', fontSize: 14,
                fontWeight: 'bold', cursor: 'pointer',
                animation: 'reportFlash 0.7s ease-in-out infinite',
              }}
            >
              ☠️ REPORT [R]
            </button>
          )}

          {/* Emergency meeting */}
          <button
            onClick={handleEmergency}
            disabled={emergencyCooldown > 0}
            style={{
              padding: '10px 20px',
              background: emergencyCooldown > 0 ? '#1a1a1a' : '#2a1a00',
              color: emergencyCooldown > 0 ? '#555' : '#ffaa00',
              border: `2px solid ${emergencyCooldown > 0 ? '#333' : '#ff8800'}`,
              borderRadius: 8, fontFamily: 'monospace', fontSize: 14,
              fontWeight: 'bold',
              cursor: emergencyCooldown > 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🚨 EMERGENCY {emergencyCooldown > 0 ? `(${emergencyCooldown}s)` : ''}
          </button>
        </div>
      )}

      {!isAlive && (
        <div
          style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 200,
            background: 'rgba(40,40,40,0.85)',
            border: '1px solid #555',
            borderRadius: 8, padding: '10px 24px',
            fontFamily: 'monospace', fontSize: 15, color: '#888',
          }}
        >
          👻 You are dead — you can still move but cannot interact
        </div>
      )}

      <style>{`
        @keyframes killPulse {
          0%, 100% { box-shadow: 0 0 8px #ff4444; }
          50% { box-shadow: 0 0 20px #ff4444, 0 0 40px #880000; }
        }
        @keyframes reportFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </>
  )
}
