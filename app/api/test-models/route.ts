import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key not found in environment variables',
        hasKey: false
      })
    }

    // Test DeepSeek API connection
    try {
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
              content: 'Say "test"',
            },
          ],
          max_tokens: 10,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json({
          success: false,
          error: `API Error: ${response.status}`,
          errorDetails: errorText,
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          suggestion: 'Check if your DeepSeek API key is valid'
        })
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''
      
      return NextResponse.json({
        success: true,
        message: 'DeepSeek API connection successful!',
        model: 'deepseek-chat',
        testResponse: text,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
        errorDetails: error.toString(),
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        suggestion: 'Check if your API key has the correct permissions'
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Unknown error',
      details: error.toString()
    }, { status: 500 })
  }
}
