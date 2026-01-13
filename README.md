# AI Dictionary

An intelligent, AI-powered dictionary application for language learning with images, examples, pronunciation, and study features.

## Features

- **Multi-language Support**: Choose from 5 popular languages (English, Chinese, Spanish, Hindi, Arabic)
- **AI-Powered Definitions**: Natural, casual explanations in your native language
- **Visual Learning**: AI-generated images for each word/phrase
- **Example Sentences**: Two contextual examples with translations
- **Usage Notes**: Cultural nuances, tone, and related words explained
- **Audio Pronunciation**: Clear pronunciation for words and sentences
- **Notebook**: Save words for later review
- **Story Mode**: AI generates stories using your saved words
- **Study Mode**: Interactive flashcards with flip animation
- **Mobile-Optimized**: Beautiful, responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

   Get your DeepSeek API key from: https://platform.deepseek.com/api_keys

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **DeepSeek API** - AI-powered features for text generation
- **Web Speech API** - Browser-based text-to-speech for pronunciation
- **Framer Motion** - Animations
- **Lucide React** - Icons

## Usage

1. Select your native language and target language
2. Enter a word, phrase, or sentence
3. View the definition, image, examples, and usage notes
4. Click the speaker icon to hear pronunciation
5. Save words to your notebook for later review
6. Use Story mode to create stories with your saved words
7. Use Study mode to practice with flashcards

## Notes

- Requires a DeepSeek API key
- Get your API key from: https://platform.deepseek.com/api_keys
- Audio pronunciation uses browser's Web Speech API (no API key needed)
- Notebook data is stored in browser localStorage
