"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  Stars,
  Sparkles,
} from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

type VoyageGlobeProps = {
  destination?: string;
};

function DestinationMarker() {
  const marker = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (marker.current) {
      marker.current.position.y =
        Math.sin(time * 2.2) * 0.025;
    }

    if (pulse.current) {
      const scale =
        1 + Math.sin(time * 3) * 0.18;

      pulse.current.scale.set(
        scale,
        scale,
        scale
      );

      const material =
        pulse.current.material as THREE.MeshBasicMaterial;

      material.opacity =
        0.18 +
        (Math.sin(time * 3) + 1) * 0.06;
    }
  });

  return (
    <group
      ref={marker}
      position={[0.85, 0.65, 1.45]}
    >
      {/* Outer pulse */}
      <mesh ref={pulse}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshBasicMaterial
          color="#d4b27b"
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Main marker */}
      <mesh>
        <sphereGeometry args={[0.055, 24, 24]} />
        <meshStandardMaterial
          color="#f0c985"
          emissive="#d4b27b"
          emissiveIntensity={3}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>

      {/* Vertical beam */}
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry
          args={[0.008, 0.008, 0.32, 12]}
        />
        <meshBasicMaterial
          color="#d4b27b"
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  );
}

function OrbitRing({
  rotation,
  scale,
  opacity,
  speed,
}: {
  rotation: [number, number, number];
  scale: number;
  opacity: number;
  speed: number;
}) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring.current) {
      ring.current.rotation.z += delta * speed;
    }
  });

  return (
    <mesh
      ref={ring}
      rotation={rotation}
      scale={scale}
    >
      <torusGeometry
        args={[1.72, 0.008, 12, 180]}
      />

      <meshBasicMaterial
        color="#d4b27b"
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

function GlobeCore() {
  const globe = useRef<THREE.Group>(null);
  const atmosphere = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (globe.current) {
      globe.current.rotation.y += delta * 0.075;

      globe.current.rotation.x =
        Math.sin(
          state.clock.elapsedTime * 0.18
        ) * 0.025;
    }

    if (atmosphere.current) {
      const pulse =
        1 +
        Math.sin(
          state.clock.elapsedTime * 0.7
        ) *
          0.008;

      atmosphere.current.scale.setScalar(
        pulse
      );
    }
  });

  return (
    <group ref={globe}>
      {/* Main globe */}
      <mesh>
        <sphereGeometry
          args={[1.72, 96, 96]}
        />

        <meshStandardMaterial
          color="#101010"
          roughness={0.62}
          metalness={0.28}
        />
      </mesh>

      {/* Subtle geographic grid */}
      <mesh scale={1.012}>
        <sphereGeometry
          args={[1.72, 64, 64]}
        />

        <meshBasicMaterial
          color="#d4b27b"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Inner highlight */}
      <mesh scale={1.018}>
        <sphereGeometry
          args={[1.72, 64, 64]}
        />

        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.035}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh
        ref={atmosphere}
        scale={1.055}
      >
        <sphereGeometry
          args={[1.72, 64, 64]}
        />

        <meshBasicMaterial
          color="#d4b27b"
          transparent
          opacity={0.055}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main orbital rings */}
      <OrbitRing
        rotation={[
          Math.PI / 2.7,
          0.2,
          0,
        ]}
        scale={1.34}
        opacity={0.48}
        speed={0.13}
      />

      <OrbitRing
        rotation={[
          0.8,
          0.4,
          0,
        ]}
        scale={1.16}
        opacity={0.14}
        speed={-0.09}
      />

      <OrbitRing
        rotation={[
          1.25,
          -0.6,
          0.5,
        ]}
        scale={1.08}
        opacity={0.08}
        speed={0.06}
      />

      {/* Destination */}
      <DestinationMarker />

      {/* Floating light */}
      <Float
        speed={1.2}
        rotationIntensity={0.15}
        floatIntensity={0.45}
      >
        <mesh position={[-1.15, 0.9, 1.25]}>
          <sphereGeometry
            args={[0.025, 16, 16]}
          />

          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.75}
          />
        </mesh>
      </Float>

      <Float
        speed={1.7}
        rotationIntensity={0.2}
        floatIntensity={0.6}
      >
        <mesh position={[1.25, -0.8, 1]}>
          <sphereGeometry
            args={[0.018, 16, 16]}
          />

          <meshBasicMaterial
            color="#d4b27b"
            transparent
            opacity={0.7}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function VoyageGlobe({
  destination = "your next destination",
}: VoyageGlobeProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[#070707]">

      {/* Ambient glow behind globe */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#927a5a]/10 blur-[100px]" />

      <Canvas
        camera={{
          position: [0, 0, 6.1],
          fov: 42,
        }}
        dpr={[1, 1.8]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <color
          attach="background"
          args={["#070707"]}
        />

        {/* Lighting */}
        <ambientLight intensity={0.45} />

        <directionalLight
          position={[4, 3, 5]}
          intensity={3.4}
        />

        <directionalLight
          position={[-4, -2, 2]}
          intensity={0.65}
        />

        <pointLight
          position={[-3, 1, 4]}
          intensity={1.8}
          distance={8}
        />

        {/* Deep-space stars */}
        <Stars
          radius={65}
          depth={45}
          count={2200}
          factor={2.1}
          saturation={0}
          fade
          speed={0.25}
        />

        {/* Close particles */}
        <Sparkles
          count={80}
          scale={[7, 5, 5]}
          size={1.1}
          speed={0.18}
          opacity={0.35}
          color="#d4b27b"
        />

        <GlobeCore />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.055}
          autoRotate
          autoRotateSpeed={0.22}
          minPolarAngle={Math.PI / 2.35}
          maxPolarAngle={Math.PI / 1.6}
        />
      </Canvas>

      {/* Top label */}
      <div className="pointer-events-none absolute left-6 top-6 z-10 md:left-9 md:top-8">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4b27b] shadow-[0_0_12px_rgba(212,178,123,0.9)]" />

          <p className="text-[9px] font-medium uppercase tracking-[0.38em] text-white/40">
            VoyageAI · Global Explorer
          </p>
        </div>
      </div>

      {/* Interaction hint */}
      <div className="pointer-events-none absolute right-6 top-6 z-10 hidden md:block md:right-9 md:top-8">
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/35 backdrop-blur-md">
          Explore the world
        </div>
      </div>

      {/* Bottom cinematic content */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-7 md:p-10">

        <div className="max-w-2xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/40">
            Intelligent travel planning
          </p>

          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
            The world is
            <br />
            <span className="text-white/45">
              waiting.
            </span>
          </h2>

          <p className="mt-4 max-w-md text-sm leading-6 text-white/45 md:text-base">
            Tell us where you're going and
            VoyageAI will shape the journey
            around you.
          </p>

          {/* Destination pill */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white/75 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4b27b] opacity-40" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d4b27b]" />
            </span>

            <span className="max-w-[220px] truncate">
              {destination || "Your next destination"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom cinematic fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/45 to-transparent" />

      {/* Edge vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" />
    </div>
  );
}