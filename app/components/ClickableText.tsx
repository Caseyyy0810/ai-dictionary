'use client'

import { useState } from 'react'
import TranslationModal from './TranslationModal'

interface ClickableTextProps {
  text: string
  sourceLanguage: string
  targetLanguage: string
  nativeLanguage: string
  className?: string
}

// Cache for translations (in-memory, per session)
const translationCache = new Map<string, any>()

export default function ClickableText({
  text,
  sourceLanguage,
  targetLanguage,
  nativeLanguage,
  className = '',
}: ClickableTextProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [translation, setTranslation] = useState<string | null>(null)
  const [definition, setDefinition] = useState<string | null>(null)
  const [example, setExample] = useState<{ sentence: string; translation: string } | null>(null)
  const [translationType, setTranslationType] = useState<'translation' | 'explanation'>('translation')
  const [loading, setLoading] = useState(false)

  // Split text into words and punctuation
  // Support multiple languages: English, Chinese, Arabic, Greek, Hindi, Spanish
  const words = text.split(/(\s+|[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~])/)

  const handleWordClick = async (word: string) => {
    // Clean the word (remove punctuation but keep language-specific characters)
    const cleanWord = word.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, '').trim()
    
    if (!cleanWord || cleanWord.length < 1) return

    // Create cache key
    const cacheKey = `${cleanWord}-${sourceLanguage}-${targetLanguage}-${nativeLanguage}`

    // Check cache first
    const cached = translationCache.get(cacheKey)
    if (cached) {
      setSelectedWord(cleanWord)
      setTranslation(cached.translation || null)
      setDefinition(cached.definition || null)
      setExample(cached.example || null)
      setTranslationType(cached.type || 'translation')
      return
    }

    setSelectedWord(cleanWord)
    setTranslation(null)
    setDefinition(null)
    setExample(null)
    setTranslationType('translation')
    setLoading(true)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: cleanWord,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          nativeLanguage: nativeLanguage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Translation failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Cache the result
      translationCache.set(cacheKey, {
        translation: data.translation || null,
        definition: data.definition || null,
        example: data.example || null,
        type: data.type || 'translation',
      })
      
      setTranslation(data.translation || null)
      setDefinition(data.definition || null)
      setExample(data.example || null)
      setTranslationType(data.type || 'translation')
    } catch (error: any) {
      console.error('Translation error:', error)
      // Show error message to user
      alert(`翻译失败: ${error.message || '未知错误'}\n\n请检查:\n1. .env.local 文件中是否设置了 DEEPSEEK_API_KEY\n2. API key 是否正确\n3. 网络连接是否正常`)
      setTranslation(null)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedWord(null)
    setTranslation(null)
    setDefinition(null)
    setExample(null)
    setLoading(false)
  }

  return (
    <>
      <p className={className}>
        {words.map((word, index) => {
          // Check if it's a word (support multiple languages)
          // English, Chinese, Arabic, Greek, Hindi, Spanish
          const trimmedWord = word.trim()
          const isWord = /^[a-zA-Z\u4e00-\u9fa5\u0600-\u06FF\u0370-\u03FF\u0900-\u097F\u00C0-\u024F\u1E00-\u1EFF]+$/.test(trimmedWord)
          
          if (isWord && trimmedWord.length > 0) {
            return (
              <span
                key={index}
                onClick={() => handleWordClick(word)}
                className="cursor-pointer hover:bg-yellow-200 hover:underline rounded px-1 transition-colors inline-block"
                title="Click to translate"
              >
                {word}
              </span>
            )
          }
          return <span key={index}>{word}</span>
        })}
      </p>

      {selectedWord && (
        <TranslationModal
          word={selectedWord}
          translation={translation}
          definition={definition}
          example={example}
          loading={loading}
          type={translationType}
          wordLanguage={sourceLanguage}
          onClose={closeModal}
        />
      )}
    </>
  )
}
