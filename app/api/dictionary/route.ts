import { NextRequest, NextResponse } from 'next/server'

// Helper function to call DeepSeek API
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
      temperature: 0.7,
      max_tokens: 1000,
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
    const { query, nativeLanguage, targetLanguage } = await request.json()

    if (!query || !nativeLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured. Please set DEEPSEEK_API_KEY in .env.local' },
        { status: 500 }
      )
    }

    // Generate definition, examples, and usage note
    const definitionPrompt = `You are a helpful language learning assistant. The user wants to understand "${query}" in ${targetLanguage}. Their native language is ${nativeLanguage}.

Provide:
1. A natural, fun, casual definition in ${nativeLanguage} (like talking to a friend, not a textbook)
2. Two example sentences in ${targetLanguage} with translations in ${nativeLanguage}
3. A usage note explaining cultural nuance, tone, related words, or common confusions

Format as JSON:
{
  "definition": "...",
  "examples": [
    {"sentence": "...", "translation": "..."},
    {"sentence": "...", "translation": "..."}
  ],
  "usageNote": "..."
}

Be concise, lively, and get straight to the point. No greetings or fillers. Always respond with valid JSON only.`

    const text = await callDeepSeek(definitionPrompt, apiKey)
    
    let content: any = null
    try {
      content = JSON.parse(text)
    } catch {
      // Try to extract JSON from markdown code blocks or plain text
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/)
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Failed to parse JSON response from DeepSeek')
      }
    }

    if (!content) {
      throw new Error('Failed to generate content')
    }

    return NextResponse.json({
      word: query,
      definition: content.definition || 'Definition not available',
      imageUrl: '', // Empty - image feature removed
      examples: content.examples || [],
      usageNote: content.usageNote || 'Usage note not available',
    })
  } catch (error: any) {
    console.error('Dictionary API error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate dictionary entry',
        details: 'Please check your DeepSeek API key and try again'
      },
      { status: 500 }
    )
  }
}
