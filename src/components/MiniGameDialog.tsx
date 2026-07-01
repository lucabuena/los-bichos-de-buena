'use client'

// Run in Supabase SQL Editor:
// CREATE TABLE IF NOT EXISTS game_results (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, bicho_id uuid REFERENCES bichos(id), game_type text NOT NULL, result text NOT NULL, created_at timestamptz DEFAULT now());
// ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "read all" ON game_results FOR SELECT USING (true);
// CREATE POLICY "insert own" ON game_results FOR INSERT WITH CHECK (true);

import { useState, useEffect, useRef } from 'react'
import { supabase, type Bicho } from '@/lib/supabase'
import { generateBicho, BichoSVG } from '@/lib/bicho'

export type MiniGameType = 'tenant_or_colleague' | 'kiez_sorting' | 'speed_round' | 'plunger_challenge'

interface MiniGameDialogProps {
  gameType: MiniGameType
  currentBicho: Bicho
  encounteredBicho: Bicho | null
  onComplete: (pointsEarned: number) => void
  onClose: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 1: Mieter oder Kollege?
// ─────────────────────────────────────────────────────────────────────────────

type Message = { text: string; answer: 'tenant' | 'colleague'; reveal: string }

const MESSAGES: Message[] = [
  { text: 'Die Heizung macht Geräusche wie mein Ex. Bitte sofort jemanden schicken.', answer: 'tenant', reveal: 'Echter Mieter. Echte Nachricht. Echter Vergleich.' },
  { text: 'Hat jemand Oatly bestellt? Der Kühlschrank ist schon wieder leer und ich kann so nicht leben.', answer: 'colleague', reveal: 'Slack, #office-snacks, 9:47 Uhr.' },
  { text: 'Ich zahle keine Miete mehr bis das WLAN-Problem gelöst ist. Das Streamen funktioniert nicht.', answer: 'tenant', reveal: 'Kommt vor. Öfter als man denkt.' },
  { text: 'Wer war das mit dem Fisch in der Mikrowelle? Wir müssen reden.', answer: 'colleague', reveal: 'Slack, #general, 13:14 Uhr. Anhänger: 7 😑.' },
  { text: 'Der Briefkasten wurde von der Nachbarin sabotiert. Ich brauche einen Anwalt.', answer: 'tenant', reveal: 'Spoiler: die Nachbarin hat den Deckel nur zugemacht.' },
  { text: 'Standup fällt heute aus, ich muss dringend meine Sourdough-Starter füttern.', answer: 'colleague', reveal: 'War im Ernst so. Standup fiel aus.' },
  { text: 'Im Keller riecht es nach dem Ende der Welt. Bitte prüfen.', answer: 'tenant', reveal: 'Es war ein alter Käse. Wirklich.' },
  { text: 'Brauche jemanden für ein kurzes "alignment" zu meinem OKR-Framework, 15 min, urgent.', answer: 'colleague', reveal: 'Dieser Satz wurde in 2024 gesagt. Von einem echten Menschen.' },
  { text: 'Die Türklingel funktioniert nicht. Ich kann aber nichts bestellen, weil ich niemand nicht einlassen kann.', answer: 'tenant', reveal: 'Triple-Negation. Mieter 1, Grammatik 0.' },
  { text: 'Ich glaube ich bin async, sorry. Was habt ihr nochmal entschieden?', answer: 'colleague', reveal: 'Slack, #decisions, 2 Stunden nach dem Meeting.' },
  { text: 'Der Aufzug macht ein Geräusch als würde er atmen. Ich nehme ab jetzt die Treppe.', answer: 'tenant', reveal: 'Wir auch, ehrlich gesagt.' },
  { text: 'Hot take: Retrospektiven ohne Snacks sind eine Form von Gewalt.', answer: 'colleague', reveal: 'Slack, #random, upvoted 14 mal.' },
  { text: 'Mein Nachbar spielt täglich um 7 Uhr Geige. Ich brauche eine Entschädigung.', answer: 'tenant', reveal: 'Das Gericht hat übrigens den Nachbarn recht gegeben.' },
  { text: 'Kann ich remote von Lissabon arbeiten? Frage für einen Freund (ich bin der Freund).', answer: 'colleague', reveal: 'Er ist heute noch in Lissabon.' },
  { text: 'Die Wohnung riecht nach dem Vormieter. Bitte renovieren.', answer: 'tenant', reveal: 'Der Vormieter zog vor 4 Jahren aus.' },
]

function TenantOrColleagueGame({ onComplete, onClose }: { onComplete: (pts: number) => void; onClose: () => void }) {
  const [deck] = useState(() => [...MESSAGES].sort(() => Math.random() - 0.5).slice(0, 6))
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<'tenant' | 'colleague' | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const current = deck[idx]

  function guess(choice: 'tenant' | 'colleague') {
    if (picked) return
    setPicked(choice)
    if (choice === current.answer) setCorrect(c => c + 1)
  }

  function next() {
    if (idx + 1 >= deck.length) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setPicked(null)
    }
  }

