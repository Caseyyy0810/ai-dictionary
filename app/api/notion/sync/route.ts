import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { NotebookEntry } from '../../../types'

export async function POST(request: NextRequest) {
  try {
    const { notebook, databaseId, apiKey } = await request.json()

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

    // Get existing pages in the database
    const existingPages = await notion.databases.query({
      database_id: databaseId,
    })

    // Create a map of existing entries by word
    const existingMap = new Map<string, string>()
    for (const page of existingPages.results) {
      const props = (page as any).properties
      if (props.Word?.title?.[0]?.plain_text) {
        const word = props.Word.title[0].plain_text
        existingMap.set(word, page.id)
      }
    }

    // Sync each entry
    for (const entry of notebook) {
      const pageData: any = {
        parent: { database_id: databaseId },
        properties: {
          Word: {
            title: [{ text: { content: entry.word } }],
          },
          Definition: {
            rich_text: [{ text: { content: entry.definition || '' } }],
          },
          'Usage Note': {
            rich_text: [{ text: { content: entry.usageNote || '' } }],
          },
          'Saved At': {
            date: { start: entry.savedAt.toISOString() },
          },
          Examples: {
            rich_text: [{
              text: {
                content: entry.examples.map(e => 
                  `${e.sentence} → ${e.translation}`
                ).join('\n\n')
              }
            }],
          },
        },
      }

      const existingId = existingMap.get(entry.word)
      if (existingId) {
        // Update existing page
        try {
          await notion.pages.update({
            page_id: existingId,
            properties: pageData.properties,
          })
        } catch (error: any) {
          console.error(`Error updating page for ${entry.word}:`, error.message)
        }
      } else {
        // Create new page
        try {
          await notion.pages.create(pageData)
        } catch (error: any) {
          console.error(`Error creating page for ${entry.word}:`, error.message)
        }
      }
    }

    // Archive entries that are no longer in notebook
    for (const [word, pageId] of existingMap.entries()) {
      if (!notebook.find(e => e.word === word)) {
        try {
          await notion.pages.update({
            page_id: pageId,
            archived: true,
          })
        } catch (error: any) {
          console.error(`Error archiving page for ${word}:`, error.message)
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully synced ${notebook.length} entries to Notion`
    })
  } catch (error: any) {
    console.error('Notion sync error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync to Notion',
        details: 'Please check your Notion API key and database ID'
      },
      { status: 500 }
    )
  }
}
