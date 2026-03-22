import React, { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { generateTitleSuggestions } from '../lib/openai'

interface TitleSuggestionsProps {
  onSelect: (title: string) => void
  topic: string
}

export const TitleSuggestions: React.FC<TitleSuggestionsProps> = ({
  onSelect,
  topic,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateSuggestions = async () => {
    setIsGenerating(true)
    const titles = await generateTitleSuggestions(topic)
    setSuggestions(titles)
    setIsGenerating(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          AI Title Suggestions
        </h4>
        <button
          onClick={generateSuggestions}
          disabled={isGenerating}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          {isGenerating ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Generate
        </button>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((title, index) => (
            <button
              key={index}
              onClick={() => onSelect(title)}
              className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              {title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Click generate to get AI-powered title suggestions
        </p>
      )}
    </div>
  )
}