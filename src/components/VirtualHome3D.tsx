"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float, Sky, Cloud, KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { clsx } from "clsx";
import { Zap } from "lucide-react";

// PREMIUM COLOR PALETTE
const COLORS = {
  WALL_L1: "#d4a373", // Warm Wood
  ROOF_L1: "#606c38", // Forest Green
  WALL_L2: "#fefae0", // Off White
  ROOF_L2: "#283618", // Dark Olive
  WALL_L3: "#f1f2f6", // Clean White
  ROOF_L3: "#2f3542", // Modern Navy
  GLASS: "#a8dadc",
  WOOD: "#bc6c25",
  STONE: "#8d99ae",
  POOL: "#48cae4",
  FLOOR: "#5c4033", // Dark Wood Floor
  DESK: "#8b4513",
  CHAIR: "#2f3542",
  SCREEN: "#000000"
};

// --- HOUSE MODELS ---

const HouseLevel1 = () => (
  <group>
    {/* Foundation */}
    <mesh position={[0, 0.1, 0]} castShadow>
      <boxGeometry args={[2.5, 0.2, 2.5]} />
      <meshStandardMaterial color={COLORS.STONE} />
    </mesh>
    {/* Main Cabin Body */}
    <mesh position={[0, 1.1, 0]} castShadow>
      <boxGeometry args={[2.2, 1.8, 2.2]} />
      <meshStandardMaterial color={COLORS.WALL_L1} />
    </mesh>
    {/* Windows with frames */}
    {[ [0.6, 1.2, 1.11], [-0.6, 1.2, 1.11], [1.11, 1.2, 0.5], [1.11, 1.2, -0.5] ].map((pos, i) => (
      <group key={i} position={pos as any} rotation={i >= 2 ? [0, Math.PI/2, 0] : [0, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color={COLORS.GLASS} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshStandardMaterial color={COLORS.WOOD} />
        </mesh>
      </group>
    ))}
    {/* A-Frame Roof - More complex */}
    <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[2, 1.4, 4]} />
      <meshStandardMaterial color={COLORS.ROOF_L1} />
    </mesh>
    {/* Chimney */}
    <mesh position={[0.7, 2.2, 0.7]} castShadow>
      <boxGeometry args={[0.35, 1.2, 0.35]} />
      <meshStandardMaterial color={COLORS.STONE} />
    </mesh>
    {/* Front Deck */}
    <mesh position={[0, 0.2, 1.4]} castShadow>
      <boxGeometry args={[2, 0.1, 0.8]} />
      <meshStandardMaterial color={COLORS.WOOD} />
    </mesh>
    {/* Support Pillars */}
    <mesh position={[0.8, 0.1, 1.7]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 0.2]} />
      <meshStandardMaterial color={COLORS.WOOD} />
    </mesh>
    <mesh position={[-0.8, 0.1, 1.7]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 0.2]} />
      <meshStandardMaterial color={COLORS.WOOD} />
    </mesh>
  </group>
);

const HouseLevel2 = () => (
  <group>
    {/* Modern Base - Larger */}
    <mesh position={[0, 0.7, 0]} castShadow>
      <boxGeometry args={[4, 1.4, 3.5]} />
      <meshStandardMaterial color={COLORS.WALL_L2} />
    </mesh>
    {/* Upper Block - Offset for balcony */}
    <mesh position={[0.5, 2.1, 0]} castShadow>
      <boxGeometry args={[3, 1.4, 3]} />
      <meshStandardMaterial color={COLORS.WALL_L2} />
    </mesh>
    {/* Balcony Deck */}
    <mesh position={[-1.2, 1.4, 0]} castShadow>
      <boxGeometry args={[1.5, 0.1, 3.5]} />
      <meshStandardMaterial color={COLORS.WOOD} />
    </mesh>
    {/* Glass Railing */}
    <mesh position={[-1.9, 1.7, 0]} castShadow>
      <boxGeometry args={[0.05, 0.6, 3.5]} />
      <meshStandardMaterial color={COLORS.GLASS} transparent opacity={0.3} />
    </mesh>
    {/* Flat Roof overhang - Detailed */}
    <mesh position={[0.5, 2.8, 0]} castShadow>
      <boxGeometry args={[3.4, 0.15, 3.4]} />
      <meshStandardMaterial color={COLORS.ROOF_L2} />
    </mesh>
    {/* Architectural Vertical Slats */}
    <group position={[2.01, 0.7, 0]}>
      {[ -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2 ].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} castShadow>
          <boxGeometry args={[0.05, 1.4, 0.1]} />
          <meshStandardMaterial color={COLORS.WOOD} />
        </mesh>
      ))}
    </group>
    {/* Massive Corner Windows */}
    <mesh position={[-1.5, 0.8, 1.76]} castShadow>
      <planeGeometry args={[2.5, 1]} />
      <meshStandardMaterial color={COLORS.GLASS} transparent opacity={0.4} metalness={0.9} roughness={0.1} />
    </mesh>
  </group>
);

