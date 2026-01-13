import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      provider: 'DeepSeek',
      availableModels: [
        {
          name: 'deepseek-chat',
          displayName: 'DeepSeek Chat',
          description: 'Main model for chat completions'
        }
      ],
      note: 'DeepSeek API uses OpenAI-compatible format. Model name: deepseek-chat'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to list models'
    }, { status: 500 })
  }
}
