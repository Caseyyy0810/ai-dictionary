import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { query, targetLanguage } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
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

    // Step 1: Use Gemini to understand the word and generate a detailed, relevant image description
    // This ensures the image will be related to the word and understandable
    let detailedImagePrompt = ''
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      
      // Generate a detailed image description in the target language context
      const descriptionPrompt = `You are creating an image for a language learning dictionary. The word/phrase is "${query}" in ${targetLanguage}.

Generate a detailed, specific image description that clearly represents this word/phrase. The image should:
1. Be directly and clearly related to the word/phrase
2. Be educational and suitable for language learning
3. Be visually clear and easy to understand
4. Show the main concept or meaning of the word

Return ONLY the image description in English (for image generation), be specific and detailed (50-80 words). Do not include any explanations or additional text, just the description.`

      const result = await model.generateContent(descriptionPrompt)
      const response = await result.response
      detailedImagePrompt = response.text().trim()
      
      // Clean up the response (remove markdown, quotes, etc.)
      detailedImagePrompt = detailedImagePrompt
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .trim()
      
      console.log('Generated image prompt:', detailedImagePrompt)
    } catch (error: any) {
      console.error('Error generating image description:', error.message)
      // Fallback to a basic prompt
      detailedImagePrompt = `A clear, colorful, educational illustration representing "${query}" in ${targetLanguage}. The image should be suitable for a language learning dictionary - bright, fun, visually clear, and directly related to the word's meaning.`
    }

    // Step 2: Try to generate image using AI APIs
    let imageUrl = ''
    let imageBase64 = ''

    // Try using Gemini 2.5 Flash with image generation capability
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `Generate an image: ${detailedImagePrompt}`
              }]
            }],
            generationConfig: {
              responseModalities: ['IMAGE'],
              imageConfig: {
                width: 1024,
                height: 1024
              }
            }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        // Check if response contains image data
        if (data.candidates && data.candidates[0]?.content?.parts) {
          const imagePart = data.candidates[0].content.parts.find(
            (part: any) => part.inlineData || part.imageUrl
          )
          
          if (imagePart?.inlineData) {
            // Base64 image data
            imageBase64 = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
            imageUrl = imageBase64
          } else if (imagePart?.imageUrl) {
            imageUrl = imagePart.imageUrl
          }
        }
      }
    } catch (error: any) {
      console.error('Gemini 2.5 Flash Image API error:', error.message)
    }

    // Fallback: Try using Imagen API
    if (!imageUrl) {
      try {
        const imagenResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImages?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: detailedImagePrompt,
              number_of_images: 1,
              aspect_ratio: '1:1',
              safety_filter_level: 'block_some',
              person_generation: 'allow_all',
            }),
          }
        )

        if (imagenResponse.ok) {
          const imagenData = await imagenResponse.json()
          if (imagenData.generatedImages && imagenData.generatedImages.length > 0) {
            const generatedImage = imagenData.generatedImages[0]
            if (generatedImage.imageUrl) {
              imageUrl = generatedImage.imageUrl
            } else if (generatedImage.bytesBase64Encoded) {
              imageUrl = `data:image/png;base64,${generatedImage.bytesBase64Encoded}`
            }
          }
        }
      } catch (imagenError: any) {
        console.error('Imagen API error:', imagenError.message)
      }
    }

    // Step 3: If AI image generation fails, use Gemini to generate better search terms
    // and use Unsplash with the AI-generated, relevant search terms
    if (!imageUrl) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
        
        // Generate specific, relevant search terms based on the word's meaning
        const searchPrompt = `The word is "${query}" in ${targetLanguage}. Generate 2-4 specific English keywords for searching an image that clearly represents this word. The keywords should be directly related to the word's meaning and help find a relevant image. Return ONLY the keywords separated by spaces, nothing else.`
        
        const result = await model.generateContent(searchPrompt)
        const response = await result.response
        let searchTerms = response.text().trim()
        
        // Clean up the search terms
        searchTerms = searchTerms
          .replace(/^["']|["']$/g, '')
          .replace(/[^\w\s-]/g, ' ')
          .trim()
          .split(/\s+/)
          .slice(0, 4)
          .join(' ')
        
        console.log('Generated search terms:', searchTerms)
        
        // Use Unsplash with the AI-generated, relevant search terms
        // This ensures the image is related to the word
        imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(searchTerms || query)}&sig=${Date.now()}`
      } catch (error: any) {
        console.error('Search query generation error:', error.message)
        // Final fallback - use the word itself
        imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(query)}&sig=${Date.now()}`
      }
    }

    return NextResponse.json({
      imageUrl,
      query: query,
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    
    // Fallback to a simple placeholder
    const body = await request.json().catch(() => ({}))
    const { query } = body
    const fallbackUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`
    
    return NextResponse.json({
      imageUrl: fallbackUrl,
      query: query || 'word',
    })
  }
}
