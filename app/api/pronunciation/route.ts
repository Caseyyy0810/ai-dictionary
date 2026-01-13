import { NextRequest, NextResponse } from 'next/server'

// Using browser's Web Speech API instead of server-side TTS
// This route now just returns instructions for client-side usage
export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json()

    if (!text || !language) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Map language codes to Web Speech API language codes
    const languageMap: Record<string, string> = {
      en: 'en-US',
      zh: 'zh-CN',
      es: 'es-ES',
      hi: 'hi-IN',
      ar: 'ar-SA',
      el: 'el-GR',
    }

    const speechLang = languageMap[language] || 'en-US'

    // Return language code for client-side Web Speech API
    return NextResponse.json({
      language: speechLang,
      text: text,
      useBrowserTTS: true, // Flag to use browser TTS
    })
  } catch (error: any) {
    console.error('Pronunciation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate pronunciation' },
      { status: 500 }
    )
  }
}
