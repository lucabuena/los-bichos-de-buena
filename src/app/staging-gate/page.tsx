'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function StagingGateInner() {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get('from') || '/'
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/staging-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, from }),
    })
    if (res.ok) {
      router.push(from)
    } else {
      setError('Wrong password.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono p-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-[#4ade80] text-xs tracking-widest uppercase mb-2">Staging</p>
        <h1 className="text-white font-black text-3xl mb-1">Los Bichos</h1>
        <p className="text-gray-600 text-sm mb-8">Internal testing only.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoFocus
            className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#4ade80] transition-colors placeholder-gray-600 text-center tracking-widest"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full bg-[#4ade80] text-black font-black py-3 rounded-xl hover:bg-[#22c55e] transition-colors disabled:opacity-30"
          >
            {loading ? '...' : 'Enter →'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function StagingGate() {
  return (
    <Suspense>
      <StagingGateInner />
    </Suspense>
  )
}
