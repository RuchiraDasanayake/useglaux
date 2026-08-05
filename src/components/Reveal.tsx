import { m, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * The one reveal used across the page: a short fade and rise as a block
 * enters the viewport, on the shared `--ease-out` curve. Motion here only
 * reinforces reading order, so the reduced-motion path drops it entirely
 * rather than substituting something else.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** So a reveal can sit directly inside a list without breaking it. */
  as?: "div" | "li";
}) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const timeout = window.setTimeout(() => setVisible(true), 1400 + delay * 1000);
    return () => window.clearTimeout(timeout);
  }, [delay, reducedMotion]);

  if (reducedMotion) {
    return as === "li" ? (
      <li className={className}>{children}</li>
    ) : (
      <div className={className}>{children}</div>
    );
  }

  const Motion = as === "li" ? m.li : m.div;

  return (
    <Motion
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setVisible(true)}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Motion>
  );
}
