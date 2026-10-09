import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

interface GlowingCardsContextType {
  enableGlow: boolean;
  glowRadius: number;
  glowOpacity: number;
}

const GlowingCardsContext = createContext<GlowingCardsContextType>({
  enableGlow: true,
  glowRadius: 360,
  glowOpacity: 1,
});

export interface GlowingCardsProps {
  children: React.ReactNode;
  className?: string;
  /** Enable the glowing overlay effect */
  enableGlow?: boolean;
  /** Size of the glow effect radius in px */
  glowRadius?: number;
  /** Opacity of the glow effect */
  glowOpacity?: number;
  /** Animation duration for glow transitions */
  animationDuration?: number;
  /** Enable hover effects on individual cards */
  enableHover?: boolean;
}

export const GlowingCards: React.FC<GlowingCardsProps> = ({
  children,
  className = '',
  enableGlow = true,
  glowRadius = 380,
  glowOpacity = 1,
}) => {
  return (
    <GlowingCardsContext.Provider
      value={{
        enableGlow,
        glowRadius,
        glowOpacity,
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

export const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  className = '',
  glowColor = '#3b82f6',
  hoverEffect = true,
}) => {
  const { enableGlow, glowRadius, glowOpacity } = useContext(GlowingCardsContext);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth spring for fluid cursor motion
  const springX = useSpring(mouseX, { stiffness: 450, damping: 32 });
  const springY = useSpring(mouseY, { stiffness: 450, damping: 32 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || !enableGlow) return;
      const rect = cardRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [enableGlow, mouseX, mouseY]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(-1000);
    mouseY.set(-1000);
  };

  // Dynamic radial gradients for border glow and inner ambient spotlight
  const borderGlowBackground = useMotionTemplate`radial-gradient(${glowRadius}px circle at ${springX}px ${springY}px, ${glowColor}, transparent 70%)`;
  const innerSpotlightBackground = useMotionTemplate`radial-gradient(${glowRadius * 1.2}px circle at ${springX}px ${springY}px, ${glowColor}18, transparent 75%)`;
  const ambientSheenBackground = useMotionTemplate`radial-gradient(${glowRadius * 0.7}px circle at ${springX}px ${springY}px, ${glowColor}25, transparent 65%)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-3xl p-[1px] transition-all duration-300 ${
        hoverEffect ? 'hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)]' : ''
      }`}
      style={
        {
          '--glow-color': glowColor,
        } as React.CSSProperties
      }
    >
      {/* 1. Base Static Border */}
      <div className="absolute inset-0 rounded-3xl border border-neutral-200/80 pointer-events-none transition-colors duration-300 group-hover:border-transparent" />

      {/* 2. Interactive Glowing Border (Illuminates exactly along the card edge under cursor) */}
      {enableGlow && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300"
          style={{
            background: borderGlowBackground,
            opacity: isHovered ? glowOpacity : 0,
          }}
          aria-hidden="true"
        />
      )}

      {/* 3. Outer Ambient Halo Bloom */}
      {enableGlow && (
        <motion.div
          className="absolute -inset-1 rounded-3xl blur-md pointer-events-none -z-10 transition-opacity duration-300"
          style={{
            background: ambientSheenBackground,
            opacity: isHovered ? glowOpacity * 0.6 : 0,
          }}
          aria-hidden="true"
        />
      )}

      {/* 4. Card Surface with Inner Ambient Spotlight */}
      <div
        className={`relative h-full w-full rounded-[calc(1.5rem-1px)] bg-neutral-50/70 group-hover:bg-white/90 backdrop-blur-xl transition-colors duration-300 overflow-hidden flex flex-col justify-between ${className}`}
      >
        {/* Soft interactive surface spotlight following cursor inside the card */}
        {enableGlow && (
          <motion.div
            className="absolute inset-0 rounded-[calc(1.5rem-1px)] pointer-events-none transition-opacity duration-300"
            style={{
              background: innerSpotlightBackground,
              opacity: isHovered ? glowOpacity : 0,
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
