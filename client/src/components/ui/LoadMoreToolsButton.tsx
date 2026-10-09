import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles, Wrench } from 'lucide-react';

interface LoadMoreToolsButtonProps {
  to?: string;
  label?: string;
  subtext?: string;
  className?: string;
}

export function LoadMoreToolsButton({
  to = '/tools',
  label = 'Load More Tools',
  subtext = 'Explore all upcoming converters, validators, and developer utilities',
  className = '',
}: LoadMoreToolsButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coordinate tracking for interactive holo flare
  const mouseX = useMotionValue(100);
  const mouseY = useMotionValue(25);

  const springX = useSpring(mouseX, { mass: 0.1, stiffness: 240, damping: 20 });
  const springY = useSpring(mouseY, { mass: 0.1, stiffness: 240, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const flareBackground = useMotionTemplate`radial-gradient(160px circle at ${springX}px ${springY}px, rgba(37, 99, 235, 0.15), transparent 75%)`;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Interactive Big Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative group inline-block"
      >
        {/* 1. Outer Ambient Aura Bloom (Soft Diffuse Lighting) */}
        <div
          className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-sky-400/25 via-primary-500/30 to-indigo-500/25 blur-xl opacity-40 group-hover:opacity-100 group-hover:blur-2xl transition-all duration-500 -z-10"
          aria-hidden="true"
        />

        <Link
          ref={buttonRef}
          to={to}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative inline-flex items-center justify-center rounded-2xl p-[1.5px] overflow-hidden shadow-sm group-hover:shadow-[0_16px_36px_-10px_rgba(37,99,235,0.28)] transition-shadow duration-300"
          aria-label={label}
        >
          {/* 2. Spinning Border Beam (Conic Gradient Orbit Runner) */}
          <div
            className="absolute inset-[-100%] opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg 260deg, #38bdf8 300deg, #2563eb 335deg, #4f46e5 360deg)',
              animation: 'spin 4s linear infinite',
            }}
            aria-hidden="true"
          />

          {/* 3. Static Subtle Border Underlay */}
          <div className="absolute inset-0 rounded-2xl border border-neutral-200/90 pointer-events-none" />

          {/* 4. Inner Surface */}
          <div className="relative flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-4.5 rounded-[14.5px] bg-white group-hover:bg-neutral-50/80 text-neutral-900 transition-colors duration-200 overflow-hidden select-none">
            {/* Interactive Cursor Flare */}
            <motion.div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: flareBackground,
                opacity: isHovered ? 1 : 0,
              }}
              aria-hidden="true"
            />

            {/* Sparkle Icon with micro-pulse */}
            <span className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-primary-50 text-primary-600 border border-primary-100/80 group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-200">
              <Sparkles className="h-4 w-4 stroke-[2.2]" />
            </span>

            {/* Main Button Text */}
            <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900 group-hover:text-primary-700 transition-colors duration-200">
              {label}
            </span>

            {/* Micro Counter Pill */}
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200/80 group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200 transition-colors duration-200">
              +More
            </span>

            {/* Animated Directional Arrow */}
            <span className="flex items-center justify-center ml-0.5 text-neutral-400 group-hover:text-primary-600 transition-colors duration-200">
              <ArrowRight className="h-4.5 w-4.5 stroke-[2.5] transform group-hover:translate-x-1.5 transition-transform duration-200" />
            </span>
          </div>
        </Link>
      </motion.div>

      {/* Subtitle / Contextual Helper */}
      {subtext && (
        <p className="mt-3.5 text-xs text-neutral-500 font-normal max-w-sm">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default LoadMoreToolsButton;
