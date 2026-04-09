import type { ReactNode } from "react";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

type RevealDirection = "up" | "left" | "right";

const hiddenStateByDirection: Record<RevealDirection, string> = {
  up: "translate-y-8 opacity-0",
  left: "-translate-x-8 opacity-0",
  right: "translate-x-8 opacity-0",
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  delayMs?: number;
  threshold?: number;
}

const ScrollReveal = ({
  children,
  className,
  direction = "up",
  delayMs = 0,
  threshold = 0.15,
}: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollAnimation(threshold);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        "motion-reduce:transform-none motion-reduce:opacity-100 motion-safe:transition-all motion-safe:duration-700",
        isVisible ? "translate-x-0 translate-y-0 opacity-100" : hiddenStateByDirection[direction],
        className,
      )}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