  const score = correct === 6 ? 50 : correct >= 4 ? 35 : correct >= 2 ? 20 : 10

  if (done) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-4xl mb-4">{correct >= 5 ? '🏆' : correct >= 3 ? '👏' : '😬'}</p>
        <p className="text-white font-black text-2xl mb-1">{correct}/6 correct</p>
        <p className="text-gray-500 text-sm mb-6">
          {correct === 6 ? 'Perfect PropTech radar. You know exactly who writes what.' :
           correct >= 4 ? 'Solid. You get the vibe of day-to-day property management.' :
           correct >= 2 ? 'Honestly, the lines blur more often than you\'d think.' :
           'Tenants and colleagues: sometimes indistinguishable.'}
        </p>
        <p className="text-[#4ade80] font-bold mb-6">+{score} Bicho Score</p>
        <button onClick={() => onComplete(score)} className="w-full bg-[#4ade80] text-black font-black py-3 rounded-xl">
          Continue →
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-5">
        <span className="text-gray-600 text-xs">{idx + 1} / {deck.length}</span>
        <span className="text-[#4ade80] text-xs font-bold">{correct} correct</span>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 mb-6 min-h-[100px] flex items-center">
        <p className="text-white text-base leading-relaxed">"{current.text}"</p>
      </div>

