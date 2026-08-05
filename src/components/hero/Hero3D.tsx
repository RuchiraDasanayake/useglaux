import { Suspense, useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { DPR_CAP } from "../../lib/capability";
import type { DeviceTier } from "../../lib/capability";
import type { Box, Pointer } from "../../lib/hooks";
import OwlScene from "./OwlScene";

export interface Hero3DProps {
  tier: DeviceTier;
  /** False when the hero is offscreen or the tab is hidden. */
  active: boolean;
  pointer: RefObject<Pointer>;
  scrollProgress: RefObject<number>;
  /** The box the layout reserved for the owl, in hero-relative pixels. */
  slot: Box;
  onReady: () => void;
  onContextLost: () => void;
}

function ContextLifecycle({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    let frame = 0;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    const handleRestored = () => {
      // Let Three rebuild its resources and land a real frame before the
      // poster is hidden again.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(onRestored);
      });
    };

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [canvas, onLost, onRestored]);

  return null;
}

export default function Hero3D({
  tier,
  active,
  pointer,
  scrollProgress,
  slot,
  onReady,
  onContextLost,
}: Hero3DProps) {
  const [dpr, setDpr] = useState(() => Math.min(DPR_CAP[tier], window.devicePixelRatio || 1));
  const [degraded, setDegraded] = useState(false);
  const [ready, setReady] = useState(false);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady();
  }, [onReady]);
  const handleContextLost = useCallback(() => {
    setReady(false);
    onContextLost();
  }, [onContextLost]);

  return (
    <div className={`hero__layer${ready ? "" : " hero__layer--hidden"}`}>
      <Canvas
        // Parking the loop is what actually stops GPU work when the hero is
        // scrolled past or the tab is backgrounded.
        frameloop={active ? "always" : "never"}
        dpr={dpr}
        gl={{
          alpha: true,
          antialias: tier === "high",
          powerPreference: "high-performance",
          stencil: false,
        }}
        camera={{ position: [0, 0, 5.2], fov: 32, near: 0.1, far: 40 }}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ContextLifecycle onLost={handleContextLost} onRestored={handleReady} />
        <PerformanceMonitor
          ms={250}
          iterations={6}
          flipflops={2}
          onDecline={() => setDpr((current) => Math.max(1, current - 0.5))}
          onFallback={() => {
            setDpr(1);
            setDegraded(true);
          }}
        />
        <Suspense fallback={null}>
          <OwlScene
            pointer={pointer}
            scrollProgress={scrollProgress}
            slot={slot}
            degraded={degraded}
            onReady={handleReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
