'use client'

import { LANGUAGES } from '../constants'
import { Language } from '../types'

interface LanguageSelectorProps {
  label: string
  value: string
  onChange: (code: string) => void
}

export default function LanguageSelector({
  label,
  value,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white font-medium text-xs">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/90 backdrop-blur-sm border-2 border-white/50 focus:border-primary-400 focus:outline-none text-gray-800 text-sm font-medium shadow-md transition-all hover:bg-white"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  )
}
