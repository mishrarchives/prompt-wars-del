
import React, { useState, useCallback, useRef } from 'react';
import { useTetris } from './hooks/useTetris';
import GameCanvas from './components/GameCanvas';
import Sidebar from './components/Sidebar';
import { GameEvent, GameState, Commentary } from './types';
import { generateCommentary, analyzeLevelImage } from './services/geminiService';

const App: React.FC = () => {
  const [commentaries, setCommentaries] = useState<Commentary[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [personality, setPersonality] = useState('Sarcastic Coach');
  const [isUploading, setIsUploading] = useState(false);
  
  const commentaryCooldown = useRef<number>(0);

  const handleGameEvent = useCallback(async (event: GameEvent, state: Partial<GameState>) => {
    const now = Date.now();
    if (now - commentaryCooldown.current < 4000 && event === GameEvent.LINE_CLEAR) return;
    
    setIsThinking(true);
    commentaryCooldown.current = now;

    const text = await generateCommentary(event, state, personality);
    
    let type: Commentary['type'] = 'info';
    if (event === GameEvent.TETRIS || (state.lines || 0) > 1) type = 'success';
    if (event === GameEvent.GAME_OVER || event === GameEvent.HIGH_STACK) type = 'warning';
    
    setCommentaries(prev => [{ text, type, timestamp: now }, ...prev].slice(0, 20));
    setIsThinking(false);
  }, [personality]);

  const { gameState, reset, togglePause, startGame, stopGame } = useTetris(handleGameEvent);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const customGrid = await analyzeLevelImage(base64);
      if (customGrid.length > 0) {
        reset(customGrid);
        setCommentaries(prev => [{
          text: "World pattern digitized. Ready for deployment.",
          type: 'mutation',
          timestamp: Date.now()
        }, ...prev]);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col lg:flex-row overflow-hidden relative font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-10 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-transparent to-transparent"></div>
      </div>

      {/* MOBILE TOP BAR (Hidden on LG) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800 z-30">
        <div>
          <h1 className="text-xs font-orbitron font-bold text-white tracking-widest">NEXT-GEN BRICKS</h1>
          <p className="text-[8px] text-zinc-500">GEMINI CORE v3.0</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[8px] text-zinc-400 uppercase">Score</p>
            <p className="text-sm font-orbitron text-cyan-400 leading-none">{gameState.score.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-zinc-400 uppercase">Level</p>
            <p className="text-sm font-orbitron text-yellow-400 leading-none">{gameState.level}</p>
          </div>
        </div>
      </div>

      {/* DESKTOP LEFT PANEL */}
      <div className="hidden lg:flex w-72 flex-col gap-6 p-6 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-sm z-20">
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <h1 className="text-2xl font-orbitron font-bold text-white mb-2 leading-tight">NEXT-GEN BRICKS</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">AI Interface</p>
        </div>

        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl space-y-4">
           <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-xs">System Status</h2>
           <div className="space-y-3">
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${gameState.isStarted ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-xs text-zinc-300 font-mono">LINK: {gameState.isStarted ? 'STABLE' : 'OFFLINE'}</span>
             </div>
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-cyan-500 animate-ping' : 'bg-zinc-600'}`}></div>
               <span className="text-xs text-zinc-300 font-mono">NEURAL: {isThinking ? 'SYNCING' : 'IDLE'}</span>
             </div>
           </div>
        </div>

        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl space-y-4 flex-1">
           <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Directives</h2>
           <div className="space-y-3 text-xs text-zinc-400 font-mono">
              <div className="flex justify-between border-b border-zinc-800 pb-1"><span>LEFT/RIGHT</span><span>MOVE</span></div>
              <div className="flex justify-between border-b border-zinc-800 pb-1"><span>UP</span><span>ROTATE</span></div>
              <div className="flex justify-between border-b border-zinc-800 pb-1"><span>DOWN</span><span>DROP</span></div>
              <div className="flex justify-between"><span>P</span><span>PAUSE</span></div>
           </div>
           
           <div className="pt-4">
             <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-2">Neural Sync</h2>
             <label className={`block w-full py-3 px-4 rounded border-2 border-dashed text-center cursor-pointer transition-all ${
               isUploading ? 'border-yellow-500 bg-yellow-900/10' : 'border-zinc-700 hover:border-cyan-500 hover:bg-zinc-800'
             }`}>
               <span className="text-[10px] font-bold text-zinc-300 uppercase">
                 {isUploading ? 'SYNCING...' : 'IMG TO LEVEL'}
               </span>
               <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
             </label>
           </div>
        </div>
      </div>

      {/* MAIN PLAY AREA (Central focus) */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 lg:p-8 relative min-h-0">
        <div className="w-full h-full flex items-center justify-center max-h-[85vh] lg:max-h-none">
          <GameCanvas gameState={gameState} />
        </div>
        
        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40 px-4">
            <div className="bg-zinc-950 border-2 border-red-600 p-8 rounded-2xl text-center glow shadow-red-900/50 max-w-sm w-full">
              <h3 className="text-3xl font-orbitron font-bold text-red-500 mb-2">SYSTEM CRITICAL</h3>
              <p className="text-zinc-400 mb-6 font-mono text-xs uppercase tracking-widest">Final Data Chunk: {gameState.score}</p>
              <button 
                onClick={startGame}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold rounded-xl transition-all shadow-lg shadow-red-900/40"
              >
                REBOOT SESSION
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL (Desktop Stats & Feed / Mobile Controls & Feed) */}
      <div className="w-full lg:w-96 flex flex-col bg-zinc-950/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-t lg:border-t-0 lg:border-l border-zinc-800 z-20 max-h-[40vh] lg:max-h-none overflow-hidden">
        <Sidebar 
          gameState={gameState} 
          commentaries={commentaries} 
          isThinking={isThinking}
          personality={personality}
          setPersonality={setPersonality}
          startGame={startGame}
          stopGame={stopGame}
          togglePause={togglePause}
        />
      </div>

      {/* DESKTOP FOOTER */}
      <div className="hidden lg:flex fixed bottom-0 left-0 w-full px-8 py-2 bg-zinc-950/90 border-t border-zinc-800 justify-between items-center text-[9px] font-mono text-zinc-500 tracking-[0.2em] uppercase z-30">
        <div className="flex gap-10">
          <div>LATENCY: {isThinking ? 'MEASURING' : '14.2MS'}</div>
          <div>MOD_MULT: 2.0x</div>
        </div>
        <div>STABILITY: 99.98% ACTIVE</div>
      </div>
    </div>
  );
};

export default App;
