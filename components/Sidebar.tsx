
import React from 'react';
import { GameState, Commentary } from '../types';

interface SidebarProps {
  gameState: GameState;
  commentaries: Commentary[];
  isThinking: boolean;
  personality: string;
  setPersonality: (p: string) => void;
  startGame: () => void;
  stopGame: () => void;
  togglePause: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  gameState, 
  commentaries, 
  isThinking,
  personality,
  setPersonality,
  startGame,
  stopGame,
  togglePause
}) => {
  const nextPieceCanvas = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = nextPieceCanvas.current;
    if (!canvas || !gameState.nextPiece) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { shape, color } = gameState.nextPiece;
    const padding = 10;
    const bs = 16;
    
    shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = color;
          ctx.fillRect(x * bs + padding, y * bs + padding, bs, bs);
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.strokeRect(x * bs + padding, y * bs + padding, bs, bs);
        }
      });
    });
  }, [gameState.nextPiece]);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* MOBILE CONTROLS & STATS (Visible on LG as secondary) */}
      <div className="p-4 lg:p-6 border-b border-zinc-800 bg-zinc-900/40">
        <div className="hidden lg:grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Score</p>
            <p className="text-xl font-orbitron text-cyan-400 leading-none">{gameState.score.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Lines</p>
            <p className="text-xl font-orbitron text-green-400 leading-none">{gameState.lines}</p>
          </div>
        </div>

        <div className="flex gap-2 lg:flex-col">
          {!gameState.isStarted || gameState.paused ? (
            <button 
              onClick={startGame}
              className="flex-1 lg:w-full py-4 lg:py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 text-xs lg:text-sm"
            >
              {gameState.paused ? 'RESUME SYNC' : 'START SESSION'}
            </button>
          ) : (
            <button 
              onClick={togglePause}
              className="flex-1 lg:w-full py-4 lg:py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-orbitron font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/20 text-xs lg:text-sm"
            >
              PAUSE
            </button>
          )}

          <button 
            onClick={stopGame}
            className="px-4 lg:w-full py-4 lg:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-orbitron text-[10px] lg:text-xs rounded-xl transition-all border border-zinc-700"
          >
            ABORT
          </button>
        </div>
      </div>

      {/* NEXT PIECE & VOICE SELECT */}
      <div className="flex px-4 py-3 lg:px-6 lg:py-4 border-b border-zinc-800 items-center justify-between lg:flex-col lg:items-stretch gap-4">
        <div className="flex items-center gap-4 lg:justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Next</span>
          <div className="p-1 bg-black border border-zinc-800 rounded">
            <canvas ref={nextPieceCanvas} width={80} height={80} className="scale-75 lg:scale-100" />
          </div>
        </div>

        <div className="flex-1 lg:flex-none">
          <span className="hidden lg:block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Narrator Voice</span>
          <select 
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg p-2 text-[10px] lg:text-xs focus:outline-none focus:border-cyan-500"
          >
            <option>Sarcastic Coach</option>
            <option>Hype Man</option>
            <option>Zen Master</option>
            <option>Cyberpunk Glitch</option>
          </select>
        </div>
      </div>

      {/* COMMENTARY FEED */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/40 lg:bg-transparent">
        <div className="px-4 py-2 lg:px-6 lg:py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Neural Feed</h2>
          {isThinking && (
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
              <span className="text-[8px] text-cyan-400 uppercase font-mono">Syncing</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 custom-scrollbar">
          {commentaries.map((c, i) => (
            <div key={i} className={`p-3 rounded-lg text-[10px] lg:text-xs border-l-2 shadow-sm ${
              c.type === 'success' ? 'bg-green-500/5 border-green-500 text-green-200' :
              c.type === 'warning' ? 'bg-red-500/5 border-red-500 text-red-200' :
              c.type === 'mutation' ? 'bg-purple-500/5 border-purple-500 text-purple-200' :
              'bg-zinc-900/50 border-zinc-700 text-zinc-400'
            }`}>
              <div className="opacity-80 leading-relaxed font-mono">{c.text}</div>
            </div>
          ))}
          {commentaries.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <div className="w-8 h-8 border border-zinc-700 rounded-full flex items-center justify-center mb-2">
                <div className="w-1 h-1 bg-zinc-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Ready for Data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
