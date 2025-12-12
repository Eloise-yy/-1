import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { Tree } from './Tree';
import * as THREE from 'three';

interface ExperienceProps {
  onInteract: () => void;
  isAssembled: boolean;
  customColor: string;
  handPosition: React.MutableRefObject<THREE.Vector3>;
  isGestureMode: boolean;
}

const FallingSnow = () => {
    return (
        <Sparkles 
            count={2000} 
            scale={[40, 40, 40]} 
            size={4} 
            speed={0.4} 
            opacity={0.8} 
            color="#ffffff" 
            position={[0, 10, 0]} 
            noise={0.1} 
        />
    )
}

export const Experience: React.FC<ExperienceProps> = ({ 
  onInteract, 
  isAssembled, 
  customColor,
  handPosition,
  isGestureMode
}) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMapping: 3, toneMappingExposure: 1.2 }} 
      shadows
      onPointerDown={onInteract}
    >
      <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />
      
      {/* Background Ambience - Dark Void */}
      <color attach="background" args={['#000508']} />

      {/* Lighting */}
      <ambientLight intensity={0.1} color="#001a10" />
      <spotLight 
        position={[8, 15, 8]} 
        angle={0.4} 
        penumbra={1} 
        intensity={200} 
        castShadow 
        color="#ffeebb"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <spotLight position={[-8, 10, -5]} angle={0.6} intensity={100} color="#cceeff" />
      <pointLight position={[0, 5, -10]} intensity={20} color="#400040" />

      <Suspense fallback={null}>
        <Tree 
            isAssembled={isAssembled} 
            customColor={customColor} 
            handPosition={handPosition}
            isGestureMode={isGestureMode}
        />
        
        {/* Continuously falling snow from top */}
        <FallingSnow />
        
        <Environment preset="night" blur={0.7} background={false} />
        <ContactShadows resolution={1024} scale={40} blur={2} opacity={0.5} far={10} color="#000000" />
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.9}
        minDistance={10}
        maxDistance={35}
        autoRotate={isAssembled && !isGestureMode} 
        autoRotateSpeed={0.5}
        target={[0, 4, 0]}
      />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.0} />
        <Noise opacity={0.03} />
      </EffectComposer>
    </Canvas>
  );
};