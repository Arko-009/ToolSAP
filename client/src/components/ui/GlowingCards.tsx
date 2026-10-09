import React, { createContext, useContext, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

interface GlowingCardsContextType {
  enableGlow: boolean;
  glowRadius: number;
  glowOpacity: number;
  auraDistance: number;
}

const GlowingCardsContext = createContext<GlowingCardsContextType>({
  enableGlow: true,
  glowRadius: 360,
  glowOpacity: 1,
  auraDistance: 260,
});

export interface GlowingCardsProps {
  children: React.ReactNode;
  className?: string;
  /** Enable the glowing overlay effect */
  enableGlow?: boolean;
  /** Radius of the focused spotlight glow in px */
  glowRadius?: number;
  /** Peak opacity of the glow effect */
  glowOpacity?: number;
  /** Distance in px outside the card where the aura begins blooming softly */
  auraDistance?: number;
}

export const GlowingCards: React.FC<GlowingCardsProps> = ({
  children,
  className = '',
  enableGlow = true,
  glowRadius = 380,
  glowOpacity = 1,
  auraDistance = 260,
}) => {
  return (
    <GlowingCardsContext.Provider
      value={{
        enableGlow,
        glowRadius,
        glowOpacity,
        auraDistance,
      }}
    >
      <div className={`relative ${className}`}>{children}</div>
    </GlowingCardsContext.Provider>
  );
};

export interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hoverEffect?: boolean;
}

/**
 * Calculates Euclidean distance from a cursor point (x, y) to the nearest edge of a rectangle
 */
function getDistanceToRect(x: number, y: number, rect: DOMRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.sqrt(dx * dx + dy * dy);
}

export const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  className = '',
  glowColor = '#3b82f6',
  hoverEffect = true,
}) => {
  const { enableGlow, glowRadius, glowOpacity, auraDistance } = useContext(GlowingCardsContext);
  const cardRef = useRef<HTMLDivElement>(null);

  // Position motion values (relative to card top-left)
  const mouseX = useMotionValue(200);
  const mouseY = useMotionValue(200);

  // Continuous opacity motion value (from 0 = resting to 1 = inside card)
  const targetOpacity = useMotionValue(0);

  // Buttery-smooth spring physics for position and opacity
  const springX = useSpring(mouseX, { mass: 0.1, stiffness: 220, damping: 24 });
  const springY = useSpring(mouseY, { mass: 0.1, stiffness: 220, damping: 24 });
  const springOpacity = useSpring(targetOpacity, { mass: 0.2, stiffness: 140, damping: 22 });

  useEffect(() => {
    if (!enableGlow) return;

    let rafId: number | null = null;

    const onPointerMove = (e: MouseEvent) => {
      // Throttle coordinate updates to animation frame for 120 FPS buttery performance
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();

        // Skip computation if card is outside the current viewport
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) {
          targetOpacity.set(0);
          return;
        }

        const distance = getDistanceToRect(e.clientX, e.clientY, rect);

        if (distance < auraDistance) {
          // Continuous relative position inside/near the card
          mouseX.set(e.clientX - rect.left);
          mouseY.set(e.clientY - rect.top);

          if (distance === 0) {
            // Cursor is directly inside the card -> full glow
            targetOpacity.set(glowOpacity);
          } else {
            // Cursor is approaching from outside -> soft, progressive bloom
            // Smooth quadratic decay curve: blooms silently as you approach
            const proximityFactor = 1 - distance / auraDistance;
            const bloomIntensity = proximityFactor * proximityFactor * glowOpacity * 0.85;
            targetOpacity.set(bloomIntensity);
          }
        } else {
          // Cursor is far away -> gracefully fade to resting state
          if (targetOpacity.get() > 0) {
            targetOpacity.set(0);
          }
        }
      });
    };

    const onMouseLeaveWindow = () => {
      targetOpacity.set(0);
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeaveWindow);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseleave', onMouseLeaveWindow);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enableGlow, glowOpacity, auraDistance, mouseX, mouseY, targetOpacity]);

  // Dynamic radial gradients computed smoothly along spring coordinates
  const borderGlowBackground = useMotionTemplate`radial-gradient(${glowRadius}px circle at ${springX}px ${springY}px, ${glowColor}, transparent 70%)`;
  const innerSpotlightBackground = useMotionTemplate`radial-gradient(${glowRadius * 1.25}px circle at ${springX}px ${springY}px, ${glowColor}18, transparent 75%)`;
  const outerAuraHaloBackground = useMotionTemplate`radial-gradient(${glowRadius * 0.9}px circle at ${springX}px ${springY}px, ${glowColor}30, transparent 65%)`;

  return (
    <div
      ref={cardRef}
      className={`relative group rounded-3xl p-[1px] transition-transform duration-300 ease-out ${
        hoverEffect ? 'hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)]' : ''
      }`}
      style={
        {
          '--glow-color': glowColor,
        } as React.CSSProperties
      }
    >
      {/* 1. Base Static Border */}
      <div className="absolute inset-0 rounded-3xl border border-neutral-200/80 pointer-events-none transition-colors duration-300" />

      {/* 2. Soft Ambient Halo Bloom (Blooms gently even before reaching the card edge) */}
      {enableGlow && (
        <motion.div
          className="absolute -inset-2 rounded-3xl blur-xl pointer-events-none -z-10"
          style={{
            background: outerAuraHaloBackground,
            opacity: springOpacity,
          }}
          aria-hidden="true"
        />
      )}

      {/* 3. Interactive Glowing Border (Illuminates the edge closest to the approaching cursor) */}
      {enableGlow && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: borderGlowBackground,
            opacity: springOpacity,
          }}
          aria-hidden="true"
        />
      )}

      {/* 4. Card Surface with Specular Ambient Spotlight */}
      <div
        className={`relative h-full w-full rounded-[calc(1.5rem-1px)] bg-neutral-50/80 group-hover:bg-white/95 backdrop-blur-xl transition-colors duration-300 overflow-hidden flex flex-col justify-between ${className}`}
      >
        {/* Soft interactive surface spotlight following cursor inside and near the card */}
        {enableGlow && (
          <motion.div
            className="absolute inset-0 rounded-[calc(1.5rem-1px)] pointer-events-none"
            style={{
              background: innerSpotlightBackground,
              opacity: springOpacity,
            }}
            aria-hidden="true"
          />
        )}

        {/* 5. Actual Card Content */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
