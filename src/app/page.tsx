'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateBicho, BichoSVG } from '@/lib/bicho'

const DEMO_NAMES = ['Alex', 'Jordan', 'Sam', 'Riley', 'Morgan']
const DEMO_BICHOS = DEMO_NAMES.map(n => ({ name: n, appearance: generateBicho(n) }))

const HOW_IT_WORKS = [
  {
    icon: '🏢',
    title: 'Walk the office',
    desc: 'Your Bicho explores the building floor by floor — Kitchen, Reception, Cubicles, Boardroom.',
  },
  {
    icon: '✍️',
    title: 'Answer challenges',
    desc: 'Each floor has questions. Not "favourite colour" stuff — real, honest, specific ones.',
  },
  {
    icon: '🤝',
    title: 'Meet colleagues',
    desc: 'Run into other Bichos. Ask them a question, read their answer, earn Bicho Score.',
  },
  {
    icon: '🍸',
    title: 'Unlock Soho House',
    desc: 'Finish the whole office and a secret floor opens. Party questions only.',
  },
]

export default function Home() {
  const router = useRouter()
  const [step, setStep] = useState<'landing' | 'join'>('landing')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const preview = name.trim() ? generateBicho(name.trim()) : null

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')

    const appearance = generateBicho(name.trim())

    // Try to fetch Slack avatar silently — never blocks registration
    let avatar_url: string | null = null
    try {
      const res = await fetch(`/api/slack-avatar?email=${encodeURIComponent(email.trim().toLowerCase())}`)
      const json = await res.json()
      avatar_url = json.avatar_url ?? null
    } catch { /* ignore */ }

    const { data, error: err } = await supabase
      .from('bichos')
      .upsert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        bicho_color: appearance.color,
        bicho_shape: appearance.shape,
        bicho_eyes: appearance.eyes,
        current_level: 0,
        bicho_score: 0,
        ...(avatar_url ? { avatar_url } : {}),
      }, { onConflict: 'email' })
      .select()
      .single()

    if (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    localStorage.setItem('bicho_id', data.id)
    localStorage.setItem('bicho_name', data.name)
    router.push('/game')
  }

  if (step === 'join') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 font-mono">
        <div className="max-w-sm w-full">
          <button
            onClick={() => setStep('landing')}
            className="text-gray-600 text-xs mb-8 hover:text-gray-400 transition-colors"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 h-24 items-center">
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <div
                    dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance: preview, size: 80 }) }}
                    className="animate-bounce"
                    style={{ animationDuration: '2s' }}
                  />
                  <p className="text-gray-600 text-xs">your Bicho</p>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center">
                  <span className="text-gray-700 text-2xl">?</span>
                </div>
              )}
            </div>
            <h2 className="text-white font-black text-2xl mb-1">Create your Bicho</h2>
            <p className="text-gray-500 text-sm">Your Bicho is generated from your name — unique to you.</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] transition-colors placeholder-gray-600"
              maxLength={50}
              autoFocus
            />
            <input
              type="email"
              placeholder="Your Buena Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] transition-colors placeholder-gray-600"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="w-full bg-[#4ade80] text-black font-black py-3 rounded-xl hover:bg-[#22c55e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base mt-2"
            >
              {loading ? 'Loading your Bicho...' : "Let's go →"}
            </button>
          </form>

          <p className="text-center text-gray-700 text-xs mt-4">No passwords. No LinkedIn. Just truth.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] font-mono overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-[#4ade80] text-xs tracking-widest uppercase mb-4">Buena · Internal</p>
          <h1 className="text-6xl font-black text-white leading-none mb-2">Los Bichos</h1>
          <h2 className="text-6xl font-black text-[#4ade80] leading-none mb-8">de Buena</h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto">
            A game about getting to know the people you actually work with.<br />
            <span className="text-gray-600">The honest version.</span>
          </p>
        </div>

        {/* Demo Bichos */}
        <div className="flex justify-center gap-6 mb-16">
          {DEMO_BICHOS.map(({ name: n, appearance }) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div dangerouslySetInnerHTML={{ __html: BichoSVG({ appearance, size: 52 }) }} />
              <span className="text-gray-700 text-xs">{n}</span>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-16">
          <p className="text-gray-600 text-xs tracking-widest uppercase mb-6 text-center">How it works</p>
          <div className="grid grid-cols-2 gap-4">
            {HOW_IT_WORKS.map(s => (
              <div key={s.title} className="bg-[#111] border border-gray-800 rounded-2xl p-5">
                <div className="text-2xl mb-3">{s.icon}</div>
                <p className="text-white font-bold text-sm mb-1">{s.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Score explainer */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 mb-16">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚡</span>
            <p className="text-white font-bold">Bicho Score</p>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            You earn points by completing challenges and meeting colleagues.
            The more honestly you answer, the more you connect — and the higher your score climbs.
            Finish everything and you unlock the <span className="text-[#f472b6]">Soho House</span>.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => setStep('join')}
            className="bg-[#4ade80] text-black font-black px-10 py-4 rounded-2xl hover:bg-[#22c55e] transition-colors text-lg"
          >
            Create my Bicho →
          </button>
          <p className="text-gray-700 text-xs mt-4">No passwords. No LinkedIn. Just truth.</p>
        </div>

      </div>
    </main>
  )
}
