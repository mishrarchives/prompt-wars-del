
export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  color: string;
  position: Position;
}

export interface GameState {
  grid: (string | null)[][];
  currentPiece: Tetromino | null;
  nextPiece: Tetromino;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  isStarted: boolean;
  mutations: Mutation[];
  lastMutationAt: number;
}

export interface Mutation {
  id: string;
  name: string;
  description: string;
  active: boolean;
  startTime: number;
  duration?: number;
}

export interface Commentary {
  text: string;
  type: 'info' | 'success' | 'warning' | 'mutation';
  timestamp: number;
}

export enum GameEvent {
  LINE_CLEAR = 'LINE_CLEAR',
  TETRIS = 'TETRIS',
  GAME_OVER = 'GAME_OVER',
  HIGH_STACK = 'HIGH_STACK',
  MUTATION_APPLIED = 'MUTATION_APPLIED',
  DROUGHT = 'DROUGHT'
}