      {!picked ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => guess('tenant')}
            className="py-4 rounded-xl border border-[#fb923c40] text-[#fb923c] font-bold hover:bg-[#fb923c15] transition-colors text-sm"
          >
            🏠 Tenant
          </button>
          <button
            onClick={() => guess('colleague')}
            className="py-4 rounded-xl border border-[#60a5fa40] text-[#60a5fa] font-bold hover:bg-[#60a5fa15] transition-colors text-sm"
          >
            💬 Colleague
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border text-center ${picked === current.answer ? 'border-[#4ade80] bg-[#4ade8015]' : 'border-[#f87171] bg-[#f8717115]'}`}>
            <p className="font-bold mb-1" style={{ color: picked === current.answer ? '#4ade80' : '#f87171' }}>
              {picked === current.answer ? '✓ Correct!' : '✗ Wrong —'} {current.answer === 'tenant' ? '🏠 Tenant' : '💬 Colleague'}
            </p>
            <p className="text-gray-400 text-xs">{current.reveal}</p>
          </div>
          <button onClick={next} className="w-full border border-gray-700 text-gray-300 py-3 rounded-xl hover:bg-gray-900 transition-colors text-sm font-bold">
            {idx + 1 >= deck.length ? 'See results →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 2: Kiez Sorting
// ─────────────────────────────────────────────────────────────────────────────

type Kiez = 'Prenzlauer Berg' | 'Kreuzberg' | 'Neukölln' | 'Mitte' | 'Friedrichshain' | 'Charlottenburg'

type KiezQuestion = { text: string; options: { label: string; kiez: Kiez }[] }

const KIEZ_QUESTIONS: KiezQuestion[] = [
  {
    text: 'Sonntagmorgen. Was passiert?',
    options: [
      { label: 'Brunch mit Reservierung, 11 Uhr', kiez: 'Prenzlauer Berg' },
      { label: 'Döner, kein Plan, irgendwie Neukölln', kiez: 'Neukölln' },
      { label: 'Noch wach vom Samstag, Watergate', kiez: 'Friedrichshain' },
      { label: 'Wochenmarkt + Flat White in Charlottenburg', kiez: 'Charlottenburg' },
    ],
  },
  {
    text: 'Dein ideales Büro-Setup?',
    options: [
      { label: 'Standing Desk, Kombucha, kein Fleisch im Kühlschrank', kiez: 'Prenzlauer Berg' },
      { label: 'Chaos, aber guter Kaffee und eine Playlist', kiez: 'Kreuzberg' },
      { label: 'Egal, ich arbeite sowieso aus Cafés', kiez: 'Neukölln' },
      { label: 'Penthouse-View, alles muss clean sein', kiez: 'Mitte' },
    ],
  },
  {
    text: 'Wie erklärt du Buena auf einer Party?',
    options: [
      { label: '"AI-powered PropTech Platform" und ich sage das gerne', kiez: 'Mitte' },
      { label: '"Wir helfen Vermietern, aber die netten"', kiez: 'Prenzlauer Berg' },
      { label: '"Basically Vermieter-Therapie, aber mit App"', kiez: 'Kreuzberg' },
      { label: '"Ich erklär das nicht, komm morgen ins Büro"', kiez: 'Friedrichshain' },
    ],
  },
  {
    text: 'Eine Wohnung zieht dich an, wenn…',
    options: [
      { label: '…sie Altbau ist mit Stuck und Parkett', kiez: 'Prenzlauer Berg' },
      { label: '…sie einen Hinterhof hat und irgendwie eine Geschichte', kiez: 'Kreuzberg' },
      { label: '…sie billig genug ist dass ich nicht darüber nachdenken muss', kiez: 'Neukölln' },
      { label: '…die Küche neu ist und die Adresse klingt gut', kiez: 'Charlottenburg' },
    ],
  },
  {
    text: 'Du bekommst unerwartet einen freien Nachmittag. Was machst du?',
    options: [
      { label: 'Spielplatz, Kind auf der Schulter, Flat White in der Hand', kiez: 'Prenzlauer Berg' },
      { label: 'Club-Mate, Park, irgendeinen Podcast der mich ärgert', kiez: 'Kreuzberg' },
      { label: 'Schlafen. Endlich.', kiez: 'Neukölln' },
      { label: 'Networking-Event. Nein, wirklich, ich mag die.', kiez: 'Mitte' },
    ],
  },
]

const KIEZ_DESCRIPTIONS: Record<Kiez, { emoji: string; desc: string; vibe: string }> = {
  'Prenzlauer Berg': {
    emoji: '🌿',
    desc: 'Du bist der Mensch mit dem Sourdough-Starter und dem sehr meinungsstarken Kinderwagen.',
    vibe: 'Organic, structured chaos, defensiv über deinen Matcha.',
  },
  'Kreuzberg': {
    emoji: '🎨',
    desc: 'Du redest offen über Systemkritik, kaufst aber trotzdem bei Rewe.',
    vibe: 'Authentisch, etwas laut, hat immer eine Meinung zum Stadtplan.',
  },
  'Neukölln': {
    emoji: '🌙',
    desc: 'Du lebst eigentlich erst ab 22 Uhr richtig. Du weißt wo der beste Döner ist und du teilst es nicht.',
    vibe: 'Entspannt, irgendwie beschäftigt, lebt gut ohne Erklärung.',
  },
  'Mitte': {
    emoji: '🏙️',
    desc: 'Dein Kalender ist eine Kunstform. Du kennst den Unterschied zwischen Networking und Freundschaft — manchmal.',
    vibe: 'Ambitious, polished, Lieblingsort: überall wo man gesehen wird.',
  },
  'Friedrichshain': {
    emoji: '🎉',
    desc: 'Du sagst "kurz noch" und meinst damit bis 6 Uhr früh. Dein Körper hat sich angepasst.',
    vibe: 'Energie, Lärm, ehrlich zu sich selbst um 4 Uhr morgens.',
  },
  'Charlottenburg': {
    emoji: '🥂',
    desc: 'Du hast eine Lieblingsbar in der man reden kann. Du meinst das nicht ironisch.',
    vibe: 'Qualität über Quantität, mag gute Dinge ohne Erklärungsdruck.',
  },
}

function KiezSortingGame({ currentBicho, onComplete, onClose }: { currentBicho: Bicho; onComplete: (pts: number) => void; onClose: () => void }) {
  const [answers, setAnswers] = useState<Kiez[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [result, setResult] = useState<Kiez | null>(null)
  const [others, setOthers] = useState<{ name: string; kiez: Kiez }[]>([])

  function pick(kiez: Kiez) {
    const next = [...answers, kiez]
    if (qIdx + 1 >= KIEZ_QUESTIONS.length) {
      // Count votes
      const counts: Record<string, number> = {}
      for (const k of next) counts[k] = (counts[k] || 0) + 1
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Kiez
      setResult(winner)
      // Save result
      supabase.from('game_results').upsert({
        bicho_id: currentBicho.id,
        game_type: 'kiez_sorting',
        result: winner,
      }, { onConflict: 'bicho_id,game_type' }).then(() => {
        // Fetch others
        supabase.from('game_results')
          .select('result, bichos(name)')
          .eq('game_type', 'kiez_sorting')
          .neq('bicho_id', currentBicho.id)
          .then(({ data }) => {
            if (data) {
              setOthers(data.map((r: { result: string; bichos: unknown }) => ({
                name: (r.bichos as { name: string } | null)?.name || '?',
                kiez: r.result as Kiez,
              })))
            }
          })
      })
    } else {
      setAnswers(next)
      setQIdx(i => i + 1)
    }
  }

  if (result) {
    const info = KIEZ_DESCRIPTIONS[result]
    return (
      <div className="px-6 py-6">
        <div className="text-center mb-6">
          <p className="text-5xl mb-3">{info.emoji}</p>
          <p className="text-white font-black text-2xl mb-1">{result}</p>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">{info.desc}</p>
          <p className="text-gray-600 text-xs italic">{info.vibe}</p>
        </div>

        {others.length > 0 && (
          <div className="border border-gray-800 rounded-xl p-4 mb-5">
            <p className="text-gray-600 text-xs uppercase tracking-widest mb-3">Where other Bichos end up</p>
            <div className="space-y-1.5">
              {others.slice(0, 6).map((o, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{o.name}</span>
                  <span className="text-gray-500">{KIEZ_DESCRIPTIONS[o.kiez]?.emoji} {o.kiez}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[#60a5fa] font-bold mb-4">+30 Bicho Score</p>
        <button onClick={() => onComplete(30)} className="w-full bg-[#60a5fa] text-black font-black py-3 rounded-xl">
          Continue →
        </button>
      </div>
    )
  }

  const q = KIEZ_QUESTIONS[qIdx]
  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-5">
        <span className="text-gray-600 text-xs">{qIdx + 1} / {KIEZ_QUESTIONS.length}</span>
        <div className="flex gap-1">
          {KIEZ_QUESTIONS.map((_, i) => (
            <div key={i} className={`w-6 h-1 rounded-full ${i < qIdx ? 'bg-[#60a5fa]' : i === qIdx ? 'bg-[#60a5fa80]' : 'bg-gray-800'}`} />
          ))}
        </div>
      </div>

      <p className="text-white font-bold text-lg mb-5">{q.text}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => pick(opt.kiez)}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-800 text-gray-300 hover:border-[#60a5fa] hover:text-white hover:bg-[#60a5fa10] transition-all text-sm"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 3: Speed Round
// ─────────────────────────────────────────────────────────────────────────────

type SpeedQuestion = { text: string; key: string }

const SPEED_QUESTIONS: SpeedQuestion[] = [
  { text: 'I have Slack on my phone and I check it after 8pm.', key: 'slack_after_8' },
  { text: 'I regularly eat lunch at my desk.', key: 'lunch_at_desk' },
  { text: 'I would relocate to another city for the right role.', key: 'relocate' },
  { text: 'I know the name of at least one person in the Property Management team.', key: 'knows_pm' },
  { text: 'I have asked a question in a meeting that was actually just a statement.', key: 'question_as_statement' },
  { text: 'I find retrospectives useful when they\'re well facilitated.', key: 'retros_useful' },
  { text: 'I have explained what PropTech is — at a party.', key: 'explained_proptech' },
  { text: 'I check emails on weekends. Just briefly.', key: 'weekend_email' },
]

function SpeedRoundGame({ currentBicho, encounteredBicho, onComplete, onClose }: {
  currentBicho: Bicho
  encounteredBicho: Bicho | null
  onComplete: (pts: number) => void
  onClose: () => void
}) {
  const [deck] = useState(() => [...SPEED_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 6))
  const [myAnswers, setMyAnswers] = useState<Record<string, boolean>>({})
  const [theirAnswers, setTheirAnswers] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submitAndCompare(answers: Record<string, boolean>) {
    setLoading(true)
    // Save my answers
    await Promise.all(
      Object.entries(answers).map(([key, val]) =>
        supabase.from('game_results').upsert({
          bicho_id: currentBicho.id,
          game_type: `speed_${key}`,
          result: val ? 'yes' : 'no',
        }, { onConflict: 'bicho_id,game_type' })
      )
    )
    // Fetch their answers if we have an encountered bicho
    if (encounteredBicho) {
      const keys = deck.map(q => `speed_${q.key}`)
      const { data } = await supabase
        .from('game_results')
        .select('game_type, result')
        .eq('bicho_id', encounteredBicho.id)
        .in('game_type', keys)
      if (data) {
        const their: Record<string, boolean> = {}
        for (const row of data) {
          const k = row.game_type.replace('speed_', '')
          their[k] = row.result === 'yes'
        }
        setTheirAnswers(their)
      }
    }
    setLoading(false)
    setDone(true)
  }

  function answer(key: string, val: boolean) {
    const next = { ...myAnswers, [key]: val }
    setMyAnswers(next)
    if (Object.keys(next).length >= deck.length) {
      submitAndCompare(next)
    }
  }

  const matchCount = done ? deck.filter(q => myAnswers[q.key] === theirAnswers[q.key] && theirAnswers[q.key] !== undefined).length : 0
  const hasTheirData = Object.keys(theirAnswers).length > 0
  const matchPct = hasTheirData ? Math.round((matchCount / deck.filter(q => theirAnswers[q.key] !== undefined).length) * 100) : 0

  if (loading) {
    return <div className="px-6 py-12 text-center text-gray-500 text-sm animate-pulse">Calculating…</div>
  }

  if (done) {
    const score = hasTheirData ? (matchPct >= 80 ? 50 : matchPct >= 60 ? 35 : matchPct >= 40 ? 25 : 15) : 20
    const app = encounteredBicho ? generateBicho(encounteredBicho.name) : null

    return (
      <div className="px-6 py-6">
        {hasTheirData && app && encounteredBicho ? (
          <>
            <div className="text-center mb-6">
              <div className="flex justify-center gap-4 items-center mb-4">
                <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: generateBicho(currentBicho.name), size: 44 }) }} />
                <p className="text-white font-black text-3xl">{matchPct}%</p>
                <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: app, size: 44 }) }} />
              </div>
              <p className="text-white font-bold mb-1">
                {matchPct >= 80 ? 'Practically the same person.' : matchPct >= 60 ? 'More in common than expected.' : matchPct >= 40 ? 'More alike than you think.' : 'Completely different people. That\'s good.'}
              </p>
              <p className="text-gray-500 text-xs">mit {encounteredBicho.name.split(' ')[0]}</p>
            </div>

            <div className="space-y-2 mb-6">
              {deck.map(q => {
                const mine = myAnswers[q.key]
                const theirs = theirAnswers[q.key]
                const match = theirs !== undefined && mine === theirs
                return (
                  <div key={q.key} className={`flex items-start gap-3 p-3 rounded-xl ${match ? 'bg-[#4ade8010]' : 'bg-[#1a1a1a]'}`}>
                    <span className="text-xs mt-0.5">{match ? '✓' : '·'}</span>
                    <p className="text-gray-400 text-xs flex-1 leading-relaxed">{q.text}</p>
                    <div className="flex flex-col gap-0.5 items-end flex-shrink-0">
                      <span className="text-xs text-gray-600">You: {mine ? 'Yes' : 'No'}</span>
                      {theirs !== undefined && <span className="text-xs" style={{ color: app.color }}>{encounteredBicho.name.split(' ')[0]}: {theirs ? 'Ja' : 'Nein'}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="mb-6">
            <p className="text-white font-bold text-center mb-2">Answers saved!</p>
            <p className="text-gray-500 text-sm text-center mb-4">When others play this game, you'll see your match percentage with them.</p>
            <div className="space-y-2">
              {deck.map(q => (
                <div key={q.key} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl">
                  <p className="text-gray-400 text-xs flex-1 leading-relaxed mr-3">{q.text}</p>
                  <span className="text-[#c084fc] text-xs font-bold flex-shrink-0">{myAnswers[q.key] ? 'Yes' : 'No'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[#c084fc] font-bold mb-4">+{score} Bicho Score</p>
        <button onClick={() => onComplete(score)} className="w-full bg-[#c084fc] text-black font-black py-3 rounded-xl">
          Continue →
        </button>
      </div>
    )
  }

  const answered = Object.keys(myAnswers).length
  const currentQ = deck[answered]

  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-5">
        <span className="text-gray-600 text-xs">{answered + 1} / {deck.length}</span>
        {encounteredBicho && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs">vs.</span>
            <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: generateBicho(encounteredBicho.name), size: 20 }) }} />
            <span className="text-gray-500 text-xs">{encounteredBicho.name.split(' ')[0]}</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-6">
        {deck.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i < answered ? 'bg-[#c084fc]' : i === answered ? 'bg-[#c084fc50]' : 'bg-gray-800'}`} />
        ))}
      </div>

      <p className="text-white font-bold text-base leading-relaxed mb-6">{currentQ.text}</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => answer(currentQ.key, true)}
          className="py-4 rounded-xl border border-[#4ade8040] text-[#4ade80] font-bold hover:bg-[#4ade8015] transition-colors"
        >
          ✓ Yes
        </button>
        <button
          onClick={() => answer(currentQ.key, false)}
          className="py-4 rounded-xl border border-[#f8717140] text-[#f87171] font-bold hover:bg-[#f8717115] transition-colors"
        >
          ✗ No
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 4: Plunger Challenge
// ─────────────────────────────────────────────────────────────────────────────

