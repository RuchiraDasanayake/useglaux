import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, SpriteMaterial } from "three";
import { HEAD_Y, RETICLE_SPRITE_SCALE, createReticleTexture } from "./owlGeometry";
import type { GazeRef } from "./gaze";

const BASE_OPACITY = 0.8;

/**
 * Radians per second the graduated band creeps round: a full turn in about
 * two minutes, so it is never caught moving and never looks static either.
 * It gains a little when the pointer approaches, which is the instrument
 * waking up rather than a speed control.
 */
const SPIN = 0.05;
const SPIN_ATTENTION = 0.09;

/**
 * Just clear of the skull, whose profile runs back to z = -0.575.
 *
 * Depth is what decides how much of the ring clears the head: it is a
 * perspective camera, so anything set further back shrinks against the face
 * in front of it. Sitting the ring close keeps the graduated band readable
 * at every size the hero fits the owl to.
 */
const DEPTH = -0.8;

/**
 * The graduated ring behind the owl's head: the observatory cue, drawn once
 * into a canvas and shown as a single billboard. It sits outside the owl's
 * rotating group so it stays concentric with the head while the owl turns.
 */
export default function Reticle({
  scrollProgress,
  gaze,
}: {
  scrollProgress: RefObject<number>;
  gaze: GazeRef;
}) {
  const texture = useMemo(createReticleTexture, []);

  const material = useMemo(
    () =>
      new SpriteMaterial({
        map: texture,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: BASE_OPACITY,
        toneMapped: false,
      }),
    [texture],
  );

  useEffect(
    () => () => {
      material.dispose();
      texture.dispose();
    },
    [material, texture],
  );

  useFrame((_, delta) => {
    const attention = gaze.current.attention;
    material.rotation += Math.min(delta, 0.1) * (SPIN + attention * SPIN_ATTENTION);
    material.opacity = BASE_OPACITY * (1 + attention * 0.22) * (1 - scrollProgress.current * 0.75);
  });

  return (
    <sprite
      position={[0, HEAD_Y, DEPTH]}
      scale={[RETICLE_SPRITE_SCALE, RETICLE_SPRITE_SCALE, 1]}
      material={material}
    />
  );
}
