import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

// Try to get available models first
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
        // Get the first available model name (without the full path)
        const modelName = models[0].name.split('/').pop()
        console.log(`Found available model: ${modelName}`)
        return modelName || 'gemini-pro'
      }
    }
  } catch (error) {
    console.error('Error fetching models list:', error)
  }
  
  // Fallback model names to try
  return 'gemini-pro'
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

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
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

    let content: any = null
    let lastError: any = null
    
    // Get available model name
    const modelName = await getAvailableModelName(apiKey)
    
    // Try SDK first
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(definitionPrompt)
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
      console.error('SDK Error:', sdkError.message)
      lastError = sdkError
      
      // Fallback: Try direct REST API call with v1 (not v1beta)
      const modelsToTry = [modelName, 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
      
      for (const tryModel of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${tryModel}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: definitionPrompt
                  }]
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
              
              if (content) {
                console.log(`Successfully used model: ${tryModel}`)
                break
              }
            }
          } else {
            const errorText = await response.text()
            console.log(`Model ${tryModel} failed: ${response.status}`)
            if (tryModel === modelsToTry[modelsToTry.length - 1]) {
              // Last model failed
              throw new Error(`API Error: ${response.status} - ${errorText}`)
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
      const errorMsg = lastError?.message || 'Failed to generate content'
      return NextResponse.json(
        { 
          error: errorMsg,
          details: 'Please verify your API key is valid and has access to Gemini models. Check available models at: http://localhost:3000/api/list-models'
        },
        { status: 500 }
      )
    }

    // Image generation removed - no imageUrl needed
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
        details: 'Please check your API key and try again'
      },
      { status: 500 }
    )
  }
}
