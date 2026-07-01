'use client'

import { useEffect, useRef, useState } from 'react'
import type { GameSession, GamePlayer, ChatMessage, GamePhase } from '@/hooks/useAmongUs'

interface AmongUsOverlayProps {
  session: GameSession | null
  myPlayer: GamePlayer | null
  allPlayers: GamePlayer[]
  chatMessages: ChatMessage[]
  votes: Record<string, string | null>
  myVote: string | null | undefined
  myBichoId: string
  onSendChat: (msg: string) => void
  onCastVote: (id: string | null) => void
  onBeginTasks: () => void
  onStartGame: () => void
  prevPhase: GamePhase | null
}

function PlayerDot({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color || '#888',
        border: '2px solid rgba(255,255,255,0.3)',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

function Countdown({ votingEndsAt }: { votingEndsAt: string | null }) {
  const [remaining, setRemaining] = useState(120)
  useEffect(() => {
    if (!votingEndsAt) return
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(votingEndsAt).getTime() - Date.now()) / 1000))
      setRemaining(diff)
    }
    update()
    const id = setInterval(update, 500)
    return () => clearInterval(id)
  }, [votingEndsAt])
  const color = remaining <= 30 ? '#ff4444' : remaining <= 60 ? '#ffaa00' : '#88ff88'
  return (
    <span style={{ color, fontWeight: 'bold', fontFamily: 'monospace', fontSize: 20 }}>
      {remaining}s
    </span>
  )
}

