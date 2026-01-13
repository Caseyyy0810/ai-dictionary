'use client'

import { useState, useRef } from 'react'
import { X, BookOpen, Sparkles, GraduationCap, Download, Upload } from 'lucide-react'
import { NotebookEntry } from '../types'
import StoryModal from './StoryModal'
import StudyMode from './StudyMode'

interface NotebookProps {
  entries: NotebookEntry[]
  onClose: () => void
  onRemove: (id: string) => void
  onExport: () => void
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  nativeLanguage: string
  targetLanguage: string
}

export default function Notebook({
  entries,
  onClose,
  onRemove,
  onExport,
  onImport,
  nativeLanguage,
  targetLanguage,
}: NotebookProps) {
  const [showStory, setShowStory] = useState(false)
  const [showStudy, setShowStudy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (showStudy) {
    return (
      <StudyMode
        entries={entries}
        onClose={() => setShowStudy(false)}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-white" />
            <h2 className="text-2xl font-bold text-white">My Notebook</h2>
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {entries.length}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {entries.length > 0 && (
              <>
                <button
                  onClick={() => setShowStory(true)}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
                >
                  <Sparkles size={16} />
                  Story
                </button>
                <button
                  onClick={() => setShowStudy(true)}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
                >
                  <GraduationCap size={16} />
                  Study
                </button>
                <button
                  onClick={onExport}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
                  title="Export notebook"
                >
                  <Download size={16} />
                  Export
                </button>
              </>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
              title="Import notebook"
            >
              <Upload size={16} />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Your notebook is empty</p>
              <p className="text-gray-400 text-sm mt-2">
                Save words to review them later
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:border-primary-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {entry.word}
                      </h3>
                      <p className="text-gray-700 mb-3">{entry.definition}</p>
                      {entry.examples.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <p className="font-semibold mb-1">Example:</p>
                          <p className="italic">
                            {entry.examples[0].sentence}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStory && (
        <StoryModal
          entries={entries}
          onClose={() => setShowStory(false)}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
        />
      )}
    </div>
  )
}
