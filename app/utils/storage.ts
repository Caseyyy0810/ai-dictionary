// Storage utility for saving data to local file system
import { NotebookEntry } from '../types'
import { getNotionConfig } from './notion'

const STORAGE_FILE_NAME = 'ai-dictionary-data.json'
const STORAGE_KEY = 'ai-dictionary-notebook'
const LANGUAGE_KEY = 'ai-dictionary-language'

// Initialize IndexedDB
let db: IDBDatabase | null = null

async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AIDictionaryDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains('notebook')) {
        database.createObjectStore('notebook', { keyPath: 'id' })
      }
    }
  })
}

// Save notebook to IndexedDB and auto-backup to file
export async function saveNotebook(notebook: NotebookEntry[]): Promise<void> {
  try {
    // Save to IndexedDB
    const database = await initDB()
    const transaction = database.transaction(['notebook'], 'readwrite')
    const store = transaction.objectStore('notebook')
    
    // Clear existing data
    await store.clear()
    
    // Add all entries
    for (const entry of notebook) {
      await store.add(entry)
    }

    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notebook))

    // Auto-backup to file (download)
    await autoBackupToFile(notebook)

    // Sync to Notion if configured
    await syncToNotion(notebook)
  } catch (error) {
    console.error('Error saving notebook:', error)
    // Fallback to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notebook))
    } catch (e) {
      console.error('Error saving to localStorage:', e)
    }
  }
}

// Load notebook from IndexedDB, localStorage, or Notion
export async function loadNotebook(): Promise<NotebookEntry[]> {
  try {
    // Try IndexedDB first
    const database = await initDB()
    const transaction = database.transaction(['notebook'], 'readonly')
    const store = transaction.objectStore('notebook')
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const entries = request.result as NotebookEntry[]
        if (entries && entries.length > 0) {
          // Convert savedAt strings back to Date objects
          const notebookWithDates = entries.map((e: any) => ({
            ...e,
            savedAt: e.savedAt ? new Date(e.savedAt) : new Date(),
          }))
          resolve(notebookWithDates)
        } else {
          // Try Notion if configured
          const notionEntries = await loadFromNotion()
          if (notionEntries && notionEntries.length > 0) {
            resolve(notionEntries)
            return
          }

          // Fallback to localStorage
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              const notebookWithDates = parsed.map((e: any) => ({
                ...e,
                savedAt: e.savedAt ? new Date(e.savedAt) : new Date(),
              }))
              resolve(notebookWithDates)
            } catch (e) {
              resolve([])
            }
          } else {
            resolve([])
          }
        }
      }
      request.onerror = async () => {
        // Try Notion if configured
        const notionEntries = await loadFromNotion()
        if (notionEntries && notionEntries.length > 0) {
          resolve(notionEntries)
          return
        }

        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            const notebookWithDates = parsed.map((e: any) => ({
              ...e,
              savedAt: e.savedAt ? new Date(e.savedAt) : new Date(),
            }))
            resolve(notebookWithDates)
          } catch (e) {
            resolve([])
          }
        } else {
          resolve([])
        }
      }
    })
  } catch (error) {
    console.error('Error loading notebook:', error)
    
    // Try Notion if configured
    const notionEntries = await loadFromNotion()
    if (notionEntries && notionEntries.length > 0) {
      return notionEntries
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const notebookWithDates = parsed.map((e: any) => ({
          ...e,
          savedAt: e.savedAt ? new Date(e.savedAt) : new Date(),
        }))
        return notebookWithDates
      } catch (e) {
        return []
      }
    }
    return []
  }
}

// Auto-backup to file (downloads folder)
async function autoBackupToFile(notebook: NotebookEntry[]): Promise<void> {
  try {
    const data = {
      notebook,
      language: localStorage.getItem(LANGUAGE_KEY) || 'en',
      backupDate: new Date().toISOString(),
      version: '1.0',
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    // Use File System Access API if available (Chrome/Edge)
    if (window.showSaveFilePicker) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: STORAGE_FILE_NAME,
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] },
          }],
        })
        
        const writable = await fileHandle.createWritable()
        await writable.write(dataBlob)
        await writable.close()
        
        // Save file handle reference for future auto-saves
        localStorage.setItem('ai-dictionary-file-handle', JSON.stringify({
          name: fileHandle.name,
        }))
        
        return
      } catch (error: any) {
        // User cancelled or error, fallback to download
        if (error.name !== 'AbortError') {
          console.log('File System Access API not available, using download')
        }
      }
    }

    // Fallback: Download file
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = STORAGE_FILE_NAME
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error backing up to file:', error)
  }
}

// Save language preference
export function saveLanguage(language: string): void {
  localStorage.setItem(LANGUAGE_KEY, language)
}

// Load language preference
export function loadLanguage(): string {
  return localStorage.getItem(LANGUAGE_KEY) || 'en'
}

// Export notebook to file
export async function exportNotebook(notebook: NotebookEntry[]): Promise<void> {
  await autoBackupToFile(notebook)
}

// Import notebook from file
export async function importNotebook(file: File): Promise<NotebookEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // Handle different file formats
        let entries: NotebookEntry[] = []
        if (Array.isArray(data)) {
          // Old format: just array
          entries = data
        } else if (data.notebook && Array.isArray(data.notebook)) {
          // New format: object with notebook property
          entries = data.notebook
        } else {
          throw new Error('Invalid file format')
        }

        // Convert savedAt strings back to Date objects
        const notebookWithDates = entries.map((e: any) => ({
          ...e,
          savedAt: e.savedAt ? new Date(e.savedAt) : new Date(),
        }))

        // Save imported data
        saveNotebook(notebookWithDates)
        
        // Restore language if available
        if (data.language) {
          saveLanguage(data.language)
        }

        resolve(notebookWithDates)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

// Sync to Notion
async function syncToNotion(notebook: NotebookEntry[]): Promise<void> {
  try {
    const config = getNotionConfig()
    if (!config || !config.apiKey || !config.databaseId) {
      return // Notion not configured
    }

    const response = await fetch('/api/notion/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notebook,
        databaseId: config.databaseId,
        apiKey: config.apiKey,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Notion sync failed:', error)
    }
  } catch (error) {
    console.error('Notion sync error:', error)
    // Don't throw - Notion sync is optional
  }
}

// Load from Notion
export async function loadFromNotion(): Promise<NotebookEntry[]> {
  try {
    const config = getNotionConfig()
    if (!config || !config.apiKey || !config.databaseId) {
      return []
    }

    const response = await fetch('/api/notion/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        databaseId: config.databaseId,
        apiKey: config.apiKey,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to load from Notion')
    }

    const data = await response.json()
    return data.entries || []
  } catch (error) {
    console.error('Error loading from Notion:', error)
    return []
  }
}

// Try to auto-load from file on startup
export async function tryAutoLoadFromFile(): Promise<NotebookEntry[] | null> {
  try {
    // Check if we have a file handle reference
    const fileHandleRef = localStorage.getItem('ai-dictionary-file-handle')
    if (fileHandleRef && window.showOpenFilePicker) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] },
          }],
        })
        
        const file = await fileHandle.getFile()
        const entries = await importNotebook(file)
        return entries
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.log('Auto-load from file cancelled or failed')
        }
      }
    }
  } catch (error) {
    console.log('Auto-load from file not available')
  }
  
  return null
}
