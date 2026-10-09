import React, { useEffect, useRef, useState } from 'react';

export interface CosmicDustProps {
  particleCount?: number;
  speedMultiplier?: number;
  particleSize?: number;
  theme?: 'light' | 'dark' | 'system';
  className?: string;
  connectParticles?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  opacity: number;
  baseOpacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  history: { x: number; y: number }[];
}

export function CosmicDust({
  particleCount = 130,
  speedMultiplier = 1.0,
  particleSize = 1.5,
  theme = 'system',
  className = '',
  connectParticles = true,
}: CosmicDustProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    isHovering: false,
    hasMoved: false,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection
  useEffect(() => {
    const checkTheme = () => {
      if (theme === 'system') {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      } else {
        setIsDarkMode(theme === 'dark');
      }
    };

    checkTheme();

    if (theme === 'system') {
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      return () => observer.disconnect();
    }
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current || canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      if (!mouseRef.current.hasMoved) {
        mouseRef.current.x = width / 2;
        mouseRef.current.y = height / 2;
        mouseRef.current.targetX = width / 2;
        mouseRef.current.targetY = height / 2;
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    // Color palettes for Cosmic Dust
    const colorsDark = [
      'rgba(34, 211, 238,', // cyan
      'rgba(168, 85, 247,', // purple
      'rgba(236, 72, 153,', // pink
      'rgba(234, 179, 8,',  // amber
      'rgba(59, 130, 246,',  // blue
      'rgba(16, 185, 129,', // emerald
    ];

    // High aesthetic jewel-toned stardust for clean light mode
    const colorsLight = [
      'rgba(37, 99, 235,',  // royal blue
      'rgba(5, 150, 105,',  // emerald
      'rgba(124, 58, 237,', // purple
      'rgba(217, 119, 6,',  // amber
      'rgba(14, 165, 233,', // sky blue
      'rgba(236, 72, 153,', // rose
    ];

    const palette = isDarkMode ? colorsDark : colorsLight;

    // Create particles
    const particles: Particle[] = [];
    const count = Math.min(particleCount, Math.floor((width * height) / 8000) || particleCount);

    for (let i = 0; i < count; i++) {
      const baseSize = (Math.random() * 1.5 + 0.8) * particleSize;
      const baseOpacity = isDarkMode
        ? Math.random() * 0.5 + 0.4
        : Math.random() * 0.45 + 0.25;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.7 * speedMultiplier,
        size: baseSize,
        baseSize,
        color: palette[Math.floor(Math.random() * palette.length)],
        opacity: baseOpacity,
        baseOpacity,
        pulseSpeed: Math.random() * 2 + 1,
        pulsePhase: Math.random() * Math.PI * 2,
        history: [],
      });
    }

    // Pointer event listeners on the parent section so interaction works across the entire section seamlessly
    const host = container.parentElement || container;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouseRef.current.targetX = clientX;
      mouseRef.current.targetY = clientY;
      mouseRef.current.isHovering = true;
      mouseRef.current.hasMoved = true;
    };

    const onPointerLeave = () => {
      mouseRef.current.isHovering = false;
    };

    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave);

    // Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing / lerp towards target cursor
      const mouse = mouseRef.current;
      const lerpSpeed = 0.12;
      mouse.x += (mouse.targetX - mouse.x) * lerpSpeed;
      mouse.y += (mouse.targetY - mouse.y) * lerpSpeed;

      const t = time * 0.001;

      // Update & Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Vector Wind Field (gentle cosmic curl noise)
        const windX = Math.cos(t * 0.4 + p.y * 0.003) * 0.3 * speedMultiplier;
        const windY = Math.sin(t * 0.4 + p.x * 0.003) * 0.3 * speedMultiplier;
        p.vx += windX * dt * 2.5;
        p.vy += windY * dt * 2.5;

        // 2. Interactive Cursor Swirling Vortex
        if (mouse.hasMoved) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vortexRadius = 240;

          if (dist < vortexRadius && dist > 4) {
            const force = (1 - dist / vortexRadius);
            const angle = Math.atan2(dy, dx);

            // Tangential spiral force (rotates around cursor like a cosmic vortex)
            const spinStrength = force * 2.2 * speedMultiplier;
            p.vx += Math.cos(angle + Math.PI / 2) * spinStrength * dt * 30;
            p.vy += Math.sin(angle + Math.PI / 2) * spinStrength * dt * 30;

            // Gentle gravitational orbit pull
            const pullStrength = force * 0.7 * speedMultiplier;
            p.vx += Math.cos(angle) * pullStrength * dt * 30;
            p.vy += Math.sin(angle) * pullStrength * dt * 30;
          }
        }

        // 3. Fluid friction & velocity clamping
        p.vx *= 0.96;
        p.vy *= 0.96;

        const maxVelocity = 3.6 * speedMultiplier;
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > maxVelocity) {
          p.vx = (p.vx / currentSpeed) * maxVelocity;
          p.vy = (p.vy / currentSpeed) * maxVelocity;
        }

        // 4. Update Position
        p.x += p.vx;
        p.y += p.vy;

        // 5. Screen wrapping with trail reset
        const padding = 30;
        if (p.x < -padding) {
          p.x = width + padding;
          p.history = [];
        } else if (p.x > width + padding) {
          p.x = -padding;
          p.history = [];
        }
        if (p.y < -padding) {
          p.y = height + padding;
          p.history = [];
        } else if (p.y > height + padding) {
          p.y = -padding;
          p.history = [];
        }

        // 6. Natural breathing/twinkling opacity
        p.opacity = p.baseOpacity * (0.65 + 0.35 * Math.sin(t * p.pulseSpeed + p.pulsePhase));

        // 7. Update Trailing History
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 6) {
          p.history.shift();
        }

        // 8. Render Fading Trailing Lines
        if (p.history.length > 2) {
          for (let h = 0; h < p.history.length - 1; h++) {
            const p1 = p.history[h];
            const p2 = p.history[h + 1];
            const progress = h / p.history.length;
            const trailAlpha = progress * p.opacity * 0.45;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${p.color}${trailAlpha})`;
            ctx.lineWidth = p.size * (0.3 + progress * 0.6);
            ctx.stroke();
          }
        }

        // 9. Render Stardust Particle Grain with Soft Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.shadowColor = `${p.color}${p.opacity * 0.8})`;
        ctx.shadowBlur = p.size * 3.5;
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow for performance
      }

      // 10. Subtle Cosmic Dust Constellation Lines (connect neighboring grains when close)
      if (connectParticles) {
        const connectDistance = 48;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const pA = particles[i];
            const pB = particles[j];
            const distSq = (pA.x - pB.x) * (pA.x - pB.x) + (pA.y - pB.y) * (pA.y - pB.y);

            if (distSq < connectDistance * connectDistance) {
              const dist = Math.sqrt(distSq);
              const lineAlpha = (1 - dist / connectDistance) * 0.12;
              ctx.beginPath();
              ctx.moveTo(pA.x, pA.y);
              ctx.lineTo(pB.x, pB.y);
              ctx.strokeStyle = `${pA.color}${lineAlpha})`;
              ctx.stroke();
            }
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [particleCount, speedMultiplier, particleSize, isDarkMode, connectParticles]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
}

export default CosmicDust;
