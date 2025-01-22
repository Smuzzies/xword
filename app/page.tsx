'use client';

import { useState, useRef } from "react";
import Image from "next/image";
import PuzzleGrid from './components/PuzzleGrid';

function GameStatus({ total, found }: { total: number; found: number }) {
  const remaining = total - found;
  
  return (
    <div className="p-4 bg-[#374151] rounded-lg shadow">
      {remaining > 0 ? (
        <p className="text-[#ccff00]">
          {remaining} word{remaining !== 1 ? 's' : ''} remaining
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[#ccff00] font-semibold">
            🎉 Puzzle Complete!
          </p>
          <p className="text-[#ccff00]">
            Press Reset to start a new game
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const downloadRef = useRef<(() => Promise<string>) | undefined>();
  const MAX_CHARS = 50;

  const handleGeneratePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFoundWords(new Set());

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
        <div className="flex justify-center mb-2">
          <Image
            src="/xword_logo.webp"
            alt="XWord"
            width={300}
            height={90}
            priority
            className="h-auto"
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Generate custom word search puzzles about any topic
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        <form onSubmit={handleGeneratePuzzle} className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                <Image
                  src="/xword_icon.png"
                  alt=""
                  width={20}
                  height={20}
                  className="opacity-60"
                />
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Enter a subject (e.g., 'blockchain')"
                maxLength={MAX_CHARS}
                className="w-full p-3 pl-11 pr-24 rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 
                             bg-white dark:bg-gray-800 px-1">
                {MAX_CHARS - subject.length} chars left
              </span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !subject.trim()}
              className="px-6 py-3 bg-[#ccff00] text-black rounded-lg hover:bg-[#b3e600] 
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
              
              <GameStatus 
                total={words.length} 
                found={foundWords.size} 
              />
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
              
              <div className="flex justify-between w-full gap-4">
                <button
                  className="flex-1 px-4 py-2 bg-[#ccff00] text-black rounded hover:bg-[#b3e600] 
                            flex items-center justify-center gap-2 transition-colors"
                  onClick={handleDownload}
                >
                  <i className="fas fa-download"></i>
                  Download Puzzle
                </button>
                
                <button
                  className="flex-1 px-4 py-2 bg-[#ccff00] text-black rounded hover:bg-[#b3e600] 
                            flex items-center justify-center gap-2 transition-colors"
                  onClick={() => {
                    setWords([]);
                    setFoundWords(new Set());
                  }}
                >
                  <i className="fas fa-rotate-left"></i>
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
