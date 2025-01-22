'use client';

import { useState, useEffect, useRef } from 'react';
import { PuzzleGenerator } from '../utils/puzzleGenerator';

interface PuzzleGridProps {
  words: string[];
  onWordFound: (word: string) => void;
  foundWords: Set<string>;
  subject: string;
  onDownload?: () => Promise<string>;
}

interface SelectionLine {
  start: { row: number; col: number };
  end: { row: number; col: number };
}

interface WordPlacement {
  word: string;
  row: number;
  col: number;
  direction: 'horizontal' | 'vertical' | 'diagonal' | 'reverse-horizontal' | 'reverse-vertical' | 'reverse-diagonal';
}

const HIGHLIGHT_COLORS = {
  light: [
    'bg-green-200 text-green-800',  // Green
    'bg-teal-200 text-teal-800',    // Teal
    'bg-cyan-200 text-cyan-800',    // Cyan
    'bg-sky-200 text-sky-800',      // Sky
    'bg-blue-200 text-blue-800',    // Blue
    'bg-indigo-200 text-indigo-800',// Indigo
    'bg-violet-200 text-violet-800',// Violet
    'bg-purple-200 text-purple-800',// Purple
    'bg-fuchsia-200 text-fuchsia-800', // Fuchsia
    'bg-pink-200 text-pink-800',    // Pink
  ],
  dark: [
    'dark:bg-green-800 dark:text-green-200',
    'dark:bg-teal-800 dark:text-teal-200',
    'dark:bg-cyan-800 dark:text-cyan-200',
    'dark:bg-sky-800 dark:text-sky-200',
    'dark:bg-blue-800 dark:text-blue-200',
    'dark:bg-indigo-800 dark:text-indigo-200',
    'dark:bg-violet-800 dark:text-violet-200',
    'dark:bg-purple-800 dark:text-purple-200',
    'dark:bg-fuchsia-800 dark:text-fuchsia-200',
    'dark:bg-pink-800 dark:text-pink-200',
  ]
};

