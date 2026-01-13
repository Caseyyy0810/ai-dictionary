import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing text parameter' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      )
    }

    let detectedLanguage = 'en' // Default fallback

    // First, try character-based detection (fast and reliable)
    // Check for Chinese characters
    if (/[\u4e00-\u9fa5]/.test(text)) {
      detectedLanguage = 'zh'
    }
    // Check for Arabic characters
    else if (/[\u0600-\u06FF]/.test(text)) {
      detectedLanguage = 'ar'
    }
    // Check for Greek characters
    else if (/[\u0370-\u03FF]/.test(text)) {
      detectedLanguage = 'el'
    }
    // Check for Devanagari (Hindi)
    else if (/[\u0900-\u097F]/.test(text)) {
      detectedLanguage = 'hi'
    }
    // Check for Spanish characters/words
    else if (/[ñáéíóúü¿¡]/.test(text) || /\b(el|la|de|que|y|a|en|un|ser|se|no|haber|por|con|su|para|como|estar|tener|le|lo|todo|pero|más|hacer|o|poder|decir|este|ir|otro|ese|si|me|ya|ver|porque|dar|cuando|él|muy|sin|vez|mucho|saber|qué|sobre|mi|alguno|mismo|yo|también|hasta|año|dos|querer|entre|así|primero|desde|grande|eso|ni|nos|llegar|pasar|tiempo|ella|sí|día|uno|bien|poco|deber|entonces|poner|cosa|tanto|hombre|parecer|nuestro|tan|donde|ahora|parte|después|vida|quedar|siempre|creer|hablar|llevar|dejar|nada|cada|seguir|menos|nuevo|encontrar|aquel|venir|pensar|ir|tomar|mundo|conocer|querer|mirar|usar|trabajar|encontrar|dar|vivir|sentir|tratar|buscar|existir)\b/i.test(text)) {
      detectedLanguage = 'es'
    }
    // If character detection didn't work, try AI detection
    else {
      try {
        // Use REST API with v1 (not v1beta)
        const modelsToTry = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']
        
        for (const modelName of modelsToTry) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `Detect the language of this text: "${text}". Return ONLY the language code (en, zh, es, hi, ar, or el). Just the code, nothing else.`
                    }]
                  }]
                })
              }
            )

            if (response.ok) {
              const data = await response.json()
              const languageCode = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || ''
              
              // Validate the language code
              const validCodes = ['en', 'zh', 'es', 'hi', 'ar', 'el']
              if (validCodes.includes(languageCode)) {
                detectedLanguage = languageCode
                break
              } else {
                // Try to extract from response
                const match = languageCode.match(/\b(en|zh|es|hi|ar|el)\b/i)
                if (match) {
                  detectedLanguage = match[1].toLowerCase()
                  break
                }
              }
            }
          } catch (modelError: any) {
            // Try next model
            continue
          }
        }
      } catch (error: any) {
        console.error('AI language detection error:', error.message)
        // Fallback to English if AI detection fails
        detectedLanguage = 'en'
      }
    }

    return NextResponse.json({
      language: detectedLanguage,
      confidence: detectedLanguage !== 'en' || /[\u4e00-\u9fa5\u0600-\u06FF\u0370-\u03FF\u0900-\u097F]/.test(text) ? 'high' : 'medium',
    })
  } catch (error: any) {
    console.error('Language detection error:', error)
    return NextResponse.json(
      { 
        language: 'en', // Default fallback
        confidence: 'low',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
