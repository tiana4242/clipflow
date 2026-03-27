import { createClient } from '@supabase/supabase-js'
import type { User, Clip } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gfwszuvlskrfuwiqmkfg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaXBmbG93LWJhY2tlbmQiLCJpYXQiOjE3MjQyMjI4MDAsImV4cCI6MTc0NDgwMDgwMH0.8QKlJ6ZqJ3XQXJjZ3J4hQzR5dW9hN1hLd0VxY0JqN1d1M2F4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user as User | null
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function saveClip(clip: Omit<Clip, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('clips')
    .insert([clip])
    .select()
    .single()
  
  return { data, error }
}

export async function getUserClips(userId: string) {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
  
  return { data, error }
}