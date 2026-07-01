'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateBicho, BichoSVG } from '@/lib/bicho'
import type { Challenge } from '@/lib/floors'

type OtherAnswer = {
  bicho_id: string
  bicho_name: string
  bicho_color: string
  bicho_shape: string
  answer_text: string
}

type Props = {
  challenge: Challenge
  floorName: string
  myBichoId: string
  onComplete: (answer: string, matchScore: number) => void
  onClose: () => void
}

export default function ChallengeDialog({ challenge, floorName, myBichoId, onComplete, onClose }: Props) {
  const [step, setStep] = useState<'answer' | 'match' | 'result'>('answer')
  const [myAnswer, setMyAnswer] = useState('')
  const [otherAnswers, setOtherAnswers] = useState<OtherAnswer[]>([])
  const [shuffledBichos, setShuffledBichos] = useState<OtherAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [pairs, setPairs] = useState<Record<number, string>>({}) // answerIdx → bicho_id
  const [results, setResults] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!myAnswer.trim()) return
    setLoading(true)

    // Fetch other answers for this question
    const { data: answerRows } = await supabase
      .from('answers')
      .select('bicho_id, answer_text')
      .eq('question_key', challenge.id)
      .neq('bicho_id', myBichoId)
      .limit(10)

    if (!answerRows || answerRows.length < 2) {
      // Not enough others answered yet — skip matching
      await onComplete(myAnswer.trim(), 0)
      return
    }

    // Fetch bicho names for those answers
    const ids = answerRows.map(a => a.bicho_id)
    const { data: bichos } = await supabase
      .from('bichos')
      .select('id, name, bicho_color, bicho_shape')
      .in('id', ids)

    const merged: OtherAnswer[] = answerRows
      .map(a => {
        const b = bichos?.find(b => b.id === a.bicho_id)
        if (!b) return null
        return {
          bicho_id: b.id,
          bicho_name: b.name,
          bicho_color: b.bicho_color,
          bicho_shape: b.bicho_shape,
          answer_text: a.answer_text,
        }
      })
      .filter(Boolean) as OtherAnswer[]

    // Pick 3 random
    const shuffled = [...merged].sort(() => Math.random() - 0.5).slice(0, 3)
    setOtherAnswers(shuffled)
    setShuffledBichos([...shuffled].sort(() => Math.random() - 0.5))
    setLoading(false)
    setStep('match')
  }

  function handleSelectAnswer(idx: number) {
    if (results[idx] !== undefined) return // already resolved
    setSelectedAnswer(idx === selectedAnswer ? null : idx)
  }

  function handleSelectBicho(bichoId: string) {
    if (selectedAnswer === null) return
    // Remove any existing pair for this bicho
    const existing = Object.entries(pairs).find(([, id]) => id === bichoId)
    const next = { ...pairs }
    if (existing) delete next[parseInt(existing[0])]
    next[selectedAnswer] = bichoId
    setPairs(next)
    setSelectedAnswer(null)
  }

  function isPaired(bichoId: string) {
    return Object.values(pairs).includes(bichoId)
  }

  async function handleSubmitMatch() {
    setSaving(true)
    const newResults: Record<number, boolean> = {}
    let correct = 0
    for (const [idxStr, bichoId] of Object.entries(pairs)) {
      const idx = parseInt(idxStr)
      const isCorrect = otherAnswers[idx].bicho_id === bichoId
      newResults[idx] = isCorrect
      if (isCorrect) correct++
    }
    setResults(newResults)
    setStep('result')

    const matchScore = correct * Math.floor(challenge.score / 3)
    setSaving(false)
    // Delay so user sees results
    setTimeout(() => onComplete(myAnswer, matchScore), 2500)
  }

  const allPaired = Object.keys(pairs).length === otherAnswers.length && otherAnswers.length > 0
  const correctCount = Object.values(results).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={step === 'answer' ? onClose : undefined} />
      <div className="relative bg-[#0d0d0d] border border-gray-800 rounded-2xl max-w-lg w-full shadow-2xl font-mono overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-900">
          <div>
            <p className="text-xs text-gray-600 tracking-widest uppercase">{floorName}</p>
            <h3 className="text-white font-black text-base mt-0.5">{challenge.text}</h3>
          </div>
          <div className="flex gap-1.5">
            {['answer', 'match', 'result'].map((s, i) => (
              <div
                key={s}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: s === step ? '#4ade80' : (
                    ['answer', 'match', 'result'].indexOf(step) > i ? '#4ade8060' : '#333'
                  )
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-5">

          {/* ── Step 1: Deine Antwort ── */}
          {step === 'answer' && (
            <form onSubmit={handleAnswerSubmit} className="space-y-4">
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <p className="text-white leading-relaxed font-medium text-sm">
                  „{challenge.question}"
                </p>
              </div>
              <textarea
                value={myAnswer}
                onChange={e => setMyAnswer(e.target.value)}
                placeholder={challenge.placeholder}
                rows={4}
                autoFocus
                className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] transition-colors placeholder-gray-700 resize-none text-sm"
              />
              <button
                type="submit"
                disabled={loading || !myAnswer.trim()}
                className="w-full bg-[#4ade80] text-black font-black py-3 rounded-xl hover:bg-[#22c55e] transition-colors disabled:opacity-30"
              >
                {loading ? 'Loading colleagues...' : 'Continue →'}
              </button>
              <p className="text-gray-700 text-xs text-center">
                Then: match your colleagues' answers
              </p>
            </form>
          )}

          {/* ── Step 2: Matching ── */}
          {step === 'match' && (
            <div className="space-y-5">
              <p className="text-gray-400 text-xs text-center">
                Who said what? Click an answer, then the matching face.
              </p>

              {/* Answer cards */}
              <div className="space-y-2">
                <p className="text-gray-600 text-xs uppercase tracking-widest">Answers</p>
                {otherAnswers.map((a, idx) => {
                  const paired = pairs[idx]
                  const isSelected = selectedAnswer === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      className="w-full text-left p-3 rounded-xl border transition-all text-sm leading-relaxed"
                      style={{
                        borderColor: isSelected ? '#4ade80' : paired ? '#ffffff20' : '#333',
                        backgroundColor: isSelected ? '#4ade8015' : '#1a1a1a',
                        color: paired ? '#999' : '#e5e5e5',
                      }}
                    >
                      <span className="text-gray-600 mr-2">{idx + 1}.</span>
                      „{a.answer_text.length > 120 ? a.answer_text.slice(0, 120) + '…' : a.answer_text}"
                      {paired && (
                        <span className="ml-2 text-xs text-gray-600">
                          → {shuffledBichos.find(b => b.bicho_id === paired)?.bicho_name.split(' ')[0]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Bicho cards */}
              <div className="space-y-2">
                <p className="text-gray-600 text-xs uppercase tracking-widest">
                  {selectedAnswer !== null ? `Who wrote answer ${selectedAnswer + 1}?` : 'Select an answer first'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {shuffledBichos.map(b => {
                    const appearance = generateBicho(b.bicho_name)
                    const taken = isPaired(b.bicho_id)
                    const isTarget = selectedAnswer !== null
                    return (
                      <button
                        key={b.bicho_id}
                        onClick={() => handleSelectBicho(b.bicho_id)}
                        disabled={!isTarget && !taken}
                        className="flex flex-col items-center p-3 rounded-xl border transition-all"
                        style={{
                          borderColor: taken ? '#ffffff30' : isTarget ? '#4ade8060' : '#333',
                          backgroundColor: taken ? '#1a1a1a' : isTarget ? '#4ade8010' : '#111',
                          opacity: !isTarget && !taken ? 0.5 : 1,
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance, size: 44 }) }} />
                        <p className="text-white text-xs font-bold mt-1 truncate w-full text-center">
                          {b.bicho_name.split(' ')[0]}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={handleSubmitMatch}
                disabled={!allPaired || saving}
                className="w-full bg-[#f472b6] text-black font-black py-3 rounded-xl hover:bg-[#ec4899] transition-colors disabled:opacity-30"
              >
                {saving ? '...' : `Reveal (+${challenge.score} Weirdness)`}
              </button>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 'result' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-5xl font-black text-white">
                  {correctCount}/{otherAnswers.length}
                </p>
                <p className="text-gray-400 text-sm mt-1">correct matches</p>
                <p className="text-[#f472b6] font-bold text-lg mt-2">
                  +{challenge.score + correctCount * Math.floor(challenge.score / 3)} Weirdness
                </p>
              </div>

              <div className="space-y-2">
                {otherAnswers.map((a, idx) => {
                  const isCorrect = results[idx]
                  const guessedBicho = shuffledBichos.find(b => b.bicho_id === pairs[idx])
                  const appearance = generateBicho(a.bicho_name)
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl border text-xs"
                      style={{
                        borderColor: isCorrect ? '#4ade8040' : '#ff6b6b40',
                        backgroundColor: isCorrect ? '#4ade8010' : '#ff6b6b10',
                      }}
                    >
                      <span className="text-lg">{isCorrect ? '✓' : '✗'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-400 line-clamp-2 leading-relaxed">
                          „{a.answer_text.length > 80 ? a.answer_text.slice(0, 80) + '…' : a.answer_text}"
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance, size: 20 }) }} />
                          <span className="text-white font-bold">{a.bicho_name.split(' ')[0]}</span>
                          {!isCorrect && guessedBicho && (
                            <span className="text-gray-600">
                              (du: {guessedBicho.bicho_name.split(' ')[0]})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-gray-700 text-xs text-center animate-pulse">
                Saving…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
