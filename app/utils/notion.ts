import { NotebookEntry } from '../types'

// Notion API client (will be initialized on server side)
export interface NotionConfig {
  apiKey: string
  databaseId: string
}

// Check if Notion is configured
export function isNotionConfigured(): boolean {
  if (typeof window === 'undefined') return false
  const config = localStorage.getItem('notion-config')
  return !!config
}

// Get Notion configuration
export function getNotionConfig(): NotionConfig | null {
  if (typeof window === 'undefined') return null
  const config = localStorage.getItem('notion-config')
  if (!config) return null
  try {
    return JSON.parse(config)
  } catch {
    return null
  }
}

// Save Notion configuration
export function saveNotionConfig(config: NotionConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('notion-config', JSON.stringify(config))
}

// Clear Notion configuration
export function clearNotionConfig(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('notion-config')
}
