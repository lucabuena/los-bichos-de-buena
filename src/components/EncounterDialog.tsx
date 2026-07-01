'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateBicho, BichoSVG } from '@/lib/bicho'
import { getQuestionsForZone, type PoolQuestion } from '@/lib/questionPool'
import type { Bicho } from '@/lib/supabase'

type Props = {
  withBicho: Bicho
  zone: string
  myBichoId: string
  onComplete: (weirdnessGained: number) => void
  onSkip: () => void
}

export default function EncounterDialog({ withBicho, zone, myBichoId, onComplete, onSkip }: Props) {
  const [questions] = useState<PoolQuestion[]>(() => getQuestionsForZone(zone, 4))
  const [selected, setSelected] = useState<PoolQuestion | null>(null)
  const [myAnswer, setMyAnswer] = useState('')
  const [theirAnswer, setTheirAnswer] = useState<string | null>(null)
  const [loadingTheir, setLoadingTheir] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const appearance = generateBicho(withBicho.name)

  async function handleSelectQuestion(q: PoolQuestion) {
    setSelected(q)
    setLoadingTheir(true)
    // Check if this person has answered this question before
    const { data } = await supabase
      .from('answers')
      .select('answer_text')
      .eq('bicho_id', withBicho.id)
      .eq('question_key', q.id)
      .limit(1)
      .maybeSingle()
    setTheirAnswer(data?.answer_text ?? null)
    setLoadingTheir(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !myAnswer.trim()) return
    setSaving(true)

    // Save my answer
    await supabase.from('answers').insert({
      bicho_id: myBichoId,
      level: 0,
      question_key: selected.id,
      answer_text: myAnswer.trim(),
    })

    // Update weirdness for both
    await supabase.from('bichos').update({
      bicho_score: withBicho.bicho_score + Math.floor(selected.score / 2),
    }).eq('id', withBicho.id)

    setSaving(false)
    setDone(true)
    setTimeout(() => onComplete(selected.score), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-[#0d0d0d] border border-gray-800 rounded-2xl max-w-lg w-full shadow-2xl font-mono overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Who */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-gray-900">
          <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance, size: 52 }) }} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="text-white font-black text-lg">{withBicho.name}</p>
            <p className="text-gray-600 text-xs">⚡ {withBicho.bicho_score} Weirdness · you ran into them</p>
          </div>
          <button onClick={onSkip} className="text-gray-700 hover:text-gray-500 text-xs self-start pt-1">
            ✕
          </button>
        </div>

        <div className="px-6 py-5">

          {/* Step 1: Frage wählen */}
          {!selected && (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">
                What do you ask {withBicho.name.split(' ')[0]}?
              </p>
              {questions.map(q => (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className="w-full text-left p-4 rounded-xl border border-gray-800 hover:border-gray-600 bg-[#111] hover:bg-[#1a1a1a] transition-all group"
                >
                  <p className="text-white text-sm leading-relaxed group-hover:text-white">
                    „{q.text}"
                  </p>
                  <p className="text-[#f472b6] text-xs mt-1.5">+{q.score} Weirdness</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Antwort geben + ihre Antwort */}
          {selected && !done && (
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <p className="text-white text-sm font-medium leading-relaxed">
                  „{selected.text}"
                </p>
              </div>

              {/* Ihre Antwort */}
              {loadingTheir ? (
                <div className="text-gray-700 text-xs animate-pulse">Loading {withBicho.name.split(' ')[0]}'s answer…</div>
              ) : theirAnswer ? (
                <div className="border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-2">
                    <span dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance, size: 18 }) }} />
                    {withBicho.name.split(' ')[0]} already answered this:
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed italic">„{theirAnswer}"</p>
                </div>
              ) : (
                <div className="border border-dashed border-gray-800 rounded-xl p-3 text-center">
                  <p className="text-gray-700 text-xs">{withBicho.name.split(' ')[0]} hasn't answered this yet.</p>
                </div>
              )}

              {/* Meine Antwort */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-gray-500 text-xs">And you? What's your answer?</p>
                <textarea
                  value={myAnswer}
                  onChange={e => setMyAnswer(e.target.value)}
                  placeholder={selected.placeholder}
                  rows={3}
                  autoFocus
                  className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] transition-colors placeholder-gray-700 resize-none text-sm"
                />
                <button
                  type="submit"
                  disabled={saving || !myAnswer.trim()}
                  className="w-full bg-[#4ade80] text-black font-black py-3 rounded-xl hover:bg-[#22c55e] transition-colors disabled:opacity-30"
                >
                  {saving ? '…' : `Answer +${selected.score} Weirdness`}
                </button>
              </form>

              <button onClick={() => setSelected(null)} className="w-full text-gray-700 text-xs hover:text-gray-500 py-1">
                ← choose a different question
              </button>
            </div>
          )}

          {/* Done */}
          {done && selected && (
            <div className="text-center py-6 space-y-2">
              <p className="text-4xl">💬</p>
              <p className="text-white font-black text-xl">+{selected.score} Weirdness</p>
              <p className="text-gray-500 text-sm">
                {withBicho.name.split(' ')[0]} also gets +{Math.floor(selected.score / 2)} points.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
