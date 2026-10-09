import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RippleButtonProps {
  to?: string;
  onClick?: () => void;
  text?: string;
  className?: string;
  circleColor?: string;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export function RippleButton({
  to = '/tools',
  onClick,
  text = 'Load More Tools',
  className = '',
  circleColor = 'rgba(37, 99, 235, 0.22)',
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handlePointerDown = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now() + Math.random(),
    };

    setRipples((prev) => [...prev, newRipple]);

    if (onClick) {
      onClick();
    }
  };

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  const content = (
    <>
      {/* Expanding Ripple Circles */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => removeRipple(ripple.id)}
            className="pointer-events-none absolute rounded-full"
            style={{
              top: ripple.y,
              left: ripple.x,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: circleColor,
            }}
            aria-hidden="true"
          />
        ))}
      </AnimatePresence>

      {/* Button Text & Subtle Arrow */}
      <span className="relative z-10 flex items-center gap-2">
        <span>{text}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </>
  );

  const baseClasses =
    'relative group inline-flex items-center justify-center px-8 py-3.5 text-sm sm:text-base font-semibold text-neutral-800 bg-white border border-neutral-300/80 rounded-xl shadow-xs hover:border-neutral-400 hover:bg-neutral-50/80 hover:text-primary-600 active:scale-[0.98] transition-all duration-150 overflow-hidden select-none cursor-pointer';

  return (
    <div className={`flex justify-center ${className}`}>
      {to ? (
        <Link
          to={to}
          onMouseDown={handlePointerDown}
          className={baseClasses}
          aria-label={text}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onMouseDown={handlePointerDown}
          onClick={onClick}
          className={baseClasses}
          aria-label={text}
        >
          {content}
        </button>
      )}
    </div>
  );
}

export default RippleButton;
