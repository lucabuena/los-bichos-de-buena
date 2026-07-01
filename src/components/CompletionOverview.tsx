'use client'

import { useEffect, useState } from 'react'
import { supabase, type Bicho } from '@/lib/supabase'
import { generateBicho, BichoSVG } from '@/lib/bicho'
import { ANSWER_CHALLENGE_IDS, FLOORS } from '@/lib/floors'

type Answer = { question_key: string; answer_text: string }

type CompletedBicho = Bicho & { answers: Answer[] }

// Map challenge ID to its question text
const QUESTION_MAP: Record<string, string> = Object.fromEntries(
  FLOORS.flatMap(f => f.challenges)
    .filter(c => c.question)
    .map(c => [c.id, c.question!])
)

// Floor badge per challenge ID
const FLOOR_BADGE: Record<string, { label: string; color: string }> = {
  ug_coffee: { label: 'Kitchen', color: '#4ade80' },
  ug_table: { label: 'Kitchen', color: '#4ade80' },
  ug_fridge: { label: 'Kitchen', color: '#4ade80' },
  eg_reception: { label: 'Reception', color: '#60a5fa' },
  og1_desk: { label: 'Cubicles', color: '#c084fc' },
  og1_printer: { label: 'Cubicles', color: '#c084fc' },
  og1_window: { label: 'Cubicles', color: '#c084fc' },
  og2_table: { label: 'Boardroom', color: '#fb923c' },
  og2_screen: { label: 'Boardroom', color: '#fb923c' },
  og2_window: { label: 'Boardroom', color: '#fb923c' },
  soho_bar: { label: 'Soho', color: '#f472b6' },
  soho_booth: { label: 'Soho', color: '#f472b6' },
  soho_dancefloor: { label: 'Soho', color: '#f472b6' },
}

export default function CompletionOverview({
  myBicho,
  onClose,
}: {
  myBicho: Bicho
  onClose: () => void
}) {
  const [myAnswers, setMyAnswers] = useState<Answer[]>([])
  const [completers, setCompleters] = useState<CompletedBicho[]>([])
  const [selected, setSelected] = useState<CompletedBicho | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch my own answers
      const { data: mine } = await supabase
        .from('answers')
        .select('question_key, answer_text')
        .eq('bicho_id', myBicho.id)
      setMyAnswers(mine || [])

      // Find all bichos who have answered all ANSWER_CHALLENGE_IDS
      const { data: allAnswers } = await supabase
        .from('answers')
        .select('bicho_id, question_key')
        .in('question_key', ANSWER_CHALLENGE_IDS)
      if (!allAnswers) { setLoading(false); return }

      // Group by bicho_id and count unique question_keys
      const byBicho: Record<string, Set<string>> = {}
      for (const row of allAnswers) {
        if (!byBicho[row.bicho_id]) byBicho[row.bicho_id] = new Set()
        byBicho[row.bicho_id].add(row.question_key)
      }
      const completerIds = Object.entries(byBicho)
        .filter(([, keys]) => ANSWER_CHALLENGE_IDS.every(id => keys.has(id)))
        .map(([id]) => id)
        .filter(id => id !== myBicho.id)

      if (completerIds.length === 0) { setLoading(false); return }

      const { data: bichos } = await supabase
        .from('bichos')
        .select('*')
        .in('id', completerIds)

      if (!bichos) { setLoading(false); return }

      // Fetch their answers too
      const { data: theirAnswers } = await supabase
        .from('answers')
        .select('bicho_id, question_key, answer_text')
        .in('bicho_id', completerIds)
        .in('question_key', ANSWER_CHALLENGE_IDS)

      const answersByBicho: Record<string, Answer[]> = {}
      for (const a of theirAnswers || []) {
        if (!answersByBicho[a.bicho_id]) answersByBicho[a.bicho_id] = []
        answersByBicho[a.bicho_id].push({ question_key: a.question_key, answer_text: a.answer_text })
      }

      setCompleters(bichos.map(b => ({ ...b, answers: answersByBicho[b.id] || [] })))
      setLoading(false)
    }
    load()
  }, [myBicho.id])

  const myAppearance = generateBicho(myBicho.name)

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col font-mono overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl">🏆 You did it.</h1>
          <p className="text-gray-500 text-sm mt-0.5">Every floor. Every challenge. Welcome to the club.</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-sm border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Back to game
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My profile */}
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="flex items-center gap-4 mb-5">
            <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: myAppearance, size: 56 }) }} />
            <div>
              <p className="text-white font-black text-xl">{myBicho.name}</p>
              <p className="text-sm" style={{ color: myAppearance.color }}>⚡ {myBicho.bicho_score} Bicho Score</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ANSWER_CHALLENGE_IDS.map(cid => {
              const answer = myAnswers.find(a => a.question_key === cid)
              const badge = FLOOR_BADGE[cid]
              const question = QUESTION_MAP[cid]
              return (
                <div key={cid} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: badge.color, backgroundColor: badge.color + '20' }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2 leading-relaxed">{question}</p>
                  {answer ? (
                    <p className="text-white text-sm leading-relaxed">{answer.answer_text}</p>
                  ) : (
                    <p className="text-gray-600 text-xs italic">No answer yet</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Other completers */}
        <div className="px-6 py-6">
          <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4">
            {loading ? 'Looking for other completers...' : completers.length === 0 ? 'No other completers yet — you\'re first 👑' : `${completers.length} other Bicho${completers.length > 1 ? 's' : ''} who went all the way`}
          </h2>

          {!loading && completers.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {completers.map(b => {
                const app = generateBicho(b.name)
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelected(selected?.id === b.id ? null : b)}
                    className="text-left bg-[#111] border rounded-2xl p-4 hover:border-gray-600 transition-all"
                    style={{ borderColor: selected?.id === b.id ? app.color : '#1f2937' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: app, size: 40 }) }} />
                      <div>
                        <p className="text-white font-bold text-sm">{b.name}</p>
                        <p className="text-xs" style={{ color: app.color }}>⚡ {b.bicho_score}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs">{selected?.id === b.id ? 'Click to collapse ↑' : 'Click to read their answers →'}</p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Expanded answers for selected completer */}
          {selected && (
            <div className="mt-4 border border-gray-700 rounded-2xl p-5 bg-[#0d0d0d]">
              <div className="flex items-center gap-3 mb-5">
                <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: generateBicho(selected.name), size: 44 }) }} />
                <div>
                  <p className="text-white font-black text-lg">{selected.name}</p>
                  <p className="text-gray-500 text-xs">⚡ {selected.bicho_score} Bicho Score</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ANSWER_CHALLENGE_IDS.map(cid => {
                  const answer = selected.answers.find(a => a.question_key === cid)
                  const badge = FLOOR_BADGE[cid]
                  const question = QUESTION_MAP[cid]
                  return (
                    <div key={cid} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: badge.color, backgroundColor: badge.color + '20' }}>{badge.label}</span>
                      </div>
                      <p className="text-gray-400 text-xs mb-2 leading-relaxed">{question}</p>
                      {answer ? (
                        <p className="text-white text-sm leading-relaxed">{answer.answer_text}</p>
                      ) : (
                        <p className="text-gray-600 text-xs italic">No answer</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
