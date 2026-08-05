import { Suspense, lazy, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { MathUtils } from "three";
import type { Group, PerspectiveCamera, PointLight } from "three";
import ProceduralOwl from "./ProceduralOwl";
import Reticle from "./Reticle";
import { OWL_FRAME } from "./owlGeometry";
import type { Gaze } from "./gaze";
import type { Box, Pointer } from "../../lib/hooks";

const OWL_MODEL_URL = (import.meta.env.VITE_OWL_MODEL_URL ?? "").trim();
const OwlModel = lazy(() => import("./OwlModel"));

/** World height of the frame at the origin, for the camera set in Hero3D. */
const FRAME_HEIGHT = 2 * 5.2 * Math.tan(MathUtils.degToRad(16));
/** Clear pixels kept between the owl's frame and the edges of its slot. */
const SLOT_INSET = 14;
const MIN_SCALE = 0.3;
const MAX_SCALE = 0.9;

/**
 * The rim light's orbit, its falloff and its brightness, all in owl-space so
 * they ride the fitted scale. Held in the same group as the owl, a light at a
 * fixed world radius would sweep a small owl and sit inside a large one.
 */
const RIM_ORBIT = { x: 5.3, y: 2.3, yWobble: 1.15, z: 3.6, zOffset: 2.6 };
const RIM_DISTANCE = 18.3;
const RIM_INTENSITY = 72;

/**
 * How far the pointer travels from the owl before it has its full attention,
 * in half-viewports. Roughly the width of the hero's copy column: standing
 * over the headline should already have the owl looking at you.
 */
const GAZE_REACH = 1;
/** And how far out it notices you at all, on the same scale. */
const ATTENTION_RANGE = 1.35;

export interface OwlSceneProps {
  pointer: RefObject<Pointer>;
  scrollProgress: RefObject<number>;
  /** The hero's owl slot, in CSS pixels relative to the hero. */
  slot: Box;
  degraded: boolean;
  onReady: () => void;
}

export default function OwlScene({
  pointer,
  scrollProgress,
  slot,
  degraded,
  onReady,
}: OwlSceneProps) {
  const owlRef = useRef<Group>(null);
  const rimRef = useRef<PointLight>(null);
  const framesRendered = useRef(0);
  const gaze = useRef<Gaze>({ x: 0, y: 0, attention: 0 });

  const camera = useThree((state) => state.camera as PerspectiveCamera);
  const size = useThree((state) => state.size);

  // Fit the reticle-to-chin box inside the slot the layout measured out. The
  // canvas is full-bleed but the subject is placed by CSS, so the composition
  // holds on a wide desktop, a short laptop and a stacked phone without a
  // second set of breakpoints living in here.
  const pxPerUnit = size.height / FRAME_HEIGHT;
  const measured = slot.width > 0 && slot.height > 0;
  const boxW = measured ? slot.width : size.width * 0.62;
  const boxH = measured ? slot.height : size.height * 0.42;
  const centerPxX = measured ? slot.x + slot.width / 2 : size.width / 2;
  const centerPxY = measured ? slot.y + slot.height / 2 : size.height * 0.3;

  const fit = Math.min(
    Math.max(boxW - SLOT_INSET * 2, 40) / OWL_FRAME.width,
    Math.max(boxH - SLOT_INSET * 2, 40) / OWL_FRAME.height,
  );
  const scale = MathUtils.clamp(fit / pxPerUnit, MIN_SCALE, MAX_SCALE);
  // Only enough to bring the middle of the owl's frame onto the camera's axis.
  const lift = -OWL_FRAME.centerY * scale;

  // Then shift the lens rather than the owl. Translating the group sideways
  // instead would put it off-axis, which opens perspective parallax between
  // the head and the reticle behind it and turns the face three-quarter.
  // Offsetting the frustum slides the whole image, subject included, so the
  // owl lands in its slot still square to the camera.
  useLayoutEffect(() => {
    camera.setViewOffset(
      size.width,
      size.height,
      size.width / 2 - centerPxX,
      size.height / 2 - centerPxY,
      size.width,
      size.height,
    );
    return () => camera.clearViewOffset();
  }, [camera, size.width, size.height, centerPxX, centerPxY]);

  useFrame((state, delta) => {
    const owl = owlRef.current;
    const elapsed = state.clock.elapsedTime;
    const progress = scrollProgress.current;
    // Frame-rate independent damping, so parallax feels the same at 30 and 144fps.
    const damp = 1 - Math.exp(-4.5 * Math.min(delta, 0.1));

    // 1. Where the pointer is with respect to the owl, not to the viewport.
    // The owl sits off to one side of a split hero, so a pointer over the
    // headline is well to its left even though it is near the middle of the
    // screen: measuring from the slot is what makes the tracking land.
    // Without a pointer at all, the owl is told it is being looked at from
    // straight ahead, which hands it back to its own idle drift.
    const ownX = (centerPxX / size.width) * 2 - 1;
    const ownY = (centerPxY / size.height) * 2 - 1;
    const tracking = pointer.current.tracking;
    const offX = tracking ? pointer.current.x - ownX : 0;
    const offY = tracking ? pointer.current.y - ownY : 0;
    const range = tracking ? Math.hypot(offX, offY) : ATTENTION_RANGE;
    // Damped here rather than at each reader, so the head, the irises and the
    // reticle all move off one signal and stay in step.
    gaze.current.x += (MathUtils.clamp(offX / GAZE_REACH, -1, 1) - gaze.current.x) * damp;
    gaze.current.y += (MathUtils.clamp(offY / GAZE_REACH, -1, 1) - gaze.current.y) * damp;
    gaze.current.attention +=
      (MathUtils.clamp(1 - range / ATTENTION_RANGE, 0, 1) - gaze.current.attention) * damp;

    if (owl) {
      // 2. Idle: a slight sway and a breathing scale. The turn itself belongs
      // to the head, one group down, so the body can stay put underneath it.
      owl.rotation.y = Math.sin(elapsed * 0.19) * 0.05;
      owl.scale.setScalar(1 + Math.sin(elapsed * 0.62) * 0.009);
      owl.rotation.x = MathUtils.lerp(owl.rotation.x, progress * 0.2, damp);
      owl.position.y = MathUtils.lerp(owl.position.y, -progress * 0.55, damp);
    }

    // 3. Pointer parallax: the camera drifts, the owl holds its mark. Kept
    // shallow now that the owl answers the pointer itself. The camera and the
    // head are pulling in the same direction, so at the old amplitude they
    // summed, and because the reticle sits behind the head, the drift also
    // slides the ring off it. Enough for depth, not enough to break the frame.
    camera.position.x += (pointer.current.x * 0.19 - camera.position.x) * damp;
    camera.position.y += (-pointer.current.y * 0.12 - camera.position.y) * damp;
    camera.lookAt(0, 0, 0);

    // 4. A gold rim light on a slow orbit, sweeping the metal.
    if (rimRef.current && !degraded) {
      const angle = elapsed * 0.3;
      rimRef.current.position.set(
        Math.cos(angle) * RIM_ORBIT.x,
        RIM_ORBIT.y + Math.sin(angle * 1.7) * RIM_ORBIT.yWobble,
        Math.sin(angle) * RIM_ORBIT.z + RIM_ORBIT.zOffset,
      );
    }

    // Hand off from the poster only once real pixels have landed.
    if (framesRendered.current < 2) {
      framesRendered.current += 1;
      if (framesRendered.current === 2) onReady();
    }
  });

  return (
    <>
      <fogExp2 attach="fog" args={["#070b12", 0.075]} />

      {/* Low ambient on purpose: the owl is a dark sculpture in a dark room,
          so the form has to be described by one key and a rim, not by fill. */}
      <ambientLight intensity={0.14} color="#6f8bb8" />
      <directionalLight position={[-3.2, 3.4, 4.2]} intensity={1.65} color="#e8f0ff" />
      <directionalLight position={[3.6, -0.6, -2.4]} intensity={0.4} color="#4d6288" />

      {/* Reflections come from inline light shapes rather than an HDRI, so
          nothing is fetched from a CDN and the probe renders exactly once. */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#dce6f4"
          position={[-4, 3, 3]}
          scale={[7, 7, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          intensity={3.4}
          color="#e9b45c"
          position={[3.6, 1.2, 2.2]}
          scale={3.4}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#1b2638"
          position={[0, -3.5, -2]}
          scale={[9, 9, 1]}
          target={[0, 0, 0]}
        />
      </Environment>

      <group position={[0, lift, 0]} scale={scale}>
        {/* Inside the fitted group, so the sweep keeps its shape at every
            size. Falloff and brightness are world-space properties that the
            group's scale does not touch, so they are rescaled here: distance
            with it, intensity with its square. */}
        <pointLight
          ref={rimRef}
          position={[RIM_ORBIT.x, RIM_ORBIT.y, RIM_ORBIT.zOffset]}
          intensity={RIM_INTENSITY * scale * scale}
          distance={RIM_DISTANCE * scale}
          decay={2}
          color="#e9b45c"
        />
        <Reticle scrollProgress={scrollProgress} gaze={gaze} />
        <group ref={owlRef}>
          {OWL_MODEL_URL ? (
            <Suspense fallback={<ProceduralOwl scrollProgress={scrollProgress} gaze={gaze} />}>
              <OwlModel url={OWL_MODEL_URL} />
            </Suspense>
          ) : (
            <ProceduralOwl scrollProgress={scrollProgress} gaze={gaze} />
          )}
        </group>
      </group>
    </>
  );
}
