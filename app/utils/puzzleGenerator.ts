type Direction = 'horizontal' | 'vertical' | 'diagonal' | 'reverse-horizontal' | 'reverse-vertical' | 'reverse-diagonal';

interface WordPlacement {
  word: string;
  row: number;
  col: number;
  direction: Direction;
}

export class PuzzleGenerator {
  private grid: string[][];
  private size: number;
  private placements: WordPlacement[];
  private directions: Direction[];

  constructor(size: number = 15) {
    this.size = size;
    this.grid = Array(size).fill(null).map(() => Array(size).fill(''));
    this.placements = [];
    this.directions = [
      'horizontal', 'vertical', 'diagonal',
      'reverse-horizontal', 'reverse-vertical', 'reverse-diagonal'
    ];
  }

  private canPlaceWord(word: string, row: number, col: number, direction: Direction): boolean {
    const len = word.length;
    
    for (let i = 0; i < len; i++) {
      let currentRow = row;
      let currentCol = col;

      switch (direction) {
        case 'horizontal':
          currentCol += i;
          break;
        case 'vertical':
          currentRow += i;
          break;
        case 'diagonal':
          currentRow += i;
          currentCol += i;
          break;
        case 'reverse-horizontal':
          currentCol -= i;
          break;
        case 'reverse-vertical':
          currentRow -= i;
          break;
        case 'reverse-diagonal':
          currentRow -= i;
          currentCol -= i;
          break;
      }

      if (
        currentRow < 0 || 
        currentRow >= this.size || 
        currentCol < 0 || 
        currentCol >= this.size
      ) {
        return false;
      }

      const existingLetter = this.grid[currentRow][currentCol];
      if (existingLetter && existingLetter !== word[i]) {
        return false;
      }
    }

    return true;
  }

  private placeWord(word: string, row: number, col: number, direction: Direction): void {
    const len = word.length;
    
    for (let i = 0; i < len; i++) {
      let currentRow = row;
      let currentCol = col;

      switch (direction) {
        case 'horizontal':
          currentCol += i;
          break;
        case 'vertical':
          currentRow += i;
          break;
        case 'diagonal':
          currentRow += i;
          currentCol += i;
          break;
        case 'reverse-horizontal':
          currentCol -= i;
          break;
        case 'reverse-vertical':
          currentRow -= i;
          break;
        case 'reverse-diagonal':
          currentRow -= i;
          currentCol -= i;
          break;
      }

      this.grid[currentRow][currentCol] = word[i];
    }

    this.placements.push({ word, row, col, direction });
  }

  generatePuzzle(words: string[]): { grid: string[][], placements: WordPlacement[] } {
    // Clear any previous state
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(''));
    this.placements = [];

    // Clean and sort words
    const sortedWords = [...words]
      .map(word => word.toUpperCase().replace(/[^A-Z]/g, ''))
      .filter(word => word.length > 0 && word.length <= this.size)
      .sort((a, b) => b.length - a.length);

    console.log('Attempting to place words:', sortedWords);

    for (const word of sortedWords) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 200;

      while (!placed && attempts < maxAttempts) {
        const direction = this.directions[Math.floor(Math.random() * this.directions.length)];
        const row = Math.floor(Math.random() * this.size);
        const col = Math.floor(Math.random() * this.size);

        if (this.canPlaceWord(word, row, col, direction)) {
          this.placeWord(word, row, col, direction);
          console.log(`Placed word ${word} at ${row},${col} going ${direction}`);
          placed = true;
        }

        attempts++;
      }

      if (!placed) {
        console.warn(`Could not place word: ${word}`);
      }
    }

    // Fill empty spaces with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (!this.grid[i][j]) {
          const randomIndex = Math.floor(Math.random() * letters.length);
          this.grid[i][j] = letters[randomIndex];
        }
      }
    }

    console.log('Final placements:', this.placements);
    console.log('Final grid:', this.grid);

    return {
      grid: this.grid,
      placements: this.placements
    };
  }
} 