import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Call ListModels API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: `Failed to list models: ${response.status}`,
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Filter models that support generateContent
    const availableModels = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || []

    return NextResponse.json({
      success: true,
      allModels: data.models?.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods
      })) || [],
      availableModels: availableModels.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        shortName: m.name.split('/').pop() // Get just the model name part
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to list models'
    }, { status: 500 })
  }
}
