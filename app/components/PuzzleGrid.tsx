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

    return `XWord: Find the ${titleCase}`;
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
    
    canvas.width = gridSize + (padding * 2);
    canvas.height = gridSize + wordListHeight + (padding * 2);
    
    // Set colors based on theme - removed background color
    const textColor = darkMode ? '#ffffff' : '#000000';
    const gridBgColor = darkMode ? '#2a2a2a' : '#f3f4f6';
    const cellBgColor = darkMode ? '#404040' : '#ffffff';
    const borderColor = darkMode ? '#404040' : '#e5e7eb';
    
    // Make canvas background transparent (don't fill background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(generateTitle(subject), canvas.width / 2, padding);
    
    // Draw word list container with border
    const wordListY = padding + 30;
    ctx.fillStyle = gridBgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padding, wordListY, canvas.width - (padding * 2), 65, 8); // Slightly taller container
    ctx.fill();
    ctx.stroke();
    
    // Draw word list in two rows
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Arial'; // Made font bold
    ctx.textAlign = 'left';
    
    const wordsPerRow = 5;
    const wordWidth = (canvas.width - (padding * 2)) / wordsPerRow;
    const wordPadding = 10;
    const rowHeight = 28; // Increased space between rows
    
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
        ctx.font = `bold ${fontSize}px Arial`; // Keep bold when adjusting size
      }
      
      ctx.fillText(word.toUpperCase(), x, y);
      
      // Reset font size for next word
      ctx.font = 'bold 14px Arial'; // Reset to bold
    });
    
    // Draw grid background with border (now with more space above)
    ctx.fillStyle = gridBgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    const gridX = padding;
    const gridY = wordListHeight + padding + 10; // Added extra padding above grid
    
    ctx.beginPath();
    ctx.roundRect(gridX - 10, gridY - 10, gridSize + 20, gridSize + 20, 8);
    ctx.fill();
    ctx.stroke();
    
    // Draw grid cells
    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        // Draw cell background
        ctx.fillStyle = cellBgColor;
        ctx.fillRect(
          gridX + (j * cellSize),
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
          gridX + (j * cellSize) + (cellSize / 2),
          gridY + (i * cellSize) + (cellSize / 2) + 7
        );
      });
    });
    
    return canvas.toDataURL('image/webp', 0.9);
  };

  return (
    <div className="select-none w-full" ref={gridRef}>
      <div className="relative grid grid-cols-15 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5 max-w-fit mx-auto overflow-hidden">
        {/* Grid cells */}
        {grid.map((row, i) => (
          row.map((cell, j) => {
            const cellKey = `${i}-${j}`;
            const isSelected = selectedCells.has(cellKey);
            const isFoundCell = Array.from(foundWords).some(foundWord => {
              return words.includes(foundWord) && 
                     placements.some(p => 
                       p.word.toUpperCase() === foundWord && 
                       isPartOfWord(p, i, j)
                     );
            });

            return (
              <div
                key={cellKey}
                className={`
                  w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 
                  flex items-center justify-center 
                  font-bold text-xs sm:text-sm md:text-base 
                  transition-colors duration-200
                  ${isFoundCell 
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' 
                    : isSelected 
                      ? 'bg-blue-200 dark:bg-blue-600' 
                      : 'bg-white dark:bg-gray-800'
                  }
                  cursor-pointer select-none
                  relative z-10
                `}
                onMouseDown={() => !isFoundCell && handleMouseDown(i, j)}
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