import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key not found in environment variables',
        hasKey: false
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Try to list available models
    try {
      // Try to get model info directly
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      const result = await model.generateContent('test')
      const response = await result.response
      const text = response.text()
      
      return NextResponse.json({
        success: true,
        message: 'API connection successful!',
        model: 'gemini-pro',
        testResponse: text.substring(0, 50),
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