export default function AmongUsOverlay({
  session,
  myPlayer,
  allPlayers,
  chatMessages,
  votes,
  myVote,
  myBichoId,
  onSendChat,
  onCastVote,
  onBeginTasks,
  onStartGame,
  prevPhase,
}: AmongUsOverlayProps) {
  const [chatInput, setChatInput] = useState('')
  const [showRoleReveal, setShowRoleReveal] = useState(false)
  const [roleRevealRole, setRoleRevealRole] = useState<'crewmate' | 'impostor'>('crewmate')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const prevPhaseRef = useRef<GamePhase | null>(null)

  // Role reveal when phase changes to tasks
  useEffect(() => {
    if (prevPhaseRef.current !== 'tasks' && session?.phase === 'tasks' && myPlayer) {
      setRoleRevealRole(myPlayer.role)
      setShowRoleReveal(true)
      const t = setTimeout(() => setShowRoleReveal(false), 4000)
      prevPhaseRef.current = 'tasks'
      return () => clearTimeout(t)
    }
    if (session?.phase) {
      prevPhaseRef.current = session.phase
    }
  }, [session?.phase, myPlayer])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Reset chat input when meeting starts
  useEffect(() => {
    if (session?.phase === 'meeting') {
      setChatInput('')
    }
  }, [session?.phase])

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendChat(chatInput.trim())
    setChatInput('')
  }

  if (!session) return null

  const { phase } = session
  const amAlive = myPlayer?.is_alive ?? true

  // Role reveal overlay
  if (showRoleReveal) {
    const isImpostor = roleRevealRole === 'impostor'
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: isImpostor ? 'rgba(80,0,0,0.97)' : 'rgba(0,20,40,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>{isImpostor ? '🔴' : '🔵'}</div>
        <div style={{
          fontSize: 36, fontWeight: 'bold', color: isImpostor ? '#ff4444' : '#44aaff',
          textTransform: 'uppercase', letterSpacing: 4, marginBottom: 16,
        }}>
          {isImpostor ? 'YOU ARE THE IMPOSTOR' : 'YOU ARE A CREWMATE'}
        </div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 500, textAlign: 'center' }}>
          {isImpostor
            ? "Don't get caught. Kill the crewmates. Sabotage everything."
            : 'Complete your tasks. Find the impostor. Trust no one.'}
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    )
  }

  // Game ended
  if (phase === 'ended') {
    const crewWin = session.winner === 'crewmates'
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: crewWin ? 'rgba(0,30,60,0.97)' : 'rgba(60,0,0,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>{crewWin ? '🎉' : '🔴'}</div>
        <div style={{
          fontSize: 48, fontWeight: 'bold',
          color: crewWin ? '#44ffaa' : '#ff4444',
          textTransform: 'uppercase', letterSpacing: 6, marginBottom: 16,
        }}>
          {crewWin ? 'CREWMATES WIN' : 'IMPOSTORS WIN'}
        </div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 40 }}>
          {crewWin ? 'The impostor was defeated.' : 'The impostors have taken over.'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300, width: '100%' }}>
          {allPlayers.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
            }}>
              <PlayerDot color={p.color || '#888'} />
              <span style={{ color: 'white', flex: 1 }}>{p.name || 'Unknown'}</span>
              <span style={{ color: p.role === 'impostor' ? '#ff4444' : '#44aaff', fontSize: 13 }}>
                {p.role === 'impostor' ? '🔴 IMPOSTOR' : '🔵 CREWMATE'}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onStartGame}
          style={{
            marginTop: 40, padding: '12px 32px',
            background: '#333', color: 'white', border: '1px solid #666',
            borderRadius: 8, fontSize: 16, cursor: 'pointer', fontFamily: 'monospace',
          }}
        >
          New Game
        </button>
      </div>
    )
  }

  // Lobby
  if (phase === 'lobby') {
    const isHost = allPlayers.length > 0 && allPlayers[0]?.bicho_id === myBichoId
    return (
      <div
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100,
          background: 'rgba(10,10,20,0.92)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12, padding: '16px 20px', fontFamily: 'monospace',
          color: 'white', minWidth: 220,
        }}
      >
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>
          Lobby
        </div>
        <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          {allPlayers.length} player{allPlayers.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {allPlayers.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlayerDot color={p.color || '#888'} size={20} />
              <span style={{ fontSize: 13 }}>{p.name || 'Unknown'}</span>
              {p.bicho_id === myBichoId && <span style={{ color: '#888', fontSize: 11 }}>(you)</span>}
            </div>
          ))}
        </div>
        {isHost && allPlayers.length >= 1 && (
          <button
            onClick={onBeginTasks}
            style={{
              width: '100%', padding: '10px 0',
              background: '#1a4a1a', color: '#44ff88',
              border: '1px solid #44ff88', borderRadius: 8,
              fontSize: 14, cursor: 'pointer', fontFamily: 'monospace',
              fontWeight: 'bold',
            }}
          >
            Start Game ▶
          </button>
        )}
        {!isHost && (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
            Waiting for host to start...
          </div>
        )}
      </div>
    )
  }

  // Meeting overlay
  if (phase === 'meeting') {
    const votingEndsAt = session.voting_ends_at
    const remaining = votingEndsAt
      ? Math.max(0, Math.floor((new Date(votingEndsAt).getTime() - Date.now()) / 1000))
      : 120
    const canVote = remaining <= 90 && amAlive && myVote === undefined
    const alivePlayers = allPlayers.filter(p => p.is_alive)
    const deadPlayers = allPlayers.filter(p => !p.is_alive)

    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(5,5,15,0.97)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'monospace', color: 'white',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b0000, #cc2200)',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              Emergency Meeting
            </div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>
              ☠️ {session.meeting_reason || 'Emergency meeting called!'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>TIME LEFT</div>
            <Countdown votingEndsAt={votingEndsAt} />
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
          {/* Chat */}
          <div style={{
            width: 320, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ padding: '8px 16px', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              Chat
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chatMessages.length === 0 && (
                <div style={{ color: '#444', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                  No messages yet...
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ fontSize: 13 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: msg.bicho_color || '#888', marginRight: 6, verticalAlign: 'middle' }} />
                  <span style={{ color: msg.bicho_color || '#aaa', fontWeight: 'bold', marginRight: 6 }}>{msg.bicho_name}:</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={amAlive ? 'Type a message...' : '👻 Dead players cannot chat'}
                disabled={!amAlive}
                style={{
                  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6, color: 'white', fontFamily: 'monospace', fontSize: 13,
                  outline: 'none',
                }}
              />
            </form>
          </div>

          {/* Players + voting */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {!amAlive && (
              <div style={{
                textAlign: 'center', padding: '12px 20px', marginBottom: 16,
                background: 'rgba(100,100,100,0.2)', borderRadius: 8,
                color: '#888', fontSize: 14,
              }}>
                👻 You are dead. You can observe but cannot vote.
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                Alive — {alivePlayers.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alivePlayers.map(p => {
                  const hasVoted = votes[p.bicho_id] !== undefined
                  const isMe = p.bicho_id === myBichoId
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                    }}>
                      <PlayerDot color={p.color || '#888'} size={28} />
                      <span style={{ flex: 1, fontSize: 15 }}>
                        {p.name || 'Unknown'}
                        {isMe && <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>(you)</span>}
                      </span>
                      {hasVoted && <span style={{ color: '#44ff88', fontSize: 18 }}>✓</span>}
                      {canVote && !isMe && (
                        <button
                          onClick={() => onCastVote(p.bicho_id)}
                          style={{
                            padding: '5px 14px', background: '#440000', color: '#ff6666',
                            border: '1px solid #ff4444', borderRadius: 6,
                            fontSize: 12, cursor: 'pointer', fontFamily: 'monospace',
                          }}
                        >
                          VOTE
                        </button>
                      )}
                      {myVote === p.bicho_id && (
                        <span style={{ color: '#ff4444', fontSize: 12 }}>← your vote</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {canVote && (
              <button
                onClick={() => onCastVote(null)}
                style={{
                  padding: '8px 20px', background: '#1a1a2a', color: '#888',
                  border: '1px solid #444', borderRadius: 6,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'monospace', marginBottom: 16,
                }}
              >
                Skip Vote
              </button>
            )}
            {myVote !== undefined && (
              <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                {myVote === null ? 'You skipped.' : `You voted. Waiting for others...`}
              </div>
            )}

            {deadPlayers.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                  Dead — {deadPlayers.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {deadPlayers.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px', opacity: 0.4,
                      borderRadius: 8, textDecoration: 'line-through',
                    }}>
                      <PlayerDot color={p.color || '#888'} size={24} />
                      <span style={{ fontSize: 13 }}>{p.name || 'Unknown'}</span>
                      <span style={{ fontSize: 11 }}>👻</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
