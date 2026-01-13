'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { NotebookEntry } from '../types'

interface StudyModeProps {
  entries: NotebookEntry[]
  onClose: () => void
  nativeLanguage: string
  targetLanguage: string
}

export default function StudyMode({
  entries,
  onClose,
  nativeLanguage,
  targetLanguage,
}: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (entries.length === 0) {
    return null
  }

  const currentEntry = entries[currentIndex]
  const hasNext = currentIndex < entries.length - 1
  const hasPrev = currentIndex > 0

  const nextCard = () => {
    setFlipped(false)
    if (hasNext) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevCard = () => {
    setFlipped(false)
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 z-50 flex flex-col p-3 md:p-4 overflow-hidden">
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
          <div className="text-white">
            <h2 className="text-xl md:text-2xl font-bold">Study Mode</h2>
            <p className="text-white/80 text-xs md:text-sm">
              Card {currentIndex + 1} of {entries.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Flashcard - Takes remaining space */}
        <div className="flip-card flex-1 min-h-0" style={{ minHeight: '0' }}>
          <div
            className={`flip-card-inner ${flipped ? 'flipped' : ''} cursor-pointer h-full`}
            onClick={() => setFlipped(!flipped)}
          >
            {/* Front */}
            <div className="flip-card-front">
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl h-full w-full p-6 md:p-8 flex flex-col items-center justify-center">
                <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center break-words px-2">
                  {currentEntry.word}
                </h3>
                <p className="text-gray-500 mt-4 md:mt-6 text-center text-xs md:text-sm">
                  Click to flip
                </p>
              </div>
            </div>

            {/* Back */}
            <div className="flip-card-back">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl md:rounded-3xl shadow-2xl h-full w-full p-4 md:p-6 flex flex-col justify-center text-white overflow-hidden">
                <h3 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 text-center break-words px-2 flex-shrink-0">
                  {currentEntry.word}
                </h3>
                <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                  <p className="text-sm md:text-base mb-3 md:mb-4 text-center opacity-90 leading-snug md:leading-relaxed px-2 line-clamp-4 md:line-clamp-none">
                    {currentEntry.definition}
                  </p>
                  {currentEntry.examples.length > 0 && (
                    <div className="bg-white/20 rounded-lg md:rounded-xl p-3 md:p-4 backdrop-blur-sm mx-2 flex-shrink-0">
                      <p className="text-xs font-semibold mb-1 md:mb-2">Example:</p>
                      <p className="text-xs md:text-sm mb-1 md:mb-2 leading-snug line-clamp-2 md:line-clamp-none">
                        {currentEntry.examples[0].sentence}
                      </p>
                      <p className="text-xs opacity-80 italic leading-snug line-clamp-2 md:line-clamp-none">
                        {currentEntry.examples[0].translation}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-gray-200 mt-2 md:mt-3 text-center text-xs flex-shrink-0">
                  Click to flip
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3 md:mt-4 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              prevCard()
            }}
            disabled={!hasPrev}
            className="px-3 md:px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextCard()
            }}
            disabled={!hasNext}
            className="px-3 md:px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
