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
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: 
              "You are a word search puzzle generator. Generate EXACTLY 10 words following these strict rules:\n\n" +
              "CRITICAL RULES:\n" +
              "- EXACTLY 10 words total\n" +
              "- Each word MUST be 3-12 letters long\n" +
              "- NO compound words (e.g., 'smartcontract' is not allowed, use 'smart' or 'contract' instead)\n" +
              "- NO special characters, numbers, or spaces\n" +
              "- Only basic English letters A-Z\n" +
              "- Words must be related to the subject\n\n" +
              "FORMAT:\n" +
              "- One word per line\n" +
              "- All UPPERCASE\n" +
              "- Just the words, no numbering or bullets\n\n" +
              "Example of VALID words:\n" +
              "BLOCK\n" +
              "CHAIN\n" +
              "LEDGER\n" +
              "CRYPTO\n" +
              "(continue until exactly 10 words)"
          },
          {
            role: "user",
            content: `Generate exactly 10 simple words (no compound words) related to: ${subject}`
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 200,
      });

      const content = completion.choices[0].message.content?.trim() || '';
      console.log('Raw response:', content);

      let wordList = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(word => word.replace(/[^A-Za-z]/g, '').toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 12);

      console.log('Processed words:', wordList);

      if (wordList && wordList.length === 10) {
        console.log(`Successfully generated 10 words on attempt ${attempts + 1}`);
        return NextResponse.json({ words: wordList });
      }

      console.warn(`Attempt ${attempts + 1}: Got ${wordList?.length} words instead of 10, retrying...`);
      attempts++;
    }

    console.error(`Failed to generate exactly 10 words after ${maxAttempts} attempts`);
    return NextResponse.json(
      { 
        error: `Failed to generate exactly 10 words after ${maxAttempts} attempts. Please try again.`
      },
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