const HouseLevel3 = () => (
  <group>
    {/* Grand Entrance Block */}
    <mesh position={[0, 1.2, 0]} castShadow>
      <boxGeometry args={[5, 2.4, 4]} />
      <meshStandardMaterial color={COLORS.WALL_L3} />
    </mesh>
    {/* Luxury Wing */}
    <mesh position={[3.5, 0.9, 0]} castShadow>
      <boxGeometry args={[3, 1.8, 3.5]} />
      <meshStandardMaterial color={COLORS.WALL_L3} />
    </mesh>
    {/* Penthouse Suite */}
    <mesh position={[0, 3, 0]} castShadow>
      <boxGeometry args={[3.5, 1.2, 3]} />
      <meshStandardMaterial color={COLORS.WALL_L3} />
    </mesh>
    {/* Feature Glass Staircase Tower */}
    <mesh position={[-2.2, 1.5, 1.5]} castShadow>
      <boxGeometry args={[1.2, 3, 1.2]} />
      <meshStandardMaterial color={COLORS.GLASS} transparent opacity={0.5} metalness={0.8} />
    </mesh>
    {/* Multiple Slanted Roofs - Very Modern */}
    {[ {pos:[0, 3.6, 0], rot:[0.1, 0, 0], scale:[4, 0.1, 3.5]}, 
       {pos:[3.5, 1.8, 0], rot:[-0.1, 0, 0], scale:[3.5, 0.1, 4]} ].map((r, i) => (
      <mesh key={i} position={r.pos as any} rotation={r.rot as any} castShadow>
        <boxGeometry args={r.scale as any} />
        <meshStandardMaterial color={COLORS.ROOF_L3} />
      </mesh>
    ))}
    {/* Infinity Pool with Decking */}
    <group position={[3, 0.05, 3]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color={COLORS.POOL} transparent opacity={0.8} metalness={0.9} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[4.5, 0.1, 3.5]} />
        <meshStandardMaterial color={COLORS.WOOD} />
      </mesh>
    </group>
    {/* Garden Balconies */}
    <mesh position={[-1, 2.4, 2.01]} castShadow>
      <boxGeometry args={[2, 0.1, 1]} />
      <meshStandardMaterial color={COLORS.STONE} />
    </mesh>
  </group>
);

// --- ASSET MODELS ---

const SolarArray = () => (
  <group position={[0.5, 2.5, 0]} rotation={[-0.3, 0, 0]}>
    <mesh castShadow>
      <boxGeometry args={[2, 0.05, 1.2]} />
      <meshStandardMaterial color="#1e3a8a" metalness={0.9} roughness={0.1} />
    </mesh>
    <gridHelper args={[2, 6, "#60a5fa", "#60a5fa"]} rotation={[Math.PI / 2, 0, 0]} />
  </group>
);

const BackyardGarden = () => (
  <group position={[-3, 0, -2]}>
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color="#2d6a4f" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1]} />
        <meshStandardMaterial color="#582f0e" />
      </mesh>
    </Float>
    <Float speed={1.5} position={[1.8, 0, 0.8]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#40916c" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8]} />
        <meshStandardMaterial color="#582f0e" />
      </mesh>
    </Float>
  </group>
);

