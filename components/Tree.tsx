import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Colors & Constants ---
const DEFAULT_NEEDLE = '#004225';

// --- Math Helpers ---
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Generate a random point in a sphere shell
const randomSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random()); 
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y + 5, z);
};

// --- Sub-components ---

// 1. Particle Tree (Needles + Cubes)
const TreeParticles = ({ isAssembled, customColor }: { isAssembled: boolean, customColor: string }) => {
  const tetraRef = useRef<THREE.InstancedMesh>(null);
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  
  // Data generation
  const { tetraData, boxData } = useMemo(() => {
    const tData: any[] = [];
    const bData: any[] = [];
    // Increased radius for grandeur (multiplying previous r by ~1.4)
    const layers = [
      { y: 1.0, r: 4.8, h: 4.0 }, 
      { y: 3.5, r: 3.8, h: 3.5 },
      { y: 5.5, r: 2.8, h: 3.0 },
      { y: 7.5, r: 1.6, h: 2.5 },
      { y: 9.0, r: 0.7, h: 1.5 }
    ];

    layers.forEach((layer) => {
      // Density adjustments
      const count = Math.floor(layer.r * 1000);
      for (let i = 0; i < count; i++) {
        const hRatio = Math.random();
        const rRatio = Math.sqrt(Math.random());
        const yPos = layer.y - (layer.h / 2) + (hRatio * layer.h);
        const maxR = layer.r * (1 - hRatio);
        const currentR = maxR * rRatio;
        const theta = Math.random() * Math.PI * 2;
        const noise = 0.3;
        
        // Tree Position
        const treePos = new THREE.Vector3(
          Math.cos(theta) * currentR + (Math.random() - 0.5) * noise,
          yPos,
          Math.sin(theta) * currentR + (Math.random() - 0.5) * noise
        );

        const scatterPos = randomSpherePoint(15);
        const scale = 0.12 + Math.random() * 0.3;
        
        const particle = { 
            treePos, 
            scatterPos, 
            scale, 
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] 
        };

        if (Math.random() > 0.3) {
            tData.push(particle);
        } else {
            particle.scale *= 0.8;
            bData.push(particle);
        }
      }
    });
    return { tetraData: tData, boxData: bData };
  }, []);

  // Update colors
  useLayoutEffect(() => {
    const targetColor = new THREE.Color(customColor);
    const var1 = targetColor.clone(); 
    const var2 = targetColor.clone().multiplyScalar(0.7); 
    const var3 = targetColor.clone().offsetHSL(0, 0, 0.1); 

    const applyColors = (mesh: THREE.InstancedMesh, data: any[]) => {
        if(!mesh) return;
        data.forEach((d, i) => {
            const rand = Math.random();
            let c = var1;
            if (rand < 0.3) c = var2;
            else if (rand > 0.8) c = var3;
            mesh.setColorAt(i, c);
        });
        mesh.instanceColor!.needsUpdate = true;
    };

    applyColors(tetraRef.current!, tetraData);
    applyColors(boxRef.current!, boxData);

  }, [tetraData, boxData, customColor]);

  const progress = useRef(0);

  useFrame((state, delta) => {
    const target = isAssembled ? 1 : 0;
    const speed = isAssembled ? 1.5 : 2.5; 
    progress.current = THREE.MathUtils.lerp(progress.current, target, delta * speed);
    const t = progress.current;
    const easedT = 1 - Math.pow(1 - t, 3); 

    const animateMesh = (mesh: THREE.InstancedMesh, data: any[]) => {
        if (!mesh) return;
        data.forEach((d, i) => {
            const x = lerp(d.scatterPos.x, d.treePos.x, easedT);
            const y = lerp(d.scatterPos.y, d.treePos.y, easedT);
            const z = lerp(d.scatterPos.z, d.treePos.z, easedT);

            tempObject.position.set(x, y, z);
            tempObject.rotation.set(
                d.rotation[0] + state.clock.elapsedTime * 0.1, 
                d.rotation[1] + (1-easedT) * state.clock.elapsedTime * 0.5, 
                d.rotation[2]
            );
            tempObject.scale.setScalar(d.scale * (0.5 + 0.5 * easedT)); 
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
    };

    animateMesh(tetraRef.current!, tetraData);
    animateMesh(boxRef.current!, boxData);
  });

  // Material with subtle emissive glow for the "slightly glowing" effect
  const particleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.2,
      emissive: new THREE.Color("#002211"), 
      emissiveIntensity: 0.6 // Increased to make it glow visibly
  }), []);

  return (
    <group>
        <instancedMesh ref={tetraRef} args={[undefined, undefined, tetraData.length]} material={particleMaterial}>
            <tetrahedronGeometry args={[0.5, 0]} />
        </instancedMesh>
        <instancedMesh ref={boxRef} args={[undefined, undefined, boxData.length]} material={particleMaterial}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
        </instancedMesh>
    </group>
  );
};

