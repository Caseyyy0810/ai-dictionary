'use client'

import { useState } from 'react'
import { X, Loader2, Volume2 } from 'lucide-react'

interface TranslationModalProps {
  word: string
  translation: string | null
  definition?: string | null
  example?: {
    sentence: string
    translation: string
  } | null
  loading: boolean
  type?: 'translation' | 'explanation'
  wordLanguage: string
  onClose: () => void
}

export default function TranslationModal({
  word,
  translation,
  definition,
  example,
  loading,
  type = 'translation',
  wordLanguage,
  onClose,
}: TranslationModalProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  const playPronunciation = (text: string, audioId: string) => {
    if (playingAudio) return

    setPlayingAudio(audioId)
    try {
      const languageMap: Record<string, string> = {
        en: 'en-US',
        zh: 'zh-CN',
        es: 'es-ES',
        hi: 'hi-IN',
        ar: 'ar-SA',
        el: 'el-GR',
      }

      const speechLang = languageMap[wordLanguage] || 'en-US'

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = speechLang
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1

        utterance.onend = () => setPlayingAudio(null)
        utterance.onerror = () => setPlayingAudio(null)

        window.speechSynthesis.speak(utterance)
      } else {
        alert('Speech synthesis not supported in your browser')
        setPlayingAudio(null)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setPlayingAudio(null)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Translation</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Word</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold text-gray-900">{word}</p>
              <button
                onClick={() => playPronunciation(word, 'word')}
                className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 transition-all"
                disabled={playingAudio === 'word'}
              >
                {playingAudio === 'word' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
              <span className="ml-3 text-gray-600">
                {type === 'explanation' ? 'Explaining...' : 'Translating...'}
              </span>
            </div>
          ) : translation ? (
            <div className="space-y-3">
              {type === 'translation' && translation && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Translation</p>
                  <p className="text-xl font-semibold text-primary-600">{translation}</p>
                </div>
              )}
              
              {definition && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Definition</p>
                  <p className="text-gray-700 leading-relaxed">{definition}</p>
                </div>
              )}
              
              {!definition && type === 'explanation' && translation && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Explanation</p>
                  <p className="text-gray-700 leading-relaxed">{translation}</p>
                </div>
              )}

              {example && (
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-primary-500">
                  <p className="text-sm text-gray-500 mb-1">Example</p>
                  <div className="flex items-start gap-2 mb-1">
                    <p className="text-gray-800 flex-1">{example.sentence}</p>
                    <button
                      onClick={() => playPronunciation(example.sentence, 'example')}
                      className="p-1.5 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 transition-all flex-shrink-0"
                      disabled={playingAudio === 'example'}
                    >
                      {playingAudio === 'example' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Volume2 size={14} />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 italic text-sm">{example.translation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">
                {type === 'explanation' ? 'Explanation not available' : 'Translation not available'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
