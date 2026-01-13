'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { NotebookEntry } from '../types'

interface StoryModalProps {
  entries: NotebookEntry[]
  onClose: () => void
  nativeLanguage: string
  targetLanguage: string
}

export default function StoryModal({
  entries,
  onClose,
  nativeLanguage,
  targetLanguage,
}: StoryModalProps) {
  const [story, setStory] = useState<string | null>(null)
  const [translation, setTranslation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generateStory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: entries,
          nativeLanguage,
          targetLanguage,
        }),
      })

      const data = await response.json()
      setStory(data.story)
      setTranslation(data.translation)
    } catch (error) {
      console.error('Error generating story:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">AI Story</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!story ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg mb-6">
                I&apos;ll create a fun story using your saved words to help you
                remember them!
              </p>
              <button
                onClick={generateStory}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating story...
                  </>
                ) : (
                  'Generate Story'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Story ({targetLanguage})
                </h3>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {story}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Translation ({nativeLanguage})
                </h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {translation}
                  </p>
                </div>
              </div>
              <button
                onClick={generateStory}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin inline mr-2" />
                    Creating new story...
                  </>
                ) : (
                  'Generate New Story'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
