'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedKohakuOrb({ isProcessing }: { isProcessing: boolean }) {
  const sphereRef = useRef<THREE.Mesh>(null!);

  useFrame((_state, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x += delta * 0.4;
      sphereRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.8}>
      <Sphere ref={sphereRef} args={[1, 64, 64]} scale={1.1}>
        <MeshDistortMaterial
          color={isProcessing ? '#635BFF' : '#4F46E5'}
          attach="material"
          distort={isProcessing ? 0.45 : 0.25}
          speed={isProcessing ? 3.5 : 1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </Sphere>
    </Float>
  );
}

export function GlowingAIOrbCanvas({ isProcessing = false }: { isProcessing?: boolean }) {
  return (
    <div className="w-full h-full min-h-[120px] min-w-[120px] relative flex items-center justify-center">
      {/* Fallback CSS Glow Rings while WebGL mounts */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-20 h-20 rounded-full bg-[#635BFF]/20 blur-xl animate-pulse" />
      </div>
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} className="w-full h-full">
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 10, 5]} intensity={1.8} color="#FFFFFF" />
        <pointLight position={[-10, -10, -10]} color="#635BFF" intensity={3} />
        <pointLight position={[10, 10, 10]} color="#38BDF8" intensity={2} />
        <AnimatedKohakuOrb isProcessing={isProcessing} />
      </Canvas>
    </div>
  );
}

export default GlowingAIOrbCanvas;
