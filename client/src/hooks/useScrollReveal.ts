import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Scroll Reveal Hook — uses IntersectionObserver to trigger
 * CSS-class-based reveal animations when elements enter the viewport.
 *
 * @param threshold - Visibility ratio to trigger (0-1). Default: 0.15
 * @param rootMargin - Margin around root. Default: '0px 0px -60px 0px'
 * @param once - If true, only triggers once. Default: true
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  once = true
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
}

/**
 * Stagger Reveal — returns refs and visibility states for multiple items.
 * Each item reveals with a progressive delay based on its index.
 */
export function useStaggerReveal(_count: number, baseDelay = 80) {
  const [containerRef, isContainerVisible] = useScrollReveal<HTMLDivElement>(0.1, '0px 0px -40px 0px');

  const getStaggerStyle = (index: number) => ({
    transitionDelay: isContainerVisible ? `${index * baseDelay}ms` : '0ms',
  });

  return { containerRef, isContainerVisible, getStaggerStyle };
}
