import { NextRequest, NextResponse } from 'next/server'

// Helper function to call DeepSeek API for translation
async function callDeepSeek(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function POST(request: NextRequest) {
  try {
    const { word, sourceLanguage, targetLanguage, nativeLanguage } = await request.json()

    if (!word || !sourceLanguage || !nativeLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      )
    }

    let prompt: string
    let resultType: 'translation' | 'explanation' = 'translation'

    // If the word is in the target language (language being learned), explain it in native language
    // Otherwise, translate it to native language
    if (sourceLanguage === targetLanguage) {
      // Explain the word in native language with definition and example sentence
      resultType = 'explanation'
      prompt = `Word: "${word}" (${targetLanguage}). Explain in ${nativeLanguage}.

JSON format:
{"definition":"brief explanation (10-15 words)","example":{"sentence":"example in ${targetLanguage}","translation":"translation in ${nativeLanguage}"}}

Only JSON, no other text.`
    } else {
      // Translate to native language with definition and example
      resultType = 'translation'
      prompt = `Word: "${word}" (${sourceLanguage}). Translate to ${nativeLanguage}.

JSON format:
{"translation":"1-3 words","definition":"brief explanation (10-15 words)","example":{"sentence":"example in ${sourceLanguage}","translation":"translation in ${nativeLanguage}"}}

Only JSON, no other text.`
    }

    const result = await callDeepSeek(prompt, apiKey)
    let cleanResult = result.trim().replace(/^["']|["']$/g, '')
    
    // Try to parse JSON
    let parsedResult: any = null
    try {
      parsedResult = JSON.parse(cleanResult)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = cleanResult.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || cleanResult.match(/(\{[\s\S]*\})/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[1])
      }
    }

    if (parsedResult) {
      return NextResponse.json({
        word,
        translation: parsedResult.translation || parsedResult.definition || '',
        definition: parsedResult.definition || '',
        example: parsedResult.example || null,
        type: resultType,
      })
    }

    // Fallback to simple text response
    return NextResponse.json({
      word,
      translation: cleanResult,
      definition: '',
      example: null,
      type: resultType,
    })
  } catch (error: any) {
    console.error('Translate API error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to translate/explain word',
        details: 'Please check your DeepSeek API key and try again'
      },
      { status: 500 }
    )
  }
}
