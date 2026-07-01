'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Bicho } from '@/lib/supabase'
import { generateBicho, BichoSVG } from '@/lib/bicho'
import { LEVELS } from '@/lib/questions'

type BichoWithAnswers = Bicho & { answers?: { question_key: string; answer_text: string }[] }

export default function MapPage() {
  const router = useRouter()
  const [bichos, setBichos] = useState<BichoWithAnswers[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<BichoWithAnswers | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('bicho_id')
    setMyId(id)

    supabase.from('bichos').select('*').order('bicho_score', { ascending: false })
      .then(({ data }) => {
        if (data) setBichos(data)
        setLoading(false)
      })

    // Realtime updates
    const channel = supabase.channel('bichos-map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bichos' }, () => {
        supabase.from('bichos').select('*').order('bicho_score', { ascending: false })
          .then(({ data }) => { if (data) setBichos(data) })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function openBicho(b: BichoWithAnswers) {
    const { data } = await supabase.from('answers').select('question_key, answer_text').eq('bicho_id', b.id)
    setSelected({ ...b, answers: data || [] })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-[#4ade80] animate-pulse">Bichos gathering...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-mono">
      {/* Header */}
      <div className="border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-xl">Los Bichos de Buena</h1>
          <p className="text-gray-600 text-xs">{bichos.length} Bichos in the universe</p>
        </div>
        <button
          onClick={() => router.push('/game')}
          className="text-[#4ade80] text-sm border border-[#4ade80]/30 px-3 py-1.5 rounded-lg hover:bg-[#4ade80]/10 transition-colors"
        >
          Keep playing
        </button>
      </div>

      {/* Level legend */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto border-b border-gray-900">
        {LEVELS.map((l, i) => (
          <span
            key={l.id}
            className="text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: l.color + '20', color: l.color, border: `1px solid ${l.color}40` }}
          >
            L{i + 1} {l.title}
          </span>
        ))}
      </div>

      {/* Bichos grid */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {bichos.map(b => {
          const appearance = generateBicho(b.name)
          const isMe = b.id === myId
          const levelName = LEVELS[Math.min(b.current_level, LEVELS.length - 1)]
          return (
            <button
              key={b.id}
              onClick={() => openBicho(b)}
              className="flex flex-col items-center p-4 rounded-2xl border transition-all hover:scale-105 text-center"
              style={{
                backgroundColor: isMe ? appearance.color + '15' : '#111',
                borderColor: isMe ? appearance.color : '#1f2937',
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance, size: 64 }) }} />
              <p className="text-white text-sm font-bold mt-2 truncate w-full">{b.name}</p>
              <p className="text-gray-600 text-xs">{isMe ? 'you' : `L${b.current_level}`}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: levelName?.color || '#4ade80' }}>
                  ⚡ {b.bicho_score}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bicho detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#111] border border-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: generateBicho(selected.name), size: 60 }) }} />
              <div>
                <h2 className="text-white font-black text-xl">{selected.name}</h2>
                <p className="text-gray-500 text-sm">
                  Level {selected.current_level} · ⚡ {selected.bicho_score} Weirdness
                </p>
              </div>
            </div>

            {selected.answers && selected.answers.length > 0 ? (
              <div className="space-y-4">
                {selected.answers.map(a => {
                  const question = LEVELS.flatMap(l => l.questions).find(q => q.key === a.question_key)
                  return (
                    <div key={a.question_key} className="border border-gray-800 rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-2">{question?.text}</p>
                      <p className="text-white text-sm leading-relaxed">{a.answer_text}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center py-4">
                This Bicho hasn't answered any questions yet.
              </p>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full border border-gray-800 text-gray-400 py-2 rounded-xl hover:bg-gray-900 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