const SportsZone = () => (
  <group position={[3.5, 0, 2]}>
    {/* Court Floor */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[3, 3]} />
      <meshStandardMaterial color="#e63946" />
    </mesh>
    {/* Hoop */}
    <group position={[0, 0, -1.2]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.4]} />
        <meshStandardMaterial color="#2b2d42" />
      </mesh>
      <mesh position={[0, 2.2, 0.1]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 2, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.02, 16, 32]} />
        <meshStandardMaterial color="#fca311" />
      </mesh>
    </group>
  </group>
);

const RecycleHub = () => (
  <group position={[-2.5, 0, 2.5]}>
    <mesh position={[-0.3, 0.3, 0]} castShadow>
      <boxGeometry args={[0.4, 0.6, 0.4]} />
      <meshStandardMaterial color="#2d6a4f" />
    </mesh>
    <mesh position={[0.3, 0.3, 0]} castShadow>
      <boxGeometry args={[0.4, 0.6, 0.4]} />
      <meshStandardMaterial color="#0077b6" />
    </mesh>
  </group>
);

const SmartFilter = () => (
  <group position={[1.5, 0, -2.5]}>
    <mesh position={[0, 0.6, 0]} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 1.2, 16]} />
      <meshStandardMaterial color="#caf0f8" metalness={0.6} roughness={0.2} />
    </mesh>
    <mesh position={[0, 1.2, 0]}>
      <sphereGeometry args={[0.36, 16, 16]} />
      <meshStandardMaterial color="#00b4d8" />
    </mesh>
  </group>
);

