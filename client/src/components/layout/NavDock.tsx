import React, { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';
import { Home, Wrench, BookOpen, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItemData {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItemData[] = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Tool', to: '/tools', icon: Wrench },
  { label: 'Learning', to: '/learning', icon: BookOpen },
  { label: 'About', to: '/about', icon: Info },
];

interface DockItemProps {
  item: NavItemData;
  mouseX: MotionValue<number>;
  distance?: number;
  magnification?: number;
}

function DockItem({
  item,
  mouseX,
  distance = 140,
  magnification = 1.18,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActive = item.end
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to);

  // Proximity calculation: distance from cursor clientX to item center
  const mouseDistance = useTransform(mouseX, (val) => {
    if (typeof val !== 'number' || isNaN(val) || val === Infinity) return distance;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return distance;
    const itemCenter = rect.left + rect.width / 2;
    return val - itemCenter;
  });

  // Spring physics matching Lightswind / macOS dock
  const springConfig = { mass: 0.1, stiffness: 200, damping: 14 };

  // Scale curve: peaks at 0 distance, returns to 1.0 at +/- distance
  const targetScale = useTransform(
    mouseDistance,
    [-distance, -distance * 0.5, 0, distance * 0.5, distance],
    [1.0, 1.08, magnification, 1.08, 1.0]
  );
  const scale = useSpring(targetScale, springConfig);

  // Vertical lift on proximity (floating effect)
  const targetY = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [0, -3, 0]
  );
  const y = useSpring(targetY, springConfig);

  // Icon magnification
  const targetIconScale = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [1.0, 1.22, 1.0]
  );
  const iconScale = useSpring(targetIconScale, springConfig);

  const Icon = item.icon;

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <motion.div
        style={{
          scale,
          y,
          transformOrigin: 'center center',
        }}
        whileTap={{ scale: 0.94 }}
        className="relative flex items-center"
      >
        <NavLink
          to={item.to}
          end={item.end}
          className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg select-none transition-colors duration-200 ${
            isActive
              ? 'text-neutral-900 font-bold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
          aria-label={item.label}
        >
          {/* Animated active background pill that glides between items */}
          {isActive && (
            <motion.div
              layoutId="dock-active-pill"
              className="absolute inset-0 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}

          <motion.span
            style={{ scale: iconScale }}
            className="flex items-center justify-center"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </motion.span>
          <span>{item.label}</span>
        </NavLink>
      </motion.div>
    </div>
  );
}

export function NavDock() {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.nav
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="hidden md:flex items-center gap-1 bg-neutral-100/80 backdrop-blur-md p-1 rounded-xl border border-neutral-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.7)] select-none"
      aria-label="Primary navigation"
    >
      {navItems.map((item) => (
        <DockItem key={item.to} item={item} mouseX={mouseX} />
      ))}
    </motion.nav>
  );
}

export { navItems };
