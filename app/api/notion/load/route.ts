import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { NotebookEntry } from '../../../types'

export async function POST(request: NextRequest) {
  try {
    const { databaseId, apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Notion API key not provided' },
        { status: 400 }
      )
    }

    if (!databaseId) {
      return NextResponse.json(
        { error: 'Notion database ID not provided' },
        { status: 400 }
      )
    }

    const notion = new Client({ auth: apiKey })

    const response = await notion.databases.query({
      database_id: databaseId,
    })

    const entries: NotebookEntry[] = []

    for (const page of response.results) {
      // Skip archived pages
      if ((page as any).archived) continue

      const props = (page as any).properties
      
      const word = props.Word?.title?.[0]?.plain_text || ''
      if (!word) continue

      const definition = props.Definition?.rich_text?.[0]?.plain_text || ''
      const usageNote = props['Usage Note']?.rich_text?.[0]?.plain_text || ''
      const savedAt = props['Saved At']?.date?.start 
        ? new Date(props['Saved At'].date.start)
        : new Date()
      
      // Parse examples
      const examplesText = props.Examples?.rich_text?.[0]?.plain_text || ''
      const examples = examplesText.split('\n\n').map(line => {
        const [sentence, translation] = line.split(' → ')
        return {
          sentence: sentence?.trim() || '',
          translation: translation?.trim() || '',
        }
      }).filter(e => e.sentence && e.translation)

      entries.push({
        id: `${word}-${Date.now()}-${Math.random()}`,
        word,
        definition,
        imageUrl: '',
        examples: examples.length > 0 ? examples : [],
        usageNote,
        savedAt,
      })
    }

    return NextResponse.json({ 
      success: true,
      entries,
      count: entries.length
    })
  } catch (error: any) {
    console.error('Notion load error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to load from Notion',
        details: 'Please check your Notion API key and database ID'
      },
      { status: 500 }
    )
  }
}