const SolarBattery = () => (
  <group position={[-2.5, 0.4, 0]}>
    <mesh castShadow>
      <boxGeometry args={[0.4, 0.8, 0.6]} />
      <meshStandardMaterial color="#334155" metalness={0.8} />
    </mesh>
    <mesh position={[0.21, 0, 0]}>
      <planeGeometry args={[0.4, 0.6]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
    </mesh>
  </group>
);

const WaterReservoir = () => (
  <group position={[2.5, 0.8, -2.5]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.6, 0.6, 1.6, 16]} />
      <meshStandardMaterial color="#64748b" />
    </mesh>
    <mesh position={[0, 0.8, 0]}>
      <sphereGeometry args={[0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#64748b" />
    </mesh>
  </group>
);

const WindTurbine = () => (
  <group position={[-4, 0, -3.5]}>
    {/* Base/Pole */}
    <mesh position={[0, 2, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.2, 4, 16]} />
      <meshStandardMaterial color="#f1f5f9" />
    </mesh>
    {/* Blades */}
    <Float speed={10} rotationIntensity={0} floatIntensity={0}>
      <group position={[0, 4, 0.2]}>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
          <mesh key={i} rotation={[0, 0, angle]} position={[0, 0, 0]} castShadow>
            <boxGeometry args={[1.5, 0.1, 0.05]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
        {/* Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>
    </Float>
  </group>
);

const TaxConsultant = () => (
  <group position={[-1.5, 0, 3]}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[0.6, 1, 0.1]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
    <mesh position={[0, 0.8, 0.06]}>
      <planeGeometry args={[0.4, 0.2]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  </group>
);

const GamingSetup = () => (
  <group position={[0, 1.5, 0]}>
    <pointLight position={[0.5, 0, 0.8]} intensity={0.5} color="#a855f7" />
  </group>
);

const ArtStudio = () => (
  <group position={[-1, 2.2, 1.5]} rotation={[0, -0.5, 0]}>
    {/* Easel */}
    <mesh position={[0, 0.4, 0]} castShadow>
      <boxGeometry args={[0.05, 0.8, 0.05]} />
      <meshStandardMaterial color="#582f0e" />
    </mesh>
    <mesh position={[0, 0.5, 0.1]} rotation={[-0.2, 0, 0]}>
      <planeGeometry args={[0.4, 0.5]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  </group>
);

const TeslaPowerwall = () => (
  <group position={[-2.5, 0.6, -1]}>
    <mesh castShadow>
      <boxGeometry args={[0.2, 1.2, 0.8]} />
      <meshStandardMaterial color="#ffffff" metalness={0.9} />
    </mesh>
    <mesh position={[0.11, 0.4, 0]}>
      <planeGeometry args={[0.05, 0.2]} />
      <meshStandardMaterial color="#e63946" emissive="#e63946" />
    </mesh>
  </group>
);

const GoldenStatue = () => (
  <group position={[0, 0.2, 2.5]}>
    <mesh position={[0, 0.2, 0]} castShadow>
      <boxGeometry args={[0.6, 0.4, 0.6]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
    <Float speed={5} rotationIntensity={2}>
      <mesh position={[0, 1, 0]} castShadow>
        <torusKnotGeometry args={[0.3, 0.1, 64, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
      </mesh>
    </Float>
  </group>
);

interface VirtualHome3DProps {
  homeLevel: number;
  purchasedItems: string[];
  electricityStatus?: string;
}

export default function VirtualHome3D({ homeLevel, purchasedItems, electricityStatus = 'Active' }: VirtualHome3DProps) {
  const HouseModel = useMemo(() => {
    if (homeLevel >= 10) return <HouseLevel3 />;
    if (homeLevel >= 5) return <HouseLevel2 />;
    return <HouseLevel1 />;
  }, [homeLevel]);

  const powerActive = electricityStatus !== 'Cut';

  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "left", keys: ["ArrowLeft", "KeyA"] },
        { name: "right", keys: ["ArrowRight", "KeyD"] },
      ]}
    >
      <div className="w-full h-full relative group cursor-grab active:cursor-grabbing">
        <Canvas 
          shadows 
          dpr={[1, 2]} 
          camera={{ position: [10, 5, 10], fov: 32 }}
        >
          <OrbitControls
            enablePan={false}
            minDistance={6}
            maxDistance={15}
            autoRotate={false}
            target={[0, -0.5, 0]}
            makeDefault
          />
          <Suspense fallback={null}>
            <group position={[0, -1.5, 0]}>
              {HouseModel}
              {purchasedItems.includes("Solar Array") && <SolarArray />}
              {purchasedItems.includes("Backyard Garden") && <BackyardGarden />}
              {purchasedItems.includes("Sports Zone") && <SportsZone />}
              {purchasedItems.includes("Solar Battery") && <SolarBattery />}
              {purchasedItems.includes("Water Reservoir") && <WaterReservoir />}
              {purchasedItems.includes("Tax Consultant") && <TaxConsultant />}
              {purchasedItems.includes("Gaming Setup") && <GamingSetup />}
              {purchasedItems.includes("Art Studio") && <ArtStudio />}
              {purchasedItems.includes("Tesla Powerwall") && <TeslaPowerwall />}
              {purchasedItems.includes("Off-Grid Purifier") && <SmartFilter />}
              {purchasedItems.includes("Golden Statue") && <GoldenStatue />}
              {purchasedItems.includes("wind_turbine") && <WindTurbine />}

              {/* Enhanced Ground */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <circleGeometry args={[20, 64]} />
                <meshStandardMaterial color={powerActive ? "#7cfc00" : "#1a2e05"} roughness={0.8} />
              </mesh>
              
              {/* Soft Grid */}
              <gridHelper args={[40, 40, powerActive ? "rgba(255,255,255,0.1)" : "#1e293b", "transparent"]} position={[0, 0, 0]} />
            </group>

            <Sky distance={450000} sunPosition={[10, 20, 10]} inclination={0} azimuth={0.25} />
            <Cloud opacity={0.5} speed={0.4} position={[-5, 8, -5]} />
            <Cloud opacity={0.5} speed={0.4} position={[5, 10, 5]} />

            <Environment preset={powerActive ? "park" : "night"} />
            <ContactShadows
              position={[0, -1.49, 0]}
              opacity={powerActive ? 0.2 : 0.5}
              scale={30}
              blur={3}
              far={15}
            />
          </Suspense>

          <ambientLight intensity={powerActive ? 0.6 : 0.02} />
          <spotLight
            position={[15, 20, 10]}
            angle={0.15}
            penumbra={1}
            intensity={powerActive ? 2 : 0.05}
            castShadow
          />
          {powerActive && <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />}
        </Canvas>

        <div className="absolute top-6 left-6 pointer-events-none space-y-2">
          <div className="glass px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live 3D View
          </div>
          <div className={clsx(
            "glass px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
            powerActive ? "text-emerald-500" : "text-rose-500"
          )}>
            <Zap className="w-3 h-3" />
            Grid: {powerActive ? "Active" : "Power Cut"}
          </div>
        </div>
      </div>
    </KeyboardControls>
  );
}
