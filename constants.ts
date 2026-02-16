
import { TetrominoType } from './types';

export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 30;

export const SHAPES: Record<TetrominoType, number[][]> = {
  'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
  'J': [[1,0,0], [1,1,1], [0,0,0]],
  'L': [[0,0,1], [1,1,1], [0,0,0]],
  'O': [[1,1], [1,1]],
  'S': [[0,1,1], [1,1,0], [0,0,0]],
  'T': [[0,1,0], [1,1,1], [0,0,0]],
  'Z': [[1,1,0], [0,1,1], [0,0,0]]
};

export const COLORS: Record<TetrominoType, string> = {
  'I': '#00f0f0', // Cyan
  'J': '#0000f0', // Blue
  'L': '#f0a000', // Orange
  'O': '#f0f000', // Yellow
  'S': '#00f000', // Green
  'T': '#a000f0', // Purple
  'Z': '#f00000'  // Red
};

export const INITIAL_SPEED = 800;
export const MIN_SPEED = 100;
export const SPEED_INCREMENT = 0.95; // Multiply by this every level
