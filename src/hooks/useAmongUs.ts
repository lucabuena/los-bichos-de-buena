import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export type GamePhase = 'lobby' | 'tasks' | 'meeting' | 'voting' | 'ended'
export type PlayerRole = 'crewmate' | 'impostor'

export interface GameSession {
  id: string
  phase: GamePhase
  meeting_reason: string | null
  reporter_id: string | null
  body_id: string | null
  winner: string | null
  voting_ends_at: string | null
  task_bar_progress: number
}

export interface GamePlayer {
  id: string
  bicho_id: string
  role: PlayerRole
  is_alive: boolean
  name?: string
  color?: string
}

export interface Body {
  id: string
  victim_id: string
  killer_id: string
  floor_index: number
  x: number
  y: number
  reported: boolean
  victim_name?: string
  victim_color?: string
}

export interface ChatMessage {
  id: string
  bicho_id: string
  bicho_name: string
  bicho_color: string
  message: string
  created_at: string
}

export interface VoteResult {
  bicho_id: string | null // null = skip
  name: string
  votes: number
}

export function useAmongUs(myBichoId: string, myBichoName: string, myBichoColor: string) {
  const [session, setSession] = useState<GameSession | null>(null)
  const [myPlayer, setMyPlayer] = useState<GamePlayer | null>(null)
  const [allPlayers, setAllPlayers] = useState<GamePlayer[]>([])
  const [bodies, setBodies] = useState<Body[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [votes, setVotes] = useState<Record<string, string | null>>({})
  const [myVote, setMyVote] = useState<string | null | undefined>(undefined)
  const sessionRef = useRef<GameSession | null>(null)
  const allPlayersRef = useRef<GamePlayer[]>([])
  sessionRef.current = session
  allPlayersRef.current = allPlayers

  useEffect(() => {
    if (!myBichoId) return

    loadSession()

    const sessionSub = supabase
      .channel('game_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          const newSession = payload.new as GameSession
          if (newSession.phase !== 'ended') {
            setSession(newSession)
          } else {
            setSession(newSession)
          }
        }
      })
      .subscribe()

    const playersSub = supabase
      .channel('game_players_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players' }, () => {
        loadPlayers()
      })
      .subscribe()

    const bodiesSub = supabase
      .channel('bodies_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bodies' }, () => {
        loadBodies()
      })
      .subscribe()

    const chatSub = supabase
      .channel('meeting_chat_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meeting_chat' }, (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          setChatMessages(prev => [...prev, payload.new as ChatMessage])
        }
      })
      .subscribe()

    const votesSub = supabase
      .channel('votes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_votes' }, () => {
        loadVotes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sessionSub)
      supabase.removeChannel(playersSub)
      supabase.removeChannel(bodiesSub)
      supabase.removeChannel(chatSub)
      supabase.removeChannel(votesSub)
    }
  }, [myBichoId])

  async function loadSession() {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .not('phase', 'eq', 'ended')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setSession(data as GameSession)
      await joinSession(data.id)
    }
  }

  async function joinSession(sessionId: string) {
    await supabase.from('game_players').upsert(
      {
        session_id: sessionId,
        bicho_id: myBichoId,
        role: 'crewmate',
        is_alive: true,
      },
      { onConflict: 'session_id,bicho_id' }
    )
    await loadPlayers(sessionId)
    await loadBodies(sessionId)
    await loadVotes(sessionId)
  }

  async function loadPlayers(sessionId?: string) {
    const sid = sessionId || sessionRef.current?.id
    if (!sid) return
    const { data: players } = await supabase
      .from('game_players')
      .select('*, bichos(name, bicho_color)')
      .eq('session_id', sid)

    if (players) {
      const enriched: GamePlayer[] = players.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        bicho_id: p.bicho_id as string,
        role: p.role as PlayerRole,
        is_alive: p.is_alive as boolean,
        name: (p.bichos as { name?: string; bicho_color?: string } | null)?.name,
        color: (p.bichos as { name?: string; bicho_color?: string } | null)?.bicho_color,
      }))
      setAllPlayers(enriched)
      setMyPlayer(enriched.find((p) => p.bicho_id === myBichoId) || null)
    }
  }

  async function loadBodies(sessionId?: string) {
    const sid = sessionId || sessionRef.current?.id
    if (!sid) return
    const { data } = await supabase
      .from('bodies')
      .select('*, bichos!bodies_victim_id_fkey(name, bicho_color)')
      .eq('session_id', sid)
      .eq('reported', false)

    if (data) {
      setBodies(
        data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          victim_id: b.victim_id as string,
          killer_id: b.killer_id as string,
          floor_index: b.floor_index as number,
          x: b.x as number,
          y: b.y as number,
          reported: b.reported as boolean,
          victim_name: (b.bichos as { name?: string; bicho_color?: string } | null)?.name,
          victim_color: (b.bichos as { name?: string; bicho_color?: string } | null)?.bicho_color,
        }))
      )
    }
  }

  async function loadVotes(sessionId?: string) {
    const sid = sessionId || sessionRef.current?.id
    if (!sid) return
    const { data } = await supabase
      .from('meeting_votes')
      .select('voter_id, voted_for')
      .eq('session_id', sid)

    if (data) {
      const voteMap: Record<string, string | null> = {}
      for (const v of data as { voter_id: string; voted_for: string | null }[]) {
        voteMap[v.voter_id] = v.voted_for
      }
      setVotes(voteMap)
      if (voteMap[myBichoId] !== undefined) setMyVote(voteMap[myBichoId])
    }
  }

  async function startGame() {
    await supabase.from('game_sessions').update({ phase: 'ended' }).not('phase', 'eq', 'ended')

    const { data: newSession } = await supabase
      .from('game_sessions')
      .insert({ phase: 'lobby', task_bar_progress: 0 })
      .select()
      .single()

    if (!newSession) return

    await supabase.from('game_players').upsert(
      {
        session_id: newSession.id,
        bicho_id: myBichoId,
        role: 'crewmate',
        is_alive: true,
      },
      { onConflict: 'session_id,bicho_id' }
    )

    setSession(newSession as GameSession)
    await loadPlayers(newSession.id)
  }

  async function beginTasksPhase() {
    const sess = sessionRef.current
    if (!sess) return
    const players = allPlayersRef.current
    const playerIds = players.map((p) => p.bicho_id)
    const numImpostors = playerIds.length >= 7 ? 2 : 1
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
    const impostors = new Set(shuffled.slice(0, numImpostors))

    for (const p of players) {
      await supabase
        .from('game_players')
        .update({
          role: impostors.has(p.bicho_id) ? 'impostor' : 'crewmate',
          is_alive: true,
        })
        .eq('id', p.id)
    }

    await supabase.from('game_sessions').update({ phase: 'tasks' }).eq('id', sess.id)
    await loadPlayers()
  }

  async function killPlayer(
    victimId: string,
    floorIndex: number,
    victimX: number,
    victimY: number
  ) {
    const sess = sessionRef.current
    if (!sess || !myPlayer || myPlayer.role !== 'impostor' || !myPlayer.is_alive) return

    await supabase
      .from('game_players')
      .update({ is_alive: false })
      .eq('session_id', sess.id)
      .eq('bicho_id', victimId)

    await supabase.from('bodies').insert({
      session_id: sess.id,
      victim_id: victimId,
      killer_id: myBichoId,
      floor_index: floorIndex,
      x: victimX,
      y: victimY,
    })

    await checkWinConditions()
  }

  async function reportBody(bodyId: string) {
    const sess = sessionRef.current
    if (!sess || !myPlayer?.is_alive) return

    await supabase.from('bodies').update({ reported: true }).eq('id', bodyId)

    const body = bodies.find((b) => b.id === bodyId)
    const votingEndsAt = new Date(Date.now() + 120000).toISOString()

    await supabase
      .from('game_sessions')
      .update({
        phase: 'meeting',
        meeting_reason: `${body?.victim_name || 'Someone'} was found dead!`,
        reporter_id: myBichoId,
        body_id: body?.victim_id || null,
        voting_ends_at: votingEndsAt,
      })
      .eq('id', sess.id)
  }

  async function callEmergencyMeeting() {
    const sess = sessionRef.current
    if (!sess || !myPlayer?.is_alive) return
    const votingEndsAt = new Date(Date.now() + 120000).toISOString()
    await supabase
      .from('game_sessions')
      .update({
        phase: 'meeting',
        meeting_reason: `${myBichoName} called an emergency meeting!`,
        reporter_id: myBichoId,
        voting_ends_at: votingEndsAt,
      })
      .eq('id', sess.id)
  }

  async function sendChatMessage(message: string) {
    const sess = sessionRef.current
    if (!sess || !message.trim()) return
    await supabase.from('meeting_chat').insert({
      session_id: sess.id,
      bicho_id: myBichoId,
      bicho_name: myBichoName,
      bicho_color: myBichoColor,
      message: message.trim(),
    })
  }

  async function castVote(votedForId: string | null) {
    const sess = sessionRef.current
    if (!sess || myVote !== undefined) return
    setMyVote(votedForId)
    await supabase.from('meeting_votes').upsert(
      {
        session_id: sess.id,
        voter_id: myBichoId,
        voted_for: votedForId,
      },
      { onConflict: 'session_id,voter_id' }
    )

    await checkVoteCompletion()
  }

  async function checkVoteCompletion() {
    const sess = sessionRef.current
    if (!sess) return
    const { data: allVotes } = await supabase
      .from('meeting_votes')
      .select('*')
      .eq('session_id', sess.id)
    const alivePlayers = allPlayersRef.current.filter((p) => p.is_alive)
    if (!allVotes || allVotes.length < alivePlayers.length) return

    const tally: Record<string, number> = {}
    for (const v of allVotes as { voted_for: string | null }[]) {
      if (v.voted_for) tally[v.voted_for] = (tally[v.voted_for] || 0) + 1
    }

    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) {
      await supabase
        .from('game_sessions')
        .update({ phase: 'tasks' })
        .eq('id', sess.id)
    } else {
      const topVotes = sorted[0][1]
      const tied = sorted.filter((s) => s[1] === topVotes)

      if (tied.length > 1) {
        await supabase
          .from('game_sessions')
          .update({
            phase: 'tasks',
            meeting_reason: 'It was a tie. No one was ejected.',
          })
          .eq('id', sess.id)
      } else {
        const ejectedId = sorted[0][0]
        await supabase
          .from('game_players')
          .update({ is_alive: false })
          .eq('session_id', sess.id)
          .eq('bicho_id', ejectedId)
        const ejected = allPlayersRef.current.find((p) => p.bicho_id === ejectedId)
        const wasImpostor = ejected?.role === 'impostor'
        await supabase
          .from('game_sessions')
          .update({
            phase: 'tasks',
            meeting_reason: `${ejected?.name || 'Someone'} was ejected. They were ${wasImpostor ? 'AN IMPOSTOR 🔪' : 'NOT an impostor 😇'}.`,
          })
          .eq('id', sess.id)
      }
    }

    await supabase.from('meeting_votes').delete().eq('session_id', sess.id)
    setMyVote(undefined)
    await checkWinConditions()
  }

  async function checkWinConditions() {
    const sess = sessionRef.current
    if (!sess) return
    await loadPlayers()
    // Use ref since loadPlayers is async and state hasn't updated yet
    // We re-fetch directly
    const { data: players } = await supabase
      .from('game_players')
      .select('role, is_alive')
      .eq('session_id', sess.id)

    if (!players) return
    const alive = (players as { role: string; is_alive: boolean }[]).filter((p) => p.is_alive)
    const aliveImpostors = alive.filter((p) => p.role === 'impostor')
    const aliveCrewmates = alive.filter((p) => p.role === 'crewmate')

    if (aliveImpostors.length === 0) {
      await supabase
        .from('game_sessions')
        .update({ phase: 'ended', winner: 'crewmates' })
        .eq('id', sess.id)
    } else if (aliveImpostors.length >= aliveCrewmates.length) {
      await supabase
        .from('game_sessions')
        .update({ phase: 'ended', winner: 'impostors' })
        .eq('id', sess.id)
    }
  }

  return {
    session,
    myPlayer,
    allPlayers,
    bodies,
    chatMessages,
    votes,
    myVote,
    startGame,
    beginTasksPhase,
    killPlayer,
    reportBody,
    callEmergencyMeeting,
    sendChatMessage,
    castVote,
    reload: loadSession,
  }
}
