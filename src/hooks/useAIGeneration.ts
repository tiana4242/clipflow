import { useState } from 'react'

export function useAIGeneration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTitles = async (videoContext: string, count: number = 3): Promise<string[]> => {
    setLoading(true)
    setError(null)
    
    try {
      // Call your backend API that interfaces with OpenAI
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-titles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: videoContext,
          count,
          type: 'viral_shorts' // Optimized for 15-30s content
        })
      })

      if (!response.ok) throw new Error('Failed to generate titles')
      
      const data = await response.json()
      return data.titles
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback titles if API fails
      return [
        "This moment had me shook 😱",
        "Wait for it... 🔥",
        "POV: You found the best clip",
        "This changes everything 👀",
        "You need to see this 👆"
      ].slice(0, count)
    } finally {
      setLoading(false)
    }
  }

  const analyzeViralPotential = async (title: string): Promise<number> => {
    // Simple heuristic scoring or API call for viral score
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/viral-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (!response.ok) return 70 // Default score
      const data = await response.json()
      return data.score
    } catch {
      return Math.floor(Math.random() * 30) + 70 // Fallback: 70-100
    }
  }

  return { generateTitles, analyzeViralPotential, loading, error }
}