'use client';

import { useState, useRef } from "react";
import Image from "next/image";
import PuzzleGrid from './components/PuzzleGrid';

export default function Home() {
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const downloadRef = useRef<(() => Promise<string>) | undefined>();

  const handleGeneratePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate words');
      }

      if (!data.words || data.words.length !== 10) {
        throw new Error('Invalid response: Did not receive exactly 10 words');
      }

      setWords(data.words);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate words. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordFound = (word: string) => {
    console.log('Word found in parent:', word);
    setFoundWords(prev => {
      const newSet = new Set(prev);
      newSet.add(word.toUpperCase());
      return newSet;
    });
  };

  const handleDownload = async () => {
    if (downloadRef.current) {
      try {
        const dataUrl = await downloadRef.current();
        const link = document.createElement('a');
        link.download = `xword-${subject.toLowerCase().replace(/\s+/g, '-')}.webp`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download puzzle:', error);
      }
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">XWord</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate custom word search puzzles about any topic
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        <form onSubmit={handleGeneratePuzzle} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter a subject (e.g., 'blockchain')"
              className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !subject.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Puzzle'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {words.length > 0 && (
            <div className="space-y-4">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Generated Words</h2>
                <ul className="space-y-2">
                  {words.map((word, index) => {
                    const isFound = foundWords.has(word.toUpperCase());
                    console.log(`Checking word ${word.toUpperCase()}, found: ${isFound}`);
                    return (
                      <li 
                        key={index}
                        className={`
                          p-2 bg-gray-50 dark:bg-gray-700 rounded flex items-center
                          transition-all duration-200
                          ${isFound ? 'line-through text-gray-400 dark:text-gray-500 bg-green-50 dark:bg-green-900/20' : ''}
                        `}
                      >
                        <span className="w-8 text-gray-400">{index + 1}.</span>
                        <span className="font-mono">{word.toUpperCase()}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {words.length > 0 && (
            <div className="space-y-4 md:col-span-2">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <PuzzleGrid 
                  words={words} 
                  onWordFound={handleWordFound}
                  foundWords={foundWords}
                  subject={subject}
                  onDownload={fn => downloadRef.current = fn}
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={handleDownload}
                >
                  Download Puzzle
                </button>
                
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={() => setWords([])}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
