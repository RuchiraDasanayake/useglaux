import { domAnimation, LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Components use the lightweight `m` primitives and the DOM-only feature
 * bundle. `strict` makes an accidental `motion.*` import fail loudly rather
 * than silently introducing the larger feature set.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