// 2. Ornaments (Instanced - Spheres + New Cubes)
const Ornaments = ({ isAssembled }: { isAssembled: boolean }) => {
  const baubleRef = useRef<THREE.InstancedMesh>(null);
  const cubeRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const COLORS = {
      GOLD: new THREE.Color('#FFD700'),
      ROSE_GOLD: new THREE.Color('#E0BFB8'),
      RED: new THREE.Color('#8a0303'),
      SILVER: new THREE.Color('#C0C0C0'),
      LIGHT_WARM: new THREE.Color('#ffaa33'),
  }

  const { baubles, cubes, lights } = useMemo(() => {
    const b: any[] = [];
    const c: any[] = [];
    const l: any[] = [];
    
    const layers = [
      { y: 1.0, r: 4.8, h: 4.0 }, 
      { y: 3.5, r: 3.8, h: 3.5 },
      { y: 5.5, r: 2.8, h: 3.0 },
      { y: 7.5, r: 1.6, h: 2.5 },
      { y: 9.0, r: 0.7, h: 1.5 }
    ];

    layers.forEach((layer) => {
      const count = Math.floor(layer.r * 25);
      for (let i = 0; i < count; i++) {
        const hRatio = Math.random();
        const yPos = layer.y - (layer.h / 2) + (hRatio * layer.h);
        const rSurface = layer.r * (1 - hRatio);
        const theta = Math.random() * Math.PI * 2;
        
        const treePos = new THREE.Vector3(
          Math.cos(theta) * (rSurface + 0.2),
          yPos,
          Math.sin(theta) * (rSurface + 0.2)
        );
        const scatterPos = randomSpherePoint(18);

        const type = Math.random();
        
        // --- Uniformity Logic ---
        const uniformScale = 0.25 + Math.random() * 0.15; // 0.25 to 0.40
        
        const colorRand = Math.random();
        let uniformColor = COLORS.GOLD;
        if (colorRand > 0.8) uniformColor = COLORS.RED;
        else if (colorRand > 0.6) uniformColor = COLORS.SILVER;
        else if (colorRand > 0.4) uniformColor = COLORS.ROSE_GOLD;

        if (type > 0.85) { 
          l.push({ treePos, scatterPos, scale: 0.1, color: COLORS.LIGHT_WARM });
        } else if (type > 0.55) { 
           c.push({ 
             treePos, 
             scatterPos, 
             scale: uniformScale, 
             color: uniformColor, 
             rotation: [Math.random(), Math.random(), Math.random()] 
           });
        } else { 
           b.push({ 
             treePos, 
             scatterPos, 
             scale: uniformScale, 
             color: uniformColor 
           });
        }
      }
    });
    return { baubles: b, cubes: c, lights: l };
  }, []);

  useLayoutEffect(() => {
    if (baubleRef.current) {
        baubles.forEach((d, i) => baubleRef.current!.setColorAt(i, d.color));
        baubleRef.current.instanceColor!.needsUpdate = true;
    }
    if (cubeRef.current) {
        cubes.forEach((d, i) => cubeRef.current!.setColorAt(i, d.color));
        cubeRef.current.instanceColor!.needsUpdate = true;
    }
  }, [baubles, cubes]);

  const progress = useRef(0);

  useFrame((state, delta) => {
    const target = isAssembled ? 1 : 0;
    progress.current = THREE.MathUtils.lerp(progress.current, target, delta * 1.5);
    const easedT = 1 - Math.pow(1 - progress.current, 3); 

    // Update Baubles
    if (baubleRef.current) {
        baubles.forEach((d, i) => {
            const x = lerp(d.scatterPos.x, d.treePos.x, easedT);
            const y = lerp(d.scatterPos.y, d.treePos.y, easedT);
            const z = lerp(d.scatterPos.z, d.treePos.z, easedT);
            tempObject.position.set(x, y, z);
            tempObject.scale.setScalar(d.scale * easedT); 
            tempObject.rotation.set(0,0,0);
            tempObject.updateMatrix();
            baubleRef.current!.setMatrixAt(i, tempObject.matrix);
        });
        baubleRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Cubes
    if (cubeRef.current) {
        cubes.forEach((d, i) => {
            const x = lerp(d.scatterPos.x, d.treePos.x, easedT);
            const y = lerp(d.scatterPos.y, d.treePos.y, easedT);
            const z = lerp(d.scatterPos.z, d.treePos.z, easedT);
            tempObject.position.set(x, y, z);
            tempObject.scale.setScalar(d.scale * easedT);
            // Spin the cubes slightly
            tempObject.rotation.set(
                d.rotation[0] + state.clock.elapsedTime * 0.5,
                d.rotation[1] + state.clock.elapsedTime * 0.5,
                d.rotation[2]
            );
            tempObject.updateMatrix();
            cubeRef.current!.setMatrixAt(i, tempObject.matrix);
        });
        cubeRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Lights
    if (lightRef.current) {
        const time = state.clock.elapsedTime;
        lights.forEach((d, i) => {
            const x = lerp(d.scatterPos.x, d.treePos.x, easedT);
            const y = lerp(d.scatterPos.y, d.treePos.y, easedT);
            const z = lerp(d.scatterPos.z, d.treePos.z, easedT);
            tempObject.position.set(x, y, z);
            
            const blink = Math.sin(time * 3 + i) * 0.5 + 1; 
            tempObject.scale.setScalar(d.scale * easedT * blink);
            tempObject.rotation.set(0,0,0);
            
            tempObject.updateMatrix();
            lightRef.current!.setMatrixAt(i, tempObject.matrix);
        });
        lightRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Added emissive properties to materials for "slightly glowing" feel */}
      <instancedMesh ref={baubleRef} args={[undefined, undefined, baubles.length]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={0.9} 
            envMapIntensity={2} 
            emissive="#202020" 
            emissiveIntensity={0.5} 
        />
      </instancedMesh>
      <instancedMesh ref={cubeRef} args={[undefined, undefined, cubes.length]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
            roughness={0.2} 
            metalness={1.0} 
            envMapIntensity={2} 
            emissive="#202020" 
            emissiveIntensity={0.5} 
        />
      </instancedMesh>
      <instancedMesh ref={lightRef} args={[undefined, undefined, lights.length]}>
         <sphereGeometry args={[1, 16, 16]} />
         <meshStandardMaterial toneMapped={false} color={COLORS.LIGHT_WARM} emissive={COLORS.LIGHT_WARM} emissiveIntensity={3} />
      </instancedMesh>
    </group>
  );
};

// 3. Morphing Star (Platinum/White-Gold, 5-Pointed)
const Star = ({ isAssembled }: { isAssembled: boolean }) => {
    const group = useRef<THREE.Group>(null);
    const progress = useRef(0);
    const startPos = useMemo(() => new THREE.Vector3(0, 20, 0), []); 
    const endPos = useMemo(() => new THREE.Vector3(0, 10.5, 0), []);
    
    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 0.8;
        const innerRadius = 0.4;
        
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            // Shift angle by +Math.PI/2 to ensure the first outer point (i=0) points strictly Up (Y+)
            const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2; 
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.05,
        bevelSegments: 2
    }), []);

    useFrame((_, delta) => {
        if (!group.current) return;
        const target = isAssembled ? 1 : 0;
        progress.current = THREE.MathUtils.lerp(progress.current, target, delta * 1.0); 
        
        const easedT = 1 - Math.pow(1 - progress.current, 3);
        group.current.position.lerpVectors(startPos, endPos, easedT);
        group.current.scale.setScalar(easedT); 
        // Spinning slightly
        group.current.rotation.y += delta * 0.5;
    });

  return (
      <group ref={group} scale={0}>
        <mesh rotation={[0, 0, 0]}>
            <extrudeGeometry args={[starShape, extrudeSettings]} />
            <meshStandardMaterial 
                color="#ffffff" 
                emissive="#ffffee" 
                emissiveIntensity={2.0} 
                roughness={0.1} 
                metalness={1.0} 
                toneMapped={false}
            />
        </mesh>
        <pointLight intensity={5} color="#ffffff" distance={15} decay={2} />
      </group>
  );
};

// 4. Gifts with Ribbons
const GiftBox = ({ targetPos, color, size, rotation, isAssembled }: any) => {
    const ref = useRef<THREE.Group>(null);
    const progress = useRef(0);
    const scatterPos = useMemo(() => randomSpherePoint(10), []);
    const ribbonColor = useMemo(() => new THREE.Color('#FFD700'), []); // Gold ribbon
    
    useFrame((_, delta) => {
        if(!ref.current) return;
        const target = isAssembled ? 1 : 0;
        const speed = 1.5;
        progress.current = THREE.MathUtils.lerp(progress.current, target, delta * speed);
        const easedT = 1 - Math.pow(1 - progress.current, 3);

        const currentPos = new THREE.Vector3().lerpVectors(scatterPos, new THREE.Vector3(...targetPos), easedT);
        ref.current.position.copy(currentPos);
        ref.current.scale.setScalar(easedT); 
        ref.current.rotation.set(
            rotation[0] * easedT,
            rotation[1] + (1-easedT), 
            rotation[2] * easedT
        );
    });

    const ribbonWidth = 0.15;
    const ribbonThick = 0.02;

    return (
        <group ref={ref}>
            {/* Box Body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
            
            {/* Ribbon Vertical (Thickened for wrapping feel) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[size[0] * ribbonWidth, size[1] + ribbonThick, size[2] + ribbonThick]} />
                <meshStandardMaterial color={ribbonColor} metalness={0.9} roughness={0.1} emissive="#443300" emissiveIntensity={0.2} />
            </mesh>
            
            {/* Ribbon Horizontal */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[size[0] + ribbonThick, size[1] + ribbonThick, size[2] * ribbonWidth]} />
                <meshStandardMaterial color={ribbonColor} metalness={0.9} roughness={0.1} emissive="#443300" emissiveIntensity={0.2} />
            </mesh>

            {/* Bow Knot */}
            <mesh position={[0, size[1]/2, 0]} rotation={[0, 0, 0]}>
                 <group scale={size[0] * 0.45}>
                    {/* Left Loop */}
                    <mesh position={[-0.35, 0.25, 0]} rotation={[0, 0, Math.PI / 3]}>
                        <torusGeometry args={[0.3, 0.08, 8, 16]} />
                        <meshStandardMaterial color={ribbonColor} metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Right Loop */}
                    <mesh position={[0.35, 0.25, 0]} rotation={[0, 0, -Math.PI / 3]}>
                        <torusGeometry args={[0.3, 0.08, 8, 16]} />
                        <meshStandardMaterial color={ribbonColor} metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Center Knot */}
                    <mesh position={[0, 0.1, 0]}>
                        <sphereGeometry args={[0.12]} />
                        <meshStandardMaterial color={ribbonColor} metalness={0.9} roughness={0.1} />
                    </mesh>
                 </group>
            </mesh>
        </group>
    )
}

