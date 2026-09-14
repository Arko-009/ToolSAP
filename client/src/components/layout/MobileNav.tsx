import { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export function MobileNav({ isOpen, onClose, items }: MobileNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap — basic: focus first link when opened
  useEffect(() => {
    if (isOpen && navRef.current) {
      const firstLink = navRef.current.querySelector('a, button');
      if (firstLink instanceof HTMLElement) {
        firstLink.focus();
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <div
        ref={navRef}
        className={`
          fixed top-16 right-0 bottom-0 z-50 w-72 bg-white/98 backdrop-blur-md shadow-2xl border-l border-neutral-200/80
          transform transition-transform duration-300 ease-in-out
          md:hidden flex flex-col justify-between
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2 px-2">Navigation</p>
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
                  ${isActive
                    ? 'text-primary-700 bg-primary-50 font-semibold'
                    : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/70'
                  }`
                }
              >
                <item.icon className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-200/80 bg-neutral-50/50 space-y-2">
          <Link
            to="/tools"
            onClick={onClose}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            Explore Developer Tools
          </Link>
          <Link
            to="/learning"
            onClick={onClose}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-xs"
          >
            Start Learning Free
          </Link>
        </div>
      </div>
    </>
  );
}