export default function PuzzleGrid({ words, onWordFound, foundWords, subject, onDownload }: PuzzleGridProps) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [placements, setPlacements] = useState<WordPlacement[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [invalidSelection, setInvalidSelection] = useState(false);
  const [selectionLine, setSelectionLine] = useState<SelectionLine | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (words.length > 0) {
      const generator = new PuzzleGenerator(15);
      const { grid: newGrid, placements: newPlacements } = generator.generatePuzzle(words);
      console.log('Generated grid with placements:', newPlacements); // Debug
      setGrid(newGrid);
      setPlacements(newPlacements);
      setSelectedCells(new Set());
      setSelectionLine(null);
    }
  }, [words]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, selectedCells]);

  useEffect(() => {
    if (typeof onDownload === 'function') {
      onDownload(() => {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return createDownloadableImage(grid, words, subject, isDarkMode);
      });
    }
  }, [grid, words, subject, onDownload]);

  const updateSelectionLine = (cells: Set<string>) => {
    if (cells.size < 2) {
      setSelectionLine(null);
      return;
    }

    const cellsArray = Array.from(cells).map(cell => {
      const [row, col] = cell.split('-').map(Number);
      return { row, col };
    });

    setSelectionLine({
      start: cellsArray[0],
      end: cellsArray[cellsArray.length - 1],
    });
  };

  const getSelectedWord = (selectedCells: Set<string>): string => {
    const cellArray = Array.from(selectedCells).map(cell => {
      const [row, col] = cell.split('-').map(Number);
      return grid[row][col];
    });
    return cellArray.join('');
  };

  const isValidWordSelection = (cells: Set<string>): string | null => {
    if (cells.size < 2) return null;
    
    const selectedWord = getSelectedWord(cells);
    console.log('Selected word:', selectedWord);
    
    // Convert cells to array and check if they form a valid line
    const cellsArray = Array.from(cells).map(cell => {
      const [row, col] = cell.split('-').map(Number);
      return { row, col };
    });

    // Check if the selection matches any placement
    for (const placement of placements) {
      const placedWord = placement.word.toUpperCase();
      const selectedUpperCase = selectedWord.toUpperCase();
      
      // Check if the word matches (forward or reverse)
      if (placedWord === selectedUpperCase || 
          placedWord === selectedUpperCase.split('').reverse().join('')) {
        
        // Verify the cells match the placement
        const matches = cellsArray.every((cell, index) => {
          const { row: startRow, col: startCol, direction } = placement;
          let expectedRow = startRow;
          let expectedCol = startCol;

          if (placedWord === selectedUpperCase) {
            // Forward direction
            switch (direction) {
              case 'horizontal': expectedCol += index; break;
              case 'vertical': expectedRow += index; break;
              case 'diagonal': expectedRow += index; expectedCol += index; break;
              case 'reverse-horizontal': expectedCol -= index; break;
              case 'reverse-vertical': expectedRow -= index; break;
              case 'reverse-diagonal': expectedRow -= index; expectedCol -= index; break;
            }
          } else {
            // Reverse direction
            const reverseIndex = placedWord.length - 1 - index;
            switch (direction) {
              case 'horizontal': expectedCol += reverseIndex; break;
              case 'vertical': expectedRow += reverseIndex; break;
              case 'diagonal': expectedRow += reverseIndex; expectedCol += reverseIndex; break;
              case 'reverse-horizontal': expectedCol -= reverseIndex; break;
              case 'reverse-vertical': expectedRow -= reverseIndex; break;
              case 'reverse-diagonal': expectedRow -= reverseIndex; expectedCol -= reverseIndex; break;
            }
          }

          return cell.row === expectedRow && cell.col === expectedCol;
        });

        if (matches) {
          console.log('Found matching word:', placedWord);
          return placedWord;
        }
      }
    }
    
    console.log('No matching placement found');
    return null;
  };

  const handleMouseDown = (row: number, col: number) => {
    setIsDragging(true);
    const newCells = new Set([`${row}-${col}`]);
    setSelectedCells(newCells);
    setSelectionLine({ start: { row, col }, end: { row, col } });
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging && row >= 0 && row < 15 && col >= 0 && col < 15) {
      const newCells = new Set([...selectedCells]);
      const firstCell = Array.from(selectedCells)[0]?.split('-').map(Number);
      
      if (firstCell) {
        const [startRow, startCol] = firstCell;
        const rowDiff = row - startRow;
        const colDiff = col - startCol;
        
        // Clear previous selection
        newCells.clear();
        newCells.add(`${startRow}-${startCol}`);
        
        // Calculate steps based on direction
        const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
        const rowStep = rowDiff !== 0 ? rowDiff / Math.abs(rowDiff) : 0;
        const colStep = colDiff !== 0 ? colDiff / Math.abs(colDiff) : 0;
        
        // Add cells in the line with bounds checking
        for (let i = 1; i <= steps; i++) {
          const currentRow = startRow + (rowStep * i);
          const currentCol = startCol + (colStep * i);
          if (currentRow >= 0 && currentRow < 15 && currentCol >= 0 && currentCol < 15) {
            newCells.add(`${currentRow}-${currentCol}`);
          }
        }
        
        setSelectedCells(newCells);
        updateSelectionLine(newCells);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || selectedCells.size < 2) {
      setIsDragging(false);
      setSelectedCells(new Set());
      return;
    }

    const foundWord = isValidWordSelection(selectedCells);
    console.log('Validation result:', foundWord);

    if (foundWord) {
      console.log('Found word:', foundWord);
      
      // Only process if word hasn't been found before
      if (!foundWords.has(foundWord)) {
        // Update local state
        onWordFound(foundWord);
        
        // Keep the cells highlighted for found word
        const foundCells = new Set(selectedCells);
        
        // Show success flash
        const successFlash = document.createElement('div');
        successFlash.className = 'absolute inset-0 bg-green-500/30 rounded-lg animate-flash z-30';
        const gridElement = gridRef.current?.querySelector('.grid-cols-15');
        if (gridElement) {
          gridElement.appendChild(successFlash);
          setTimeout(() => successFlash.remove(), 500);
        }
      }
    } else {
      // Invalid selection
      setInvalidSelection(true);
      setTimeout(() => setInvalidSelection(false), 500);
      setSelectedCells(new Set());
    }
    
    setIsDragging(false);
  };

  if (!grid.length) return null;

  const getHighlightStyle = (cells: Set<string>) => {
    if (cells.size < 2 || !gridRef.current) return {};
    
    const cellsArray = Array.from(cells).map(cell => {
      const [row, col] = cell.split('-').map(Number);
      return { row, col };
    });

    const first = cellsArray[0];
    const last = cellsArray[cellsArray.length - 1];
    
    const cellSize = gridRef.current.querySelector('div')?.offsetWidth || 0;
    const startX = first.col * cellSize + (cellSize / 2);
    const startY = first.row * cellSize + (cellSize / 2);
    const endX = last.col * cellSize + (cellSize / 2);
    const endY = last.row * cellSize + (cellSize / 2);
    
    const length = Math.sqrt(
      Math.pow(endX - startX, 2) + 
      Math.pow(endY - startY, 2)
    );
    
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    
    return {
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${length}px`,
      height: '1.75rem',
      transform: `rotate(${angle}deg)`,
      transformOrigin: 'left center',
    };
  };

  const generateTitle = (subject: string): string => {
    const formatted = subject
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toLowerCase()
      .trim();
    
    const titleCase = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `Search for words related to ${titleCase}`;
  };

  const createDownloadableImage = async (
    grid: string[][],
    words: string[],
    subject: string,
    darkMode: boolean = false
  ): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    const cellSize = 40;
    const padding = 40;
    const gridSize = grid.length * cellSize;
    const wordListHeight = 120;
    const logoHeight = 60; // Height for logo area
    
    canvas.width = gridSize + (padding * 2);
    canvas.height = gridSize + wordListHeight + logoHeight + (padding * 2); // Added logoHeight
    
    // Set colors based on theme
    const textColor = darkMode ? '#ffffff' : '#000000';
    const gridBgColor = darkMode ? '#2a2a2a' : '#f3f4f6';
    const cellBgColor = darkMode ? '#404040' : '#ffffff';
    const borderColor = darkMode ? '#404040' : '#e5e7eb';
    
    // Make canvas background transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load and draw logo
    const logo = new Image();
    await new Promise((resolve, reject) => {
      logo.onload = resolve;
      logo.onerror = reject;
      logo.src = '/xword_logo_print.webp';
    });
    
    // Draw logo centered at the top
    const logoWidth = (logo.width * logoHeight) / logo.height; // maintain aspect ratio
    const logoX = (canvas.width - logoWidth) / 2;
    ctx.drawImage(logo, logoX, padding, logoWidth, logoHeight);
    
    // Draw title with smaller, bold font
    ctx.fillStyle = textColor;
    ctx.font = 'bold 20px Arial'; // Reduced from 24px
    ctx.textAlign = 'center';
    ctx.fillText(generateTitle(subject), canvas.width / 2, padding + logoHeight + 30);
    
    // Adjust word list position to account for logo
    const wordListY = padding + logoHeight + 60;
    
    // Draw word list container with border
    ctx.fillStyle = gridBgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padding, wordListY, canvas.width - (padding * 2), 65, 8);
    ctx.fill();
    ctx.stroke();
    
    // Draw word list in two rows
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    const wordsPerRow = 5;
    const wordWidth = (canvas.width - (padding * 2)) / wordsPerRow;
    const wordPadding = 10;
    const rowHeight = 28;
    
    words.forEach((word, index) => {
      const row = Math.floor(index / wordsPerRow);
      const col = index % wordsPerRow;
      const x = padding + (col * wordWidth) + wordPadding;
      const y = wordListY + 25 + (row * rowHeight);
      
      // Calculate word width to check if it fits
      const wordMetrics = ctx.measureText(word);
      const maxWordWidth = wordWidth - (wordPadding * 2);
      
      // Adjust font size if word is too wide
      let fontSize = 14;
      if (wordMetrics.width > maxWordWidth) {
        fontSize = Math.floor((maxWordWidth / wordMetrics.width) * 14);
        ctx.font = `bold ${fontSize}px Arial`;
      }
      
      ctx.fillText(word.toUpperCase(), x, y);
      
      // Reset font size for next word
      ctx.font = 'bold 14px Arial';
    });
    
    // Draw grid background with border
    const gridY = wordListY + 85; // Adjust grid position to be below word list
    
    ctx.fillStyle = gridBgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padding - 10, gridY - 10, gridSize + 20, gridSize + 20, 8);
    ctx.fill();
    ctx.stroke();
    
    // Draw grid cells
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        // Draw cell background
        ctx.fillStyle = cellBgColor;
        ctx.fillRect(
          padding + (j * cellSize),
          gridY + (i * cellSize),
          cellSize - 1,
          cellSize - 1
        );
        
        // Draw letter
        ctx.fillStyle = textColor;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          cell,
          padding + (j * cellSize) + (cellSize / 2),
          gridY + (i * cellSize) + (cellSize / 2) + 7
        );
      });
    });
    
    return canvas.toDataURL('image/webp', 0.9);
  };

  // Add this helper function to blend colors
  const blendColors = (foundWords: string[], words: string[], index: number) => {
    if (foundWords.length === 1) {
      return `${HIGHLIGHT_COLORS.light[words.findIndex(w => w.toUpperCase() === foundWords[0])]} 
              ${HIGHLIGHT_COLORS.dark[words.findIndex(w => w.toUpperCase() === foundWords[0])]}`;
    }
    
    // For intersecting words, create a mixed color class
    return foundWords.map(word => {
      const wordIndex = words.findIndex(w => w.toUpperCase() === word);
      return `bg-blend-multiply dark:bg-blend-multiply 
              ${HIGHLIGHT_COLORS.light[wordIndex]} 
              ${HIGHLIGHT_COLORS.dark[wordIndex]}`;
    }).join(' ');
  };

  return (
    <div className="select-none w-full" ref={gridRef}>
      <div className="relative grid grid-cols-15 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5 max-w-fit mx-auto overflow-hidden">
        {/* Grid cells */}
        {grid.map((row, i) => (
          row.map((cell, j) => {
            const cellKey = `${i}-${j}`;
            const isSelected = selectedCells.has(cellKey);
            
            // Find all words that use this cell
            const foundWordsForCell = Array.from(foundWords).filter(foundWord => 
              words.includes(foundWord) && 
              placements.some(p => 
                p.word.toUpperCase() === foundWord && 
                isPartOfWord(p, i, j)
              )
            );

            // Get blended highlight color if multiple words use this cell
            const highlightColor = foundWordsForCell.length > 0 
              ? blendColors(foundWordsForCell, words, i)
              : '';

            return (
              <div
                key={cellKey}
                className={`
                  w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 
                  flex items-center justify-center 
                  font-bold text-xs sm:text-sm md:text-base 
                  transition-colors duration-200
                  ${foundWordsForCell.length > 0 
                    ? highlightColor
                    : isSelected 
                      ? 'bg-blue-200 dark:bg-blue-600' 
                      : 'bg-white dark:bg-gray-800'
                  }
                  cursor-pointer select-none
                  relative z-10
                `}
                onMouseDown={() => foundWordsForCell.length === 0 && handleMouseDown(i, j)}
                onMouseEnter={() => handleMouseEnter(i, j)}
              >
                {cell}
              </div>
            );
          })
        ))}

        {invalidSelection && (
          <div className="absolute inset-0 bg-red-500/30 rounded-lg animate-flash z-30" />
        )}
      </div>
    </div>
  );
}

// Helper function to check if a cell is part of a word
function isPartOfWord(placement: WordPlacement, row: number, col: number): boolean {
  const { word, row: startRow, col: startCol, direction } = placement;
  const len = word.length;

  for (let i = 0; i < len; i++) {
    let currentRow = startRow;
    let currentCol = startCol;

    switch (direction) {
      case 'horizontal': currentCol += i; break;
      case 'vertical': currentRow += i; break;
      case 'diagonal': currentRow += i; currentCol += i; break;
      case 'reverse-horizontal': currentCol -= i; break;
      case 'reverse-vertical': currentRow -= i; break;
      case 'reverse-diagonal': currentRow -= i; currentCol -= i; break;
    }

    if (currentRow === row && currentCol === col) return true;
  }
  return false;
}