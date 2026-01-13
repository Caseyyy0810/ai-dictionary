'use client'

import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import LanguageSelector from './components/LanguageSelector'
import SearchInput from './components/SearchInput'
import ResultCard from './components/ResultCard'
import Notebook from './components/Notebook'
import { DictionaryEntry, NotebookEntry } from './types'
import { saveNotebook, loadNotebook, saveLanguage, loadLanguage, exportNotebook, importNotebook } from './utils/storage'
import NotionSettings from './components/NotionSettings'

export default function Home() {
  const [nativeLanguage, setNativeLanguage] = useState('en') // User's native language (for explanations)
  const [targetLanguage, setTargetLanguage] = useState('en') // Language being learned (auto-detected from input)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<DictionaryEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [detectingLanguage, setDetectingLanguage] = useState(false)
  const [notebook, setNotebook] = useState<NotebookEntry[]>([])
  const [showNotebook, setShowNotebook] = useState(false)
  const [showNotionSettings, setShowNotionSettings] = useState(false)
  const [savedEntryIds, setSavedEntryIds] = useState<Set<string>>(new Set())

  // Load notebook and preferences from IndexedDB/localStorage
  useEffect(() => {
    // Load notebook from IndexedDB
    loadNotebook().then((notebookData) => {
      if (notebookData && notebookData.length > 0) {
        setNotebook(notebookData)
        setSavedEntryIds(new Set(notebookData.map((e: NotebookEntry) => e.id)))
      }
    }).catch((error) => {
      console.error('Error loading notebook:', error)
    })

    // Load language preference
    const savedLang = loadLanguage()
    if (savedLang) {
      setNativeLanguage(savedLang)
    }
  }, [])

  // Save notebook to IndexedDB and auto-backup to file whenever it changes
  useEffect(() => {
    if (notebook.length >= 0) {
      saveNotebook(notebook).catch((error) => {
        console.error('Error saving notebook:', error)
        alert('保存数据时出错，请检查浏览器存储空间')
      })
    }
  }, [notebook])

  // Save language preference
  useEffect(() => {
    saveLanguage(nativeLanguage)
  }, [nativeLanguage])

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    setLoading(true)
    setDetectingLanguage(true)
    setResult(null)

    try {
      // First, detect the language of the input (this is the target language - the language being learned)
      let detectedTargetLanguage = targetLanguage
      
      try {
        const detectResponse = await fetch('/api/detect-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: searchQuery }),
        })

        if (detectResponse.ok) {
          const detectData = await detectResponse.json()
          detectedTargetLanguage = detectData.language || 'en'
          setTargetLanguage(detectedTargetLanguage)
        }
      } catch (detectError) {
        console.error('Language detection error:', detectError)
        // Continue with default language
      } finally {
        setDetectingLanguage(false)
      }

      // Then fetch the dictionary entry
      // nativeLanguage = user's language (for explanations)
      // targetLanguage = language being learned (detected from input)
      const response = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          nativeLanguage: nativeLanguage, // User's native language for explanations
          targetLanguage: detectedTargetLanguage, // Language being learned (from input)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch dictionary entry')
      }

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      console.error('Search error:', error)
      const errorMessage = error.message || 'Failed to fetch dictionary entry. Please check your API key in .env.local'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
      setDetectingLanguage(false)
    }
  }

  const handleSave = () => {
    if (!result) return

    // Check if this word is already saved
    const existingEntry = notebook.find(
      (e) => e.word === result.word && e.id.startsWith(`${result.word}-${targetLanguage}-`)
    )

    if (existingEntry) {
      // Remove if already saved
      setNotebook(notebook.filter((e) => e.id !== existingEntry.id))
      setSavedEntryIds((prev) => {
        const next = new Set(prev)
        next.delete(existingEntry.id)
        return next
      })
    } else {
      // Add to notebook
      const entryId = `${result.word}-${targetLanguage}-${Date.now()}`
      const newEntry: NotebookEntry = {
        ...result,
        id: entryId,
        savedAt: new Date(),
      }
      const updatedNotebook = [...notebook, newEntry]
      setNotebook(updatedNotebook)
      setSavedEntryIds((prev) => {
        const next = new Set(prev)
        next.add(entryId)
        return next
      })
      
      // Show confirmation
      console.log('Saved to notebook:', newEntry.word)
    }
  }

  const handleRemoveFromNotebook = (id: string) => {
    const updatedNotebook = notebook.filter((e) => e.id !== id)
    setNotebook(updatedNotebook)
    setSavedEntryIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    // Data will be automatically saved via useEffect
  }

  // Export notebook data
  const handleExportNotebook = async () => {
    try {
      await exportNotebook(notebook)
    } catch (error) {
      console.error('Error exporting notebook:', error)
      alert('导出失败，请重试')
    }
  }

  // Import notebook data
  const handleImportNotebook = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const imported = await importNotebook(file)
      setNotebook(imported)
      setSavedEntryIds(new Set(imported.map((e: NotebookEntry) => e.id)))
      alert(`成功导入 ${imported.length} 个单词`)
    } catch (error: any) {
      console.error('Error importing notebook:', error)
      alert(`导入失败: ${error.message || '文件格式错误'}`)
    }
    
    // Reset input
    event.target.value = ''
  }

  const isCurrentResultSaved = result
    ? notebook.some(
        (e) => e.word === result.word && e.id.startsWith(`${result.word}-${targetLanguage}-`)
      )
    : false

  return (
    <main className="min-h-screen p-4 md:p-6 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Compact Header */}
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-lg">
            AI Dictionary
          </h1>
        </div>

        {/* Compact Language Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 mb-4 shadow-lg">
          <div className="max-w-xs mx-auto">
            <LanguageSelector
              label="Native Language"
              value={nativeLanguage}
              onChange={setNativeLanguage}
            />
            {targetLanguage && (
              <div className="mt-2 text-center">
                <p className="text-white/80 text-xs">
                  Learning: <span className="font-semibold text-white">
                    {targetLanguage === 'en' ? 'English' : 
                     targetLanguage === 'zh' ? '中文' :
                     targetLanguage === 'es' ? 'Español' :
                     targetLanguage === 'hi' ? 'हिन्दी' :
                     targetLanguage === 'ar' ? 'العربية' :
                     targetLanguage === 'el' ? 'Ελληνικά' : targetLanguage}
                  </span>
                  {detectingLanguage && ' (detecting...)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <SearchInput onSearch={handleSearch} isLoading={loading} />
        </div>

        {/* Notebook and Notion Buttons */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setShowNotebook(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 text-sm"
          >
            <BookOpen size={16} />
            Notebook ({notebook.length})
          </button>
          <button
            onClick={() => setShowNotionSettings(true)}
            className="px-4 py-2 bg-purple-500/80 hover:bg-purple-600/80 backdrop-blur-sm text-white rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 text-sm"
            title="Notion Integration"
          >
            📝 Notion
          </button>
        </div>

        {/* Content Area - Centered */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center w-full max-w-2xl">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Generating definition...</p>
            </div>
          )}

          {/* Results - Centered */}
          {result && !loading && (
            <div className="w-full max-w-2xl">
              <ResultCard
                entry={result}
                nativeLanguage={nativeLanguage}
                targetLanguage={targetLanguage}
                onSave={handleSave}
                isSaved={isCurrentResultSaved}
              />
            </div>
          )}

          {/* Empty State - Centered */}
          {!result && !loading && (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center shadow-xl w-full max-w-2xl">
              <p className="text-white/80 text-lg">
                Enter a word, phrase, or sentence to get started!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notebook Modal */}
      {showNotebook && (
        <Notebook
          entries={notebook}
          onClose={() => setShowNotebook(false)}
          onRemove={handleRemoveFromNotebook}
          onExport={handleExportNotebook}
          onImport={handleImportNotebook}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
        />
      )}

      {/* Notion Settings Modal */}
      {showNotionSettings && (
        <NotionSettings
          onClose={() => setShowNotionSettings(false)}
          onSync={(entries) => {
            setNotebook(entries)
            setSavedEntryIds(new Set(entries.map((e: NotebookEntry) => e.id)))
            setShowNotionSettings(false)
          }}
        />
      )}
    </main>
  )
}
