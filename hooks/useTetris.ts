
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Tetromino, Position, GameEvent, Mutation } from '../types';
import { COLS, ROWS, SHAPES, COLORS, INITIAL_SPEED, MIN_SPEED, SPEED_INCREMENT } from '../constants';

export const useTetris = (onGameEvent: (event: GameEvent, state: Partial<GameState>) => void) => {
  const [gameState, setGameState] = useState<GameState>({
    grid: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    currentPiece: null,
    nextPiece: getRandomPiece(),
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    paused: false,
    isStarted: false,
    mutations: [],
    lastMutationAt: Date.now()
  });

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);

  function getRandomPiece(): Tetromino {
    const types: (keyof typeof SHAPES)[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      type,
      shape: SHAPES[type],
      color: COLORS[type],
      position: { x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2), y: 0 }
    };
  }

  const checkCollision = useCallback((piece: Tetromino, grid: (string | null)[][], pos: Position) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (
            newX < 0 || newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && grid[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const clearLines = useCallback((grid: (string | null)[][]) => {
    let linesCleared = 0;
    const newGrid = grid.filter(row => {
      const isFull = row.every(cell => cell !== null);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (newGrid.length < ROWS) {
      newGrid.unshift(Array(COLS).fill(null));
    }

    return { newGrid, linesCleared };
  }, []);

  const drop = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver || prev.paused || !prev.isStarted || !prev.currentPiece) return prev;

      const nextPos = { ...prev.currentPiece.position, y: prev.currentPiece.position.y + 1 };
      
      if (!checkCollision(prev.currentPiece, prev.grid, nextPos)) {
        return {
          ...prev,
          currentPiece: { ...prev.currentPiece, position: nextPos }
        };
      } else {
        const newGrid = [...prev.grid.map(row => [...row])];
        prev.currentPiece.shape.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value) {
              const gridY = prev.currentPiece!.position.y + y;
              const gridX = prev.currentPiece!.position.x + x;
              if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
                newGrid[gridY][gridX] = prev.currentPiece!.color;
              }
            }
          });
        });

        const { newGrid: clearedGrid, linesCleared } = clearLines(newGrid);
        
        const multiplier = linesCleared > 0 ? Math.pow(2, linesCleared - 1) : 0;
        const newScore = prev.score + (linesCleared * 100 * multiplier);
        const newLines = prev.lines + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;

        if (linesCleared > 0) {
          onGameEvent(linesCleared === 4 ? GameEvent.TETRIS : GameEvent.LINE_CLEAR, { 
            score: newScore, 
            lines: linesCleared, 
            level: newLevel 
          });
        }

        const nextPiece = prev.nextPiece;
        if (checkCollision(nextPiece, clearedGrid, nextPiece.position)) {
          onGameEvent(GameEvent.GAME_OVER, { score: newScore });
          return { ...prev, grid: clearedGrid, score: newScore, gameOver: true, isStarted: false };
        }

        const stackHeight = clearedGrid.findIndex(row => row.some(cell => cell !== null));
        if (stackHeight !== -1 && ROWS - stackHeight > 14) {
          onGameEvent(GameEvent.HIGH_STACK, prev);
        }

        return {
          ...prev,
          grid: clearedGrid,
          currentPiece: nextPiece,
          nextPiece: getRandomPiece(),
          score: newScore,
          lines: newLines,
          level: newLevel
        };
      }
    });
  }, [checkCollision, clearLines, onGameEvent]);

  const move = useCallback((dir: number) => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.gameOver || prev.paused || !prev.isStarted) return prev;
      const nextPos = { ...prev.currentPiece.position, x: prev.currentPiece.position.x + dir };
      if (!checkCollision(prev.currentPiece, prev.grid, nextPos)) {
        return { ...prev, currentPiece: { ...prev.currentPiece, position: nextPos } };
      }
      return prev;
    });
  }, [checkCollision]);

  const rotate = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.gameOver || prev.paused || !prev.isStarted) return prev;
      const rotatedShape = prev.currentPiece.shape[0].map((_, index) =>
        prev.currentPiece!.shape.map(col => col[index]).reverse()
      );
      const rotatedPiece = { ...prev.currentPiece, shape: rotatedShape };
      if (!checkCollision(rotatedPiece, prev.grid, prev.currentPiece.position)) {
        return { ...prev, currentPiece: rotatedPiece };
      }
      return prev;
    });
  }, [checkCollision]);

  const togglePause = useCallback(() => setGameState(prev => ({ ...prev, paused: !prev.paused })), []);

  const startGame = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver) {
        return {
          ...prev,
          grid: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
          currentPiece: getRandomPiece(),
          nextPiece: getRandomPiece(),
          score: 0,
          lines: 0,
          level: 1,
          gameOver: false,
          isStarted: true,
          paused: false
        };
      }
      return { ...prev, isStarted: true, paused: false };
    });
  }, []);

  const stopGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      grid: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
      currentPiece: null,
      nextPiece: getRandomPiece(),
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      paused: false,
      isStarted: false
    }));
  }, []);

  const reset = useCallback((initialGrid?: (string | null)[][]) => {
    setGameState({
      grid: initialGrid || Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
      currentPiece: getRandomPiece(),
      nextPiece: getRandomPiece(),
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      paused: false,
      isStarted: true,
      mutations: [],
      lastMutationAt: Date.now()
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameOver || !gameState.isStarted) return;
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') rotate();
      if (e.key === 'p' || e.key === 'P') togglePause();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameOver, gameState.isStarted, move, drop, rotate, togglePause]);

  const update = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (gameState.isStarted && !gameState.paused && !gameState.gameOver) {
      dropCounterRef.current += deltaTime;
      const speed = Math.max(MIN_SPEED, INITIAL_SPEED * Math.pow(SPEED_INCREMENT, gameState.level - 1));

      if (dropCounterRef.current > speed) {
        drop();
        dropCounterRef.current = 0;
      }
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    if (gameState.isStarted && !gameState.currentPiece && !gameState.gameOver) {
      setGameState(prev => ({ ...prev, currentPiece: getRandomPiece() }));
    }
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [drop, gameState.level, gameState.paused, gameState.gameOver, gameState.isStarted, gameState.currentPiece]);

  return { gameState, reset, togglePause, startGame, stopGame };
};