function PlungerGame({ onComplete, onClose }: { onComplete: (pts: number) => void; onClose: () => void }) {
  const GOAL = 15
  const TIME_LIMIT = 5000

  const [pumps, setPumps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [phase, setPhase] = useState<'playing' | 'win' | 'fail'>('playing')
  const [plungerDown, setPlungerDown] = useState(false)
  const [wobble, setWobble] = useState(false)
  const startedAt = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef(false)

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      const remaining = Math.max(0, TIME_LIMIT - elapsed)
      setTimeLeft(remaining)
      if (remaining === 0 && !doneRef.current) {
        doneRef.current = true
        setPhase('fail')
        clearInterval(timerRef.current!)
      }
    }, 50)
    return () => clearInterval(timerRef.current!)
  }, [])

  function pump() {
    if (phase !== 'playing') return
    setPlungerDown(true)
    setWobble(true)
    setTimeout(() => setPlungerDown(false), 80)
    setTimeout(() => setWobble(false), 200)

    setPumps(p => {
      const next = p + 1
      if (next >= GOAL && !doneRef.current) {
        doneRef.current = true
        clearInterval(timerRef.current!)
        setPhase('win')
      }
      return next
    })
  }

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') { e.preventDefault(); pump() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const progress = Math.min(pumps / GOAL, 1)
  const pct = Math.round(progress * 100)
  const timeLeftSec = (timeLeft / 1000).toFixed(1)
  const progressColor = progress < 0.4 ? '#60a5fa' : progress < 0.75 ? '#fb923c' : '#f87171'

  if (phase === 'win') {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-6xl mb-3" style={{ animation: 'none' }}>🎉</p>
        <p className="text-white font-black text-2xl mb-2">SUCCESS!</p>
        <p className="text-[#4ade80] text-lg font-bold mb-1">Toilet unclogged!!</p>
        <p className="text-gray-500 text-sm mb-6">You pumped {pumps}x and saved the day.</p>
        <p className="text-[#4ade80] font-bold mb-6">+10 Bicho Score</p>
        <button onClick={() => onComplete(10)} className="w-full bg-[#4ade80] text-black font-black py-3 rounded-xl text-lg">
          Continue →
        </button>
      </div>
    )
  }

  if (phase === 'fail') {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-6xl mb-3">💩</p>
        <p className="text-white font-black text-2xl mb-2">CATASTROPHE!</p>
        <p className="text-[#f87171] text-base font-bold mb-1">The toilet is overflowing!!</p>
        <p className="text-gray-500 text-sm mb-2">Only {pumps}/{GOAL} pumps. Not enough.</p>
        <p className="text-gray-600 text-xs mb-6 italic">"Please come to the kitchen immediately. Bring towels."</p>
        <p className="text-gray-500 font-bold mb-6">+0 Bicho Score</p>
        <button onClick={() => onComplete(0)} className="w-full border border-gray-700 text-gray-300 font-black py-3 rounded-xl">
          Walk away in shame →
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 select-none" onClick={pump}>
      {/* Dramatic header */}
      <div className="text-center mb-4">
        <p className={`font-black text-lg ${wobble ? 'text-[#f87171]' : 'text-white'} transition-colors`}>
          THE TOILET IS BLOCKED!!
        </p>
        <p className="text-gray-600 text-xs">SPACE or tap to pump</p>
      </div>

      {/* Toilet + Plunger visual */}
      <div className="flex justify-center items-end gap-4 mb-6 h-28">
        {/* Toilet */}
        <div className="text-center">
          <div className={`text-6xl transition-transform ${wobble ? 'scale-110' : 'scale-100'}`} style={{ filter: progress > 0.7 ? 'hue-rotate(30deg) saturate(2)' : 'none' }}>
            🚽
          </div>
          {progress > 0.6 && (
            <div className="text-xs text-[#f87171] font-bold animate-pulse mt-1">⚠️ Kritisch!</div>
          )}
        </div>

        {/* Plunger animation */}
        <div className="flex flex-col items-center justify-end h-full">
          <div className={`text-4xl transition-transform duration-75 ${plungerDown ? 'translate-y-3' : '-translate-y-1'}`}>
            🪠
          </div>
          <div className="text-gray-700 text-xs mt-1">{pumps}x</div>
        </div>
      </div>

      {/* Blockage progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 font-bold uppercase tracking-widest">Blockage</span>
          <span className="font-bold" style={{ color: progressColor }}>{pct}%</span>
        </div>
        <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, #60a5fa, ${progressColor})`,
              boxShadow: wobble ? `0 0 12px ${progressColor}` : 'none',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-700">
          <span>{pumps}/{GOAL} Pumps</span>
          <span className={parseFloat(timeLeftSec) < 2 ? 'text-[#f87171] font-bold animate-pulse' : ''}>{timeLeftSec}s</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden mt-3">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(timeLeft / TIME_LIMIT) * 100}%`,
            background: timeLeft < 2000 ? '#f87171' : timeLeft < 3500 ? '#fb923c' : '#4ade80',
          }}
        />
      </div>

      <p className="text-center text-gray-700 text-xs mt-4">👆 Tap fast!</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function MiniGameDialog({ gameType, currentBicho, encounteredBicho: encounteredBichoProp, onComplete, onClose }: MiniGameDialogProps) {
  const [encounteredBicho, setEncounteredBicho] = useState<Bicho | null>(encounteredBichoProp)

  useEffect(() => {
    if (encounteredBichoProp) return
    supabase.from('bichos').select('*').neq('id', currentBicho.id).limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) setEncounteredBicho(data[Math.floor(Math.random() * data.length)])
      })
  }, [encounteredBichoProp, currentBicho.id])

  const META: Record<MiniGameType, { title: string; subtitle: string; accent: string }> = {
    tenant_or_colleague: { title: 'Tenant or Colleague?', subtitle: 'Who wrote this?', accent: '#fb923c' },
    kiez_sorting: { title: 'Kiez Sorting', subtitle: 'Which Berlin hood are you?', accent: '#60a5fa' },
    speed_round: { title: 'Speed Round', subtitle: encounteredBicho ? `How similar are you to ${encounteredBicho.name.split(' ')[0]}?` : 'How do you really tick?', accent: '#c084fc' },
    plunger_challenge: { title: 'Toilet Emergency 🚽', subtitle: 'Pump for your life!', accent: '#4ade80' },
  }

  const { title, subtitle, accent } = META[gameType]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d0d] border border-gray-800 rounded-2xl max-w-lg w-full shadow-2xl font-mono overflow-hidden max-h-[92vh] overflow-y-auto">

        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-gray-900">
          <div className="flex-1">
            <p className="font-black text-lg" style={{ color: accent }}>{title}</p>
            <p className="text-gray-600 text-xs">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-500 text-xs self-start pt-1">✕</button>
        </div>

        {gameType === 'tenant_or_colleague' && (
          <TenantOrColleagueGame onComplete={onComplete} onClose={onClose} />
        )}
        {gameType === 'kiez_sorting' && (
          <KiezSortingGame currentBicho={currentBicho} onComplete={onComplete} onClose={onClose} />
        )}
        {gameType === 'speed_round' && (
          <SpeedRoundGame currentBicho={currentBicho} encounteredBicho={encounteredBicho} onComplete={onComplete} onClose={onClose} />
        )}
        {gameType === 'plunger_challenge' && (
          <PlungerGame onComplete={onComplete} onClose={onClose} />
        )}
      </div>
    </div>
  )
}
