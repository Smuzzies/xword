import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { subject } = await req.json();
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const prompt = `Generate 10 unique words related to "${subject}". 
      CRITICAL: Return ONLY comma-separated words with NO numbers, periods, or special formatting.
      Requirements:
      - Each word MUST be between 3-15 characters long (STRICTLY enforced, no exceptions)
      - NO two-letter words (like HP, LG, UP, IT, IS, etc.)
      - Words must be common and recognizable
      - DO NOT include the word "${subject}" itself in the list
      - No proper nouns (except for relevant brands with 3+ letters)
      - No abbreviations, acronyms, or hyphenated words
      - No contractions (like isn't, don't)
      - Words should be single words, no spaces
      - Words should be suitable for all ages
      - You MUST return EXACTLY 10 words, no more, no less
      EXACT FORMAT REQUIRED: word,word,word,word,word,word,word,word,word,word`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 100,
      });

      const content = completion.choices[0].message.content?.trim() || '';
      console.log('Raw response:', content);

      let wordList = content
        .replace(/\d+\.\s*/g, '')  // Remove any numbered list formatting
        .replace(/\s+/g, '')       // Remove all whitespace
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0)
        .map(word => word.replace(/[^A-Za-z]/g, '').toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 15);

      console.log('Processed words:', wordList);

      if (wordList && wordList.length === 10) {
        console.log(`Successfully generated 10 words on attempt ${attempts + 1}`);
        return NextResponse.json({ words: wordList });
      }

      console.warn(`Attempt ${attempts + 1}: Got ${wordList?.length} words instead of 10, retrying...`);
      attempts++;
    }

    return NextResponse.json(
      { error: `Failed to generate exactly 10 words after ${maxAttempts} attempts. Please try again.` },
      { status: 500 }
    );

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating words. Please try again.' },
      { status: 500 }
    );
  }
} 