
import React, { useRef, useEffect } from 'react';
import { GameState } from '../types';
import { COLS, ROWS, BLOCK_SIZE } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * BLOCK_SIZE, 0);
      ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
      ctx.stroke();
    }

    // Static blocks
    gameState.grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          drawBlock(ctx, x, y, color);
        }
      });
    });

    // Current piece
    if (gameState.currentPiece && gameState.isStarted) {
      const { shape, position, color } = gameState.currentPiece;
      shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            drawBlock(ctx, position.x + x, position.y + y, color);
          }
        });
      });
    }

    // Overlays
    if (!gameState.isStarted && !gameState.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.font = '24px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('STANDBY', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '10px Orbitron';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('WAITING FOR NEURAL SYNC', canvas.width / 2, canvas.height / 2 + 20);
    }

    if (gameState.paused && gameState.isStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00f0f0';
      ctx.font = '24px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }, [gameState]);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // Aesthetic details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 3);
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 3, BLOCK_SIZE);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  };

  return (
    <div className="relative p-1.5 lg:p-3 bg-zinc-900 border-4 border-zinc-800 rounded-xl shadow-2xl glow h-full max-h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={COLS * BLOCK_SIZE}
        height={ROWS * BLOCK_SIZE}
        className="block max-h-full object-contain mx-auto"
        style={{ 
          aspectRatio: `${COLS} / ${ROWS}`,
          height: '100%', 
          width: 'auto',
          maxWidth: '100%' 
        }}
      />
    </div>
  );
};

export default GameCanvas;
