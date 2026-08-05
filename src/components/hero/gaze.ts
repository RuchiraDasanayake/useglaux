import type { RefObject } from "react";

/**
 * What the owl knows about the pointer. Written once per frame by OwlScene
 * from the owl's measured place on screen, and read by everything that
 * reacts to it.
 *
 * A ref rather than state: moving the mouse must never re-render React.
 */
export interface Gaze {
  /** Pointer offset from the owl's own centre, clamped to -1..1 per axis. */
  x: number;
  y: number;
  /** 0 when the pointer is far from the owl, 1 when it is on it. */
  attention: number;
}

export type GazeRef = RefObject<Gaze>;
