import React, { useState } from 'react';
import { Maximize2, Palette, Hand, MousePointer2 } from 'lucide-react';

interface OverlayProps {
  isAssembled: boolean;
  onToggleAssemble: () => void;
  color: string;
  setColor: (c: string) => void;
  isGestureMode: boolean;
  toggleGestureMode: () => void;
  toggleFullscreen: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ 
  isAssembled, 
  onToggleAssemble,
  color,
  setColor,
  isGestureMode,
  toggleGestureMode,
  toggleFullscreen
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header - Empty to maintain layout structure without text */}
      <header className="flex justify-between items-start pointer-events-auto w-full">
        <div /> 

        {/* Top Right Controls */}
        <div className="flex flex-col gap-4 items-end">
            <button 
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/30 border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all text-yellow-100"
                title="Toggle Fullscreen"
            >
                <Maximize2 size={20} />
            </button>
            
            <button 
                onClick={toggleGestureMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isGestureMode ? 'bg-yellow-900/40 border-yellow-500 text-yellow-100' : 'bg-black/30 border-white/20 text-white/50'}`}
                title="Toggle Gesture Control"
            >
                {isGestureMode ? <Hand size={18} /> : <MousePointer2 size={18} />}
                <span className="text-xs font-cinzel tracking-wider">{isGestureMode ? 'HANDS ON' : 'HANDS OFF'}</span>
            </button>
        </div>
      </header>

      {/* Side Control Panel */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-4">
          <div className="relative">
             <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-3 rounded-full bg-black/40 backdrop-blur border border-yellow-500/30 hover:border-yellow-400 text-yellow-100 transition-all group"
             >
                <Palette size={24} className="group-hover:scale-110 transition-transform" />
             </button>
             {showColorPicker && (
                 <div className="absolute left-14 top-0 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-yellow-500/20 flex flex-col gap-2">
                     <p className="text-xs text-yellow-500/70 font-cinzel mb-1">THEME COLOR</p>
                     <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                     />
                 </div>
             )}
          </div>
      </div>

      {/* Center Interaction Area (Only visible in Mouse Mode) */}
      {!isGestureMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto mt-64 md:mt-96">
                <button 
                    onClick={onToggleAssemble}
                    className="group relative px-8 py-3 bg-black/40 backdrop-blur-md border border-yellow-500/30 hover:border-yellow-400 transition-all duration-500 overflow-hidden rounded-sm"
                >
                    <div className="absolute inset-0 bg-yellow-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                    <span className="font-cinzel text-yellow-100 tracking-[0.2em] text-sm md:text-lg group-hover:text-white transition-colors">
                        {isAssembled ? "RELEASE MAGIC" : "GATHER MAGIC"}
                    </span>
                </button>
            </div>
        </div>
      )}

      {/* Gesture Instruction (Only in Gesture Mode) */}
      {isGestureMode && (
          <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
              <p className="text-yellow-100/60 font-cinzel text-sm animate-pulse">
                  MAKE A FIST TO GATHER &bull; OPEN HAND TO SCATTER &bull; MOVE HAND TO GUIDE
              </p>
          </div>
      )}

      {/* Footer */}
      <footer className="text-center pointer-events-auto">
        <p className="text-yellow-500/50 text-xs font-luxury tracking-[0.3em] uppercase drop-shadow-md">
          Arix Interactive Experience
        </p>
      </footer>
    </div>
  );
};