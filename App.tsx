import React, { useState, useRef } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { GestureController } from './components/GestureController';
import * as THREE from 'three';

const App: React.FC = () => {
  const [isAssembled, setIsAssembled] = useState(false);
  const [color, setColor] = useState('#004225');
  const [isGestureMode, setIsGestureMode] = useState(false);
  
  // Use a ref for high-frequency updates: x, y, rotation
  const handPositionRef = useRef(new THREE.Vector3(0, 0, 0));

  const toggleAssemble = () => {
    setIsAssembled((prev) => !prev);
  };

  const handleGesture = (assembled: boolean) => {
    setIsAssembled(assembled);
  };

  const handleMove = (x: number, y: number, rotation: number) => {
    // x, y are normalized -1 to 1
    // rotation is in radians
    handPositionRef.current.set(x, y, rotation);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="w-full h-screen bg-[#000502] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#002215_0%,_#000000_100%)] opacity-50 z-0" />

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Experience 
            onInteract={() => {}} 
            isAssembled={isAssembled} 
            customColor={color}
            handPosition={handPositionRef}
            isGestureMode={isGestureMode}
        />
      </div>

      {/* Gesture Control Logic (Invisible/Overlay) */}
      <GestureController 
        isEnabled={isGestureMode} 
        onGesture={handleGesture} 
        onMove={handleMove}
      />

      {/* UI Overlay */}
      <Overlay 
        isAssembled={isAssembled} 
        onToggleAssemble={toggleAssemble} 
        color={color}
        setColor={setColor}
        isGestureMode={isGestureMode}
        toggleGestureMode={() => setIsGestureMode(!isGestureMode)}
        toggleFullscreen={toggleFullscreen}
      />
    </div>
  );
};

export default App;