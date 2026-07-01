'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Bicho } from '@/lib/supabase'
import dynamic from 'next/dynamic'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

export default function GamePage() {
  const router = useRouter()
  const [bicho, setBicho] = useState<Bicho | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('bicho_id')
    if (!id) { router.push('/'); return }
    supabase.from('bichos').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (!data) { router.push('/'); return }
        setBicho(data)
      })
  }, [router])

  if (!bicho) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
        <div className="text-[#4ade80] animate-pulse text-sm">Your Bicho is entering the office...</div>
      </div>
    )
  }

  return <GameCanvas myBicho={bicho} />
}
