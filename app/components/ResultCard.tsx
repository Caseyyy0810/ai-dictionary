'use client'

import { useState } from 'react'
import { Volume2, BookOpen, Loader2 } from 'lucide-react'
import { DictionaryEntry } from '../types'
import ClickableText from './ClickableText'

interface ResultCardProps {
  entry: DictionaryEntry
  nativeLanguage: string
  targetLanguage: string
  onSave: () => void
  isSaved: boolean
}

export default function ResultCard({
  entry,
  nativeLanguage,
  targetLanguage,
  onSave,
  isSaved,
}: ResultCardProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  const playPronunciation = async (text: string, audioId: string) => {
    if (playingAudio) return

    setPlayingAudio(audioId)
    try {
      // Use browser's Web Speech API
      const languageMap: Record<string, string> = {
        en: 'en-US',
        zh: 'zh-CN',
        es: 'es-ES',
        hi: 'hi-IN',
        ar: 'ar-SA',
        el: 'el-GR',
      }

      const speechLang = languageMap[targetLanguage] || 'en-US'

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
    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header with word and save button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {entry.word}
            </h2>
            <button
              onClick={() => playPronunciation(entry.word, 'word')}
              className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 transition-all"
              disabled={playingAudio === 'word'}
            >
              {playingAudio === 'word' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Volume2 size={20} />
              )}
            </button>
          </div>
        </div>
        <button
          onClick={onSave}
          className={`px-4 py-2 rounded-xl font-semibold transition-all shadow-lg ${
            isSaved
              ? 'bg-secondary-500 text-white'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          <BookOpen size={20} className="inline mr-2" />
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Definition */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Definition</h3>
        <ClickableText
          text={entry.definition}
          sourceLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          nativeLanguage={nativeLanguage}
          className="text-gray-700 leading-relaxed"
        />
      </div>

      {/* Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Examples</h3>
        {entry.examples.map((example, idx) => (
          <div
            key={idx}
            className="bg-gray-50 rounded-xl p-5 border-l-4 border-primary-500"
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="text-gray-800 text-lg flex-1">
                <ClickableText
                  text={example.sentence}
                  sourceLanguage={targetLanguage}
                  targetLanguage={targetLanguage}
                  nativeLanguage={nativeLanguage}
                />
              </div>
              <button
                onClick={() => playPronunciation(example.sentence, `sentence-${idx}`)}
                className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-600 transition-all flex-shrink-0"
                disabled={playingAudio === `sentence-${idx}`}
              >
                {playingAudio === `sentence-${idx}` ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
            </div>
            <p className="text-gray-600 italic">{example.translation}</p>
          </div>
        ))}
      </div>

      {/* Usage Note */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Usage Note</h3>
        <ClickableText
          text={entry.usageNote}
          sourceLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          nativeLanguage={nativeLanguage}
          className="text-gray-700 leading-relaxed"
        />
      </div>
    </div>
  )
}
