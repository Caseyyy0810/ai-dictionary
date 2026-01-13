export type Language = {
  code: string
  name: string
  nativeName: string
}

export type DictionaryEntry = {
  word: string
  definition: string
  imageUrl: string
  examples: Array<{
    sentence: string
    translation: string
  }>
  usageNote: string
  pronunciation?: string
}

export type NotebookEntry = DictionaryEntry & {
  id: string
  savedAt: Date
}