const Gifts = ({ isAssembled }: { isAssembled: boolean }) => {
    const gifts = useMemo(() => {
        const wraps = ['#4a0404', '#002215', '#1a1a1a', '#ffffff', '#2b0042'];
        return Array.from({length: 12}).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = 4 + Math.random() * 3.0; 
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const scale = 0.6 + Math.random() * 0.8;
            const color = wraps[Math.floor(Math.random() * wraps.length)];
            return {
                targetPos: [x, scale/2 - 2, z] as [number, number, number],
                size: [scale, scale, scale] as [number, number, number],
                color,
                rotation: [0, Math.random() * Math.PI, 0] as [number, number, number]
            }
        })
    }, []);

    return <group>{gifts.map((g, i) => <GiftBox key={i} index={i} {...g} isAssembled={isAssembled} />)}</group>
}


// --- Main Tree Component ---
interface TreeProps {
  isAssembled: boolean;
  customColor: string;
  handPosition: React.MutableRefObject<THREE.Vector3>;
  isGestureMode: boolean;
}

export const Tree: React.FC<TreeProps> = ({ isAssembled, customColor, handPosition, isGestureMode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(0, -3, 0));
  const targetRotationY = useRef(0);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
        if (isAssembled) {
             // Auto-rotate if not in gesture mode
             if (!isGestureMode) {
                 targetRotationY.current += delta * 0.05;
             }
        }

        if (isGestureMode) {
             // Position mapping
             const x = handPosition.current.x * 6;
             const y = handPosition.current.y * 3 - 3;
             targetPos.current.set(x, y, 0);

             // Rotation mapping from hand roll (Z of vector)
             targetRotationY.current = handPosition.current.z * 2.5;
        } else {
             targetPos.current.set(0, -3, 0);
        }

        // Smooth interpolation
        groupRef.current.position.lerp(targetPos.current, delta * 3);
        
        // Smooth rotation
        if (isGestureMode) {
             const current = groupRef.current.rotation.y;
             const target = targetRotationY.current;
             groupRef.current.rotation.y = THREE.MathUtils.lerp(current, target, delta * 5);
        } else {
             groupRef.current.rotation.y = targetRotationY.current;
        }
    }
  });

  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      {/* Wider Inner Core */}
      <mesh position={[0, 4, 0]} scale={isAssembled ? 1 : 0}>
        <coneGeometry args={[3.5, 9, 32]} />
        <meshStandardMaterial color="#000903" roughness={0.9} />
      </mesh>

      {/* Trunk */}
      <mesh position={[0, 0, 0]} scale={isAssembled ? 1 : 0}>
        <cylinderGeometry args={[1.0, 1.5, 3]} />
        <meshStandardMaterial color="#2a1a10" roughness={1} />
      </mesh>

      <TreeParticles isAssembled={isAssembled} customColor={customColor} />
      <Ornaments isAssembled={isAssembled} />
      <Star isAssembled={isAssembled} />
      <Gifts isAssembled={isAssembled} />

      {/* Floor glow */}
      <pointLight position={[0, 1, 0]} intensity={isAssembled ? 2 : 0.5} color={customColor} distance={8} />
    </group>
  );
};