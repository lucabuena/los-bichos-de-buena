import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Bicho = {
  id: string
  name: string
  email: string
  bicho_color: string
  bicho_shape: string
  bicho_eyes: string
  current_level: number
  bicho_score: number
  created_at: string
}

export type Answer = {
  id: string
  bicho_id: string
  level: number
  question_key: string
  answer_text: string
  created_at: string
}
