import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

async function getAvailableModelName(apiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    )
    
    if (response.ok) {
      const data = await response.json()
      const models = data.models?.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      ) || []
      
      if (models.length > 0) {
        return models[0].name.split('/').pop() || 'gemini-pro'
      }
    }
  } catch (error) {
    console.error('Error fetching models list:', error)
  }
  
  return 'gemini-pro'
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

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      )
    }

    const wordList = words.map((w: any) => w.word).join(', ')

    const prompt = `Create a fun, engaging short story (3-4 paragraphs) in ${targetLanguage} that naturally incorporates these words/phrases: ${wordList}. 

The story should be entertaining and help the reader remember these words. After the story, provide a translation in ${nativeLanguage}.

Format as JSON:
{
  "story": "...",
  "translation": "..."
}

Always respond with valid JSON only.`

    let content: any = null
    let lastError: any = null
    
    const modelName = await getAvailableModelName(apiKey)
    
    // Try SDK first
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        content = JSON.parse(text)
      } catch {
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[1])
        }
      }
    } catch (sdkError: any) {
      lastError = sdkError
      
      // Fallback: Direct REST API with v1
      const modelsToTry = [modelName, 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
      
      for (const tryModel of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${tryModel}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: prompt }]
                }]
              })
            }
          )

          if (response.ok) {
            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            
            if (text) {
              try {
                content = JSON.parse(text)
              } catch {
                const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/)
                if (jsonMatch) {
                  content = JSON.parse(jsonMatch[1])
                }
              }
              
              if (content) break
            }
          }
        } catch (restError: any) {
          if (tryModel === modelsToTry[modelsToTry.length - 1]) {
            lastError = restError
          }
          continue
        }
      }
    }

    if (!content) {
      throw lastError || new Error('Failed to generate story')
    }

    return NextResponse.json({
      story: content.story || 'Story not available',
      translation: content.translation || 'Translation not available',
    })
  } catch (error: any) {
    console.error('Story API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate story' },
      { status: 500 }
    )
  }
}
