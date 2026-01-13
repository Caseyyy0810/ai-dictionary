'use client'

import { useState, useEffect } from 'react'
import { X, Check, Loader2, RefreshCw } from 'lucide-react'
import { getNotionConfig, saveNotionConfig, clearNotionConfig, isNotionConfigured } from '../utils/notion'
import { loadFromNotion } from '../utils/storage'

interface NotionSettingsProps {
  onClose: () => void
  onSync: (entries: any[]) => void
}

export default function NotionSettings({ onClose, onSync }: NotionSettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [databaseId, setDatabaseId] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const config = getNotionConfig()
    if (config) {
      setApiKey(config.apiKey)
      setDatabaseId(config.databaseId)
    }
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both API Key and Database ID' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      saveNotionConfig({ apiKey: apiKey.trim(), databaseId: databaseId.trim() })
      setMessage({ type: 'success', text: 'Notion configuration saved!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save configuration' })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both API Key and Database ID' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/notion/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          databaseId: databaseId.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to connect to Notion')
      }

      const data = await response.json()
      setMessage({ 
        type: 'success', 
        text: `Successfully connected! Found ${data.count || 0} entries in Notion.` 
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to connect to Notion' })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const entries = await loadFromNotion()
      if (entries.length > 0) {
        onSync(entries)
        setMessage({ type: 'success', text: `Successfully loaded ${entries.length} entries from Notion!` })
      } else {
        setMessage({ type: 'error', text: 'No entries found in Notion database' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to sync from Notion' })
    } finally {
      setSyncing(false)
    }
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear Notion configuration?')) {
      clearNotionConfig()
      setApiKey('')
      setDatabaseId('')
      setMessage({ type: 'success', text: 'Notion configuration cleared' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Notion Integration</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notion API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_xxxxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a 
                href="https://www.notion.so/my-integrations" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                notion.so/my-integrations
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notion Database ID
            </label>
            <input
              type="text"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="32-character database ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Copy the database ID from your Notion database URL
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save
                </>
              )}
            </button>

            <button
              onClick={handleTest}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Test Connection
            </button>
          </div>

          {isNotionConfigured() && (
            <div className="pt-4 border-t">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {syncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Sync from Notion
                  </>
                )}
              </button>
            </div>
          )}

          {isNotionConfigured() && (
            <button
              onClick={handleClear}
              className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors"
            >
              Clear Configuration
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
