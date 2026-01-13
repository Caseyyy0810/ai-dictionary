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
      temperature: 0.8,
      max_tokens: 500,
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
    const { words, nativeLanguage, targetLanguage } = await request.json()

    if (!words || words.length === 0 || !nativeLanguage || !targetLanguage) {
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

    const wordList = words.map((w: any) => w.word).join(', ')
    const wordArray = words.map((w: any) => w.word)

    const prompt = `Create a SHORT, fun story (ONE paragraph, 3-5 sentences) in ${targetLanguage} that naturally uses these words/phrases: ${wordList}. 

Keep it SHORT - just one paragraph. Make it entertaining. After the story, provide a translation in ${nativeLanguage}.

Format as JSON:
{
  "story": "...",
  "translation": "..."
}

Always respond with valid JSON only.`

    const text = await callDeepSeek(prompt, apiKey)
    
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
      throw new Error('Failed to generate story')
    }

    return NextResponse.json({
      story: content.story || 'Story not available',
      translation: content.translation || 'Translation not available',
      words: wordArray, // Return words for highlighting
    })
  } catch (error: any) {
    console.error('Story API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate story' },
      { status: 500 }
    )
  }
}